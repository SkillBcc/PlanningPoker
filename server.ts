import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const port = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Room state
interface User {
  id: string;
  name: string;
  ws: WebSocket | null;
  isOnline: boolean;
  isSpectator: boolean;
}

interface VoteInfo {
  userName: string;
  vote: string;
}

interface RoomTask {
  id: string;
  title: string;
  votes: Record<string, VoteInfo>;
  isRevealed: boolean;
  finalEstimate?: string;
}

interface Room {
  id: string;
  ownerId: string;
  users: User[];
  tasks: RoomTask[];
  activeTaskId: string | null;
  createdAt: number;
  timerSeconds: number;
  timerIsRunning: boolean;
  timerDuration: number;
  autoReveal: boolean;
  deckType?: string;
}

const rooms = new Map<string, Room>();
const closedRooms = new Set<string>();
const ROOM_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 hours

// Cleanup interval to remove rooms older than 24 hours
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    if (now - room.createdAt > ROOM_LIFETIME_MS) {
      room.users.forEach(u => u.ws?.close(1000, 'Room expired after 24 hours'));
      rooms.delete(roomId);
    }
  }
}, 60 * 60 * 1000); // Check every hour

// Timer tick interval
setInterval(() => {
  for (const [roomId, room] of rooms.entries()) {
    if (room.timerIsRunning) {
      if (room.timerSeconds > 0) {
        room.timerSeconds -= 1;
        if (room.timerSeconds === 0) {
          room.timerIsRunning = false;
          if (room.autoReveal && room.activeTaskId) {
            const task = room.tasks.find(t => t.id === room.activeTaskId);
            if (task) {
              task.isRevealed = true;
            }
          }
          room.timerSeconds = room.timerDuration;
        }
        broadcastRoomState(roomId);
      } else {
        room.timerIsRunning = false;
        room.timerSeconds = room.timerDuration;
        broadcastRoomState(roomId);
      }
    }
  }
}, 1000);

wss.on('connection', (ws) => {
  let currentUser: { roomId: string; userId: string } | null = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      switch (data.type) {
        case 'PING': { ws.send(JSON.stringify({ type: 'PONG' })); break; }
        case 'SYNC': {
          if (currentUser) {
            broadcastRoomState(currentUser.roomId);
          }
          break;
        }
        case 'JOIN_ROOM': {
          const { roomId, user, initialTask, deckType } = data.payload;
          if (closedRooms.has(roomId)) {
            ws.send(JSON.stringify({ type: 'ROOM_CLOSED' }));
            break;
          }
          if (!rooms.has(roomId)) {
            const task = initialTask ? {
              id: Date.now().toString(),
              title: initialTask,
              votes: {},
              isRevealed: false
            } : null;
            rooms.set(roomId, { 
              id: roomId, 
              ownerId: user.id,
              users: [], 
              tasks: task ? [task] : [], 
              activeTaskId: task ? task.id : null, 
              createdAt: Date.now(),
              timerSeconds: 120,
              timerIsRunning: false,
              timerDuration: 120,
              autoReveal: false,
              deckType: deckType || 'simplified'
            });
          }
          const room = rooms.get(roomId)!;
          
          const existingUserIndex = room.users.findIndex(u => u.id === user.id);
          if (existingUserIndex >= 0) {
            room.users[existingUserIndex] = { ...room.users[existingUserIndex], name: user.name, ws, isOnline: true };
          } else {
            room.users.push({ ...user, ws, isOnline: true, isSpectator: false });
          }
          
          currentUser = { roomId, userId: user.id };
          broadcastRoomState(roomId);
          break;
        }
        case 'VOTE': {
          if (!currentUser) return;
          const room = rooms.get(currentUser.roomId);
          if (room && room.activeTaskId) {
            if (room.timerSeconds <= 0) return; // Block voting if timer reached the end
            const task = room.tasks.find(t => t.id === room.activeTaskId);
            if (task && !task.isRevealed) {
              const user = room.users.find(u => u.id === currentUser!.userId);
              if (user) {
                if (data.payload.vote === null) {
                  delete task.votes[user.id];
                } else {
                  task.votes[user.id] = { userName: user.name, vote: data.payload.vote };
                }
                broadcastRoomState(room.id);
              }
            }
          }
          break;
        }
        case 'REVEAL': {
          if (!currentUser) return;
          const room = rooms.get(currentUser.roomId);
          if (room && room.ownerId === currentUser.userId && room.activeTaskId) {
            const task = room.tasks.find(t => t.id === room.activeTaskId);
            if (task) {
              task.isRevealed = true;
              room.timerIsRunning = false;
              room.timerSeconds = room.timerDuration;
              broadcastRoomState(room.id);
            }
          }
          break;
        }
        case 'RESET': {
          if (!currentUser) return;
          const room = rooms.get(currentUser.roomId);
          if (room && room.ownerId === currentUser.userId && room.activeTaskId) {
            const task = room.tasks.find(t => t.id === room.activeTaskId);
            if (task) {
              task.isRevealed = false;
              task.votes = {};
              room.timerIsRunning = false;
              room.timerSeconds = room.timerDuration;
              broadcastRoomState(room.id);
            }
          }
          break;
        }
        case 'ADD_TASK': {
          if (!currentUser) return;
          const room = rooms.get(currentUser.roomId);
          if (room && room.ownerId === currentUser.userId) {
            const newTask: RoomTask = {
              id: Date.now().toString(),
              title: data.payload.title,
              votes: {},
              isRevealed: false
            };
            room.tasks.push(newTask);
            if (!room.activeTaskId) {
              room.activeTaskId = newTask.id;
            }
            broadcastRoomState(room.id);
          }
          break;
        }
        case 'SET_ACTIVE_TASK': {
          if (!currentUser) return;
          const room = rooms.get(currentUser.roomId);
          if (room && room.ownerId === currentUser.userId) {
            room.activeTaskId = data.payload.taskId;
            room.timerIsRunning = false;
            room.timerSeconds = room.timerDuration;
            broadcastRoomState(room.id);
          }
          break;
        }
        case 'START_TIMER': {
          if (!currentUser) return;
          const room = rooms.get(currentUser.roomId);
          if (room && room.ownerId === currentUser.userId) {
            room.timerIsRunning = true;
            broadcastRoomState(room.id);
          }
          break;
        }
        case 'PAUSE_TIMER': {
          if (!currentUser) return;
          const room = rooms.get(currentUser.roomId);
          if (room && room.ownerId === currentUser.userId) {
            room.timerIsRunning = false;
            broadcastRoomState(room.id);
          }
          break;
        }
        case 'RESET_TIMER': {
          if (!currentUser) return;
          const room = rooms.get(currentUser.roomId);
          if (room && room.ownerId === currentUser.userId) {
            room.timerIsRunning = false;
            room.timerSeconds = room.timerDuration;
            broadcastRoomState(room.id);
          }
          break;
        }
        case 'SET_TIMER_DURATION': {
          if (!currentUser) return;
          const room = rooms.get(currentUser.roomId);
          if (room && room.ownerId === currentUser.userId) {
            room.timerDuration = data.payload.duration;
            room.timerSeconds = data.payload.duration;
            room.timerIsRunning = false;
            broadcastRoomState(room.id);
          }
          break;
        }
        case 'SET_AUTO_REVEAL': {
          if (!currentUser) return;
          const room = rooms.get(currentUser.roomId);
          if (room && room.ownerId === currentUser.userId) {
            room.autoReveal = data.payload.autoReveal;
            broadcastRoomState(room.id);
          }
          break;
        }
        case 'EDIT_TASK': {
          if (!currentUser) return;
          const room = rooms.get(currentUser.roomId);
          if (room && room.ownerId === currentUser.userId) {
            const task = room.tasks.find(t => t.id === data.payload.taskId);
            if (task) {
              task.title = data.payload.title;
              broadcastRoomState(room.id);
            }
          }
          break;
        }
        case 'SET_FINAL_ESTIMATE': {
          if (!currentUser) return;
          const room = rooms.get(currentUser.roomId);
          if (room && room.ownerId === currentUser.userId) {
            const task = room.tasks.find(t => t.id === data.payload.taskId);
            if (task) {
              task.finalEstimate = data.payload.finalEstimate;
              broadcastRoomState(room.id);
            }
          }
          break;
        }
        case 'CHANGE_DECK': {
          if (!currentUser) return;
          const room = rooms.get(currentUser.roomId);
          if (room && room.ownerId === currentUser.userId) {
            room.deckType = data.payload.deckType;
            broadcastRoomState(room.id);
          }
          break;
        }
        case 'DELETE_TASK': {
          if (!currentUser) return;
          const room = rooms.get(currentUser.roomId);
          if (room && room.ownerId === currentUser.userId) {
            // Prevent deleting the very last task if we want to enforce always having one
            if (room.tasks.length <= 1) {
              return;
            }
            room.tasks = room.tasks.filter(t => t.id !== data.payload.taskId);
            if (room.activeTaskId === data.payload.taskId) {
              room.activeTaskId = room.tasks.length > 0 ? room.tasks[0].id : null;
            }
            broadcastRoomState(room.id);
          }
          break;
        }
        case 'TOGGLE_SPECTATOR': {
          if (!currentUser) return;
          const room = rooms.get(currentUser.roomId);
          if (room) {
            const userIndex = room.users.findIndex(u => u.id === currentUser!.userId);
            if (userIndex !== -1) {
              room.users[userIndex].isSpectator = data.payload.isSpectator;
              if (data.payload.isSpectator) {
                room.tasks.forEach(task => {
                  if (!task.isRevealed) {
                    delete task.votes[currentUser!.userId];
                  }
                });
              }
              broadcastRoomState(room.id);
            }
          }
          break;
        }
        case 'RENAME': {
          if (!currentUser) return;
          const room = rooms.get(currentUser.roomId);
          if (room) {
            const userIndex = room.users.findIndex(u => u.id === currentUser!.userId);
            if (userIndex !== -1) {
              const newName = data.payload.name;
              room.users[userIndex].name = newName;
              
              // Also update the user's name on any existing votes they have made
              room.tasks.forEach(task => {
                if (task.votes[currentUser!.userId]) {
                  task.votes[currentUser!.userId].userName = newName;
                }
              });
              
              broadcastRoomState(room.id);
            }
          }
          break;
        }
      }
    } catch (e) {
      console.error('Invalid message', e);
    }
  });

  ws.on('close', () => {
    if (currentUser) {
      const room = rooms.get(currentUser.roomId);
      if (room) {
        const userIndex = room.users.findIndex(u => u.id === currentUser!.userId);
        if (userIndex !== -1) {
          room.users[userIndex].isOnline = false;
          room.users[userIndex].ws = null;
          
          room.tasks.forEach(task => {
            if (!task.isRevealed) {
              delete task.votes[currentUser!.userId];
            }
          });
        }
        if (!room.users.some(u => u.isOnline)) {
          closedRooms.add(room.id);
          rooms.delete(room.id);
        } else {
          broadcastRoomState(room.id);
        }
      }
    }
  });
});

function broadcastRoomState(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const activeTask = room.activeTaskId ? room.tasks.find(t => t.id === room.activeTaskId) : null;
  const isRevealed = activeTask ? activeTask.isRevealed : false;

  const state = {
    id: room.id,
    ownerId: room.ownerId,
    activeTaskId: room.activeTaskId,
    tasks: room.tasks,
    createdAt: room.createdAt,
    timerSeconds: room.timerSeconds,
    timerIsRunning: room.timerIsRunning,
    timerDuration: room.timerDuration,
    autoReveal: room.autoReveal,
    deckType: room.deckType || 'simplified',
    // Provide a snapshot of users with their voting status for the active task
    users: room.users.map(u => {
      const voteInfo = activeTask ? activeTask.votes[u.id] : null;
      return {
        id: u.id,
        name: u.name,
        isOnline: u.isOnline,
        isSpectator: u.isSpectator,
        hasVoted: !!voteInfo,
        vote: null // Handled below per-user
      };
    })
  };

  room.users.forEach(u => {
    if (u.isOnline && u.ws && u.ws.readyState === WebSocket.OPEN) {
      const userState = {
        ...state,
        users: room.users.map(otherUser => {
          const voteInfo = activeTask ? activeTask.votes[otherUser.id] : null;
          return {
            id: otherUser.id,
            name: otherUser.name,
            isOnline: otherUser.isOnline,
            isSpectator: otherUser.isSpectator,
            hasVoted: !!voteInfo,
            vote: (isRevealed || otherUser.id === u.id) ? (voteInfo?.vote || null) : null
          };
        })
      };
      u.ws.send(JSON.stringify({ type: 'ROOM_STATE', payload: userState }));
    }
  });
}

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  }

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();
