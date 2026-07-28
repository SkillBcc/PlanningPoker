import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

export interface UserState {
  id: string;
  name: string;
  hasVoted: boolean;
  vote: string | null;
  isOnline: boolean;
  isSpectator: boolean;
  disregarded?: boolean;
}

export interface TaskState {
  id: string;
  title: string;
  votes: Record<string, { userName: string; vote: string; disregarded?: boolean }>;
  isRevealed: boolean;
  finalEstimate?: string;
}

export interface RoomState {
  id: string;
  ownerId: string;
  activeTaskId: string | null;
  tasks: TaskState[];
  createdAt: number;
  users: UserState[];
  timerSeconds: number;
  timerIsRunning: boolean;
  timerDuration: number;
  autoReveal: boolean;
  deckType?: string;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private roomStateSubject = new BehaviorSubject<RoomState | null>(null);
  public roomState$ = this.roomStateSubject.asObservable();
  public connectionStatus$ = new BehaviorSubject<boolean>(false);
  public isClosed$ = new BehaviorSubject<boolean>(false);

  private userId: string;
  private userName: string = '';

  private currentRoomId: string | null = null;
  private currentInitialTask?: string;
  private currentDeckType?: string;
  private intentionalDisconnect = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private pongTimeout: NodeJS.Timeout | null = null;

  constructor() {
    let storedId = localStorage.getItem('poker_user_id');
    if (!storedId) {
      storedId = uuidv4();
      localStorage.setItem('poker_user_id', storedId);
    }
    this.userId = storedId;
    
    const storedName = localStorage.getItem('poker_user_name');
    if (storedName) {
      this.userName = storedName;
    }

    this.setupVisibilityHandler();
  }

  private setupVisibilityHandler() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          // If we came back to the foreground and we're disconnected (and shouldn't be), reconnect immediately
          if (!this.intentionalDisconnect && (!this.ws || this.ws.readyState === WebSocket.CLOSED)) {
            if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
            this._connect();
          } else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            // Send a ping to keep connection alive when foregrounded
            this.ws.send(JSON.stringify({ type: 'SYNC' }));
          }
        }
      });
    }
  }

  public getUserId() {
    return this.userId;
  }

  public getUserName() {
    return this.userName;
  }

  public setUserName(name: string) {
    this.userName = name;
    localStorage.setItem('poker_user_name', name);
  }

  public connect(roomId: string, name: string, initialTask?: string, deckType?: string) {
    this.intentionalDisconnect = false;
    this.currentRoomId = roomId;
    this.currentInitialTask = initialTask;
    this.currentDeckType = deckType;
    this.setUserName(name);
    this._connect();
  }

  private _connect() {
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.ws.close();
    }
    
    if (!this.currentRoomId) return;

    let wsUrl: string;
    if (import.meta.env.VITE_WS_BACKEND_URL) {
      wsUrl = import.meta.env.VITE_WS_BACKEND_URL;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}`;
    }
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.isClosed$.next(false);
      this.connectionStatus$.next(true);
      
      this.ws?.send(JSON.stringify({
        type: 'JOIN_ROOM',
        payload: {
          roomId: this.currentRoomId,
          user: { id: this.userId, name: this.userName },
          initialTask: this.currentInitialTask,
          deckType: this.currentDeckType
        }
      }));

      this.startPing();
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'PONG') {
        if (this.pongTimeout) clearTimeout(this.pongTimeout);
        return;
      }
      if (data.type === 'ROOM_STATE') {
        this.roomStateSubject.next(data.payload);
      } else if (data.type === 'ROOM_CLOSED') {
        this.isClosed$.next(true);
        this.intentionalDisconnect = true; // Stop trying to reconnect if room is completely closed
        this.stopPing();
      }
    };

    this.ws.onclose = () => {
      this.connectionStatus$.next(false);
      this.stopPing();
      
      if (!this.intentionalDisconnect) {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this._connect();
        }, 3000); // Try reconnecting every 3 seconds
      }
    };
  }

  private startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING' }));
        
        if (this.pongTimeout) clearTimeout(this.pongTimeout);
        this.pongTimeout = setTimeout(() => {
          console.warn('WebSocket connection timed out (no PONG received). Reconnecting...');
          if (this.ws) {
             this.ws.close();
          }
        }, 5000); // Wait 5 seconds for PONG
      }
    }, 10000); // Send ping every 10 seconds to keep connection alive
  }

  private stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  public changeDeck(deckType: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'CHANGE_DECK',
        payload: { deckType }
      }));
    }
  }

  public disconnect() {
    this.intentionalDisconnect = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopPing();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.roomStateSubject.next(null);
    this.isClosed$.next(false);
  }

  public vote(vote: string | null) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'VOTE',
        payload: { vote }
      }));
    }
  }

  public reveal() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'REVEAL' }));
    }
  }

  public reset() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'RESET' }));
    }
  }

  public addTask(title: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'ADD_TASK',
        payload: { title }
      }));
    }
  }

  public setActiveTask(taskId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'SET_ACTIVE_TASK',
        payload: { taskId }
      }));
    }
  }

  public editTask(taskId: string, title: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'EDIT_TASK',
        payload: { taskId, title }
      }));
    }
  }

  
  public toggleVoteDisregard(taskId: string, targetUserId: string, disregarded: boolean) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'TOGGLE_VOTE_DISREGARD',
        payload: { taskId, targetUserId, disregarded }
      }));
    }
  }

  public setFinalEstimate(taskId: string, finalEstimate: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'SET_FINAL_ESTIMATE',
        payload: { taskId, finalEstimate }
      }));
    }
  }

  public deleteTask(taskId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'DELETE_TASK',
        payload: { taskId }
      }));
    }
  }

  public toggleSpectator(isSpectator: boolean) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'TOGGLE_SPECTATOR',
        payload: { isSpectator }
      }));
    }
  }

  public rename(name: string) {
    this.setUserName(name);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'RENAME',
        payload: { name }
      }));
    }
  }

  public startTimer() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'START_TIMER' }));
    }
  }

  public pauseTimer() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'PAUSE_TIMER' }));
    }
  }

  public resetTimer() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'RESET_TIMER' }));
    }
  }

  public setTimerDuration(duration: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'SET_TIMER_DURATION',
        payload: { duration }
      }));
    }
  }

  public setAutoReveal(autoReveal: boolean) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'SET_AUTO_REVEAL',
        payload: { autoReveal }
      }));
    }
  }
}

export const wsService = new WebSocketService();
