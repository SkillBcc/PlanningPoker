import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { wsService, RoomState } from '../services/WebSocketService';
import { Copy, LogOut, Trash2, Plus, Edit2, Check, CheckCircle2, ChevronDown, ChevronRight, Eye, EyeOff, AlertTriangle, X } from 'lucide-react';
import logoImage from '../assets/images/planning_poker_white_p_logo_1782837649464.jpg';

const DECK = ['0', '1', '2', '3', '5', '8', '13', '?'];

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [taskInput, setTaskInput] = useState('');
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');
  const [isParticipantsExpanded, setIsParticipantsExpanded] = useState(true);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string, title: string } | null>(null);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [hasName, setHasName] = useState(!!wsService.getUserName());
  const [nameInput, setNameInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState('');

  const currentUserId = wsService.getUserId();
  const currentUser = roomState?.users.find(u => u.id === currentUserId);
  const activeTask = roomState?.tasks?.find(t => t.id === roomState.activeTaskId);
  const isRevealed = activeTask?.isRevealed ?? false;
  const isOwner = roomState?.ownerId === currentUserId;

  useEffect(() => {
    if (!roomState?.createdAt) return;

    const calculateTimeLeft = () => {
      const now = Date.now();
      const expiresAt = roomState.createdAt + 24 * 60 * 60 * 1000;
      const msLeft = expiresAt - now;

      if (msLeft <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(msLeft / (1000 * 60 * 60));
      const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((msLeft % (1000 * 60)) / 1000);
      
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      setTimeLeft(`Expires in ${timeString}`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [roomState?.createdAt]);

  useEffect(() => {
    if (!roomId || !hasName) return;
    
    const userName = wsService.getUserName();
    if (!userName) return;

    const initialTask = location.state?.initialTask;
    wsService.connect(roomId, userName, initialTask);

    const roomSub = wsService.roomState$.subscribe(state => {
      setRoomState(state);
    });
    
    const connSub = wsService.connectionStatus$.subscribe(status => {
      setIsConnected(status);
    });

    const closedSub = wsService.isClosed$.subscribe(closed => {
      setIsClosed(closed);
    });

    return () => {
      roomSub.unsubscribe();
      connSub.unsubscribe();
      closedSub.unsubscribe();
      wsService.disconnect();
    };
  }, [roomId, hasName, navigate]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVote = (vote: string) => {
    wsService.vote(currentUser?.vote === vote ? null : vote);
  };

  const handleReveal = () => {
    if (isRevealed) {
      wsService.reset();
    } else {
      wsService.reveal();
    }
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskInput.trim()) {
      const trimmedInput = taskInput.trim();
      const taskExists = roomState?.tasks.some(
        task => task.title.toLowerCase() === trimmedInput.toLowerCase()
      );

      if (taskExists) {
        setTaskError('This task already exists. Please choose another name.');
        return;
      }

      wsService.addTask(trimmedInput);
      setTaskInput('');
      setTaskError(null);
    }
  };
  
  if (isClosed) {
    return (
      <div className="bg-[#0A0A0B] text-zinc-300 min-h-screen flex flex-col items-center justify-center font-sans px-4">
        <div className="w-full max-w-md bg-[#0E0E10] border border-zinc-800 p-8 rounded-2xl shadow-2xl text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-medium tracking-tight text-white">Session Closed</h1>
            <p className="text-sm text-zinc-400">
              This voting room has been closed because all participants left or the session expired.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg font-medium transition-colors text-sm shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              Back to Home Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasName) {
    return (
      <div className="bg-[#0A0A0B] text-zinc-300 min-h-screen flex flex-col items-center justify-center font-sans">
        <div className="w-full max-w-sm bg-[#0E0E10] border border-zinc-800 p-8 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-center gap-3 mb-8">
            <img 
              src={logoImage} 
              alt="Planning Poker Logo" 
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-lg object-cover shadow-lg border border-zinc-700/50"
            />
            <h1 className="text-xl font-medium tracking-tight text-white">Join planpoker.tech</h1>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (nameInput.trim()) {
              wsService.setUserName(nameInput.trim());
              setHasName(true);
            }
          }} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Your Name</label>
              <input
                type="text"
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                placeholder="Enter your name to join..."
              />
            </div>
            <button
              type="submit"
              disabled={!nameInput.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-lg font-medium transition-colors text-sm"
            >
              Enter Room
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!roomState) {
    return (
      <div className="bg-[#0A0A0B] text-zinc-300 min-h-screen flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <span className="flex h-4 w-4 rounded-full bg-indigo-500 animate-pulse"></span>
          <p className="text-zinc-500 font-mono tracking-tighter">CONNECTING TO ROOM...</p>
        </div>
      </div>
    );
  }

  // Pre-calculate user initials and colors based on string
  const getUserColor = (name: string) => {
    const colors = ['bg-emerald-500/20 text-emerald-400', 'bg-indigo-500/20 text-indigo-400', 'bg-orange-500/20 text-orange-400', 'bg-purple-500/20 text-purple-400'];
    const charSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[charSum % colors.length];
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const onlineUsers = roomState.users.filter(u => u.isOnline);
  const onlineVotingUsers = roomState.users.filter(u => u.isOnline && !u.isSpectator);
  const allVoted = onlineVotingUsers.length > 0 && onlineVotingUsers.every(u => u.hasVoted);

  const isSpectatorDisabled = Boolean(roomState?.tasks.some(task => 
    task.isRevealed && task.votes[currentUserId]
  ));

  return (
    <div className="bg-[#0A0A0B] text-zinc-300 h-screen w-full flex flex-col font-sans overflow-hidden">
      {/* Header Navigation */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-zinc-800 bg-[#0E0E10] shrink-0">
        <div className="flex items-center gap-3">
          <img 
            src={logoImage} 
            alt="Planning Poker Logo" 
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-lg object-cover shadow-lg border border-zinc-700/50"
          />
          <h1 className="text-xl font-medium tracking-tight text-white">
            planpoker.tech <span className="text-zinc-500 font-normal">/ Session #{roomId}</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowLeaveConfirmation(true)} className="text-zinc-500 hover:text-white transition-colors" title="Leave Room">
            <LogOut className="w-5 h-5" />
          </button>
          <div 
            onClick={handleCopyLink}
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-md cursor-pointer hover:bg-zinc-800 transition-colors min-w-[180px] justify-between"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-xs text-zinc-500 uppercase tracking-widest shrink-0">Invite Link:</span>
              <code className="text-sm text-indigo-400 truncate max-w-[100px]">{roomId}</code>
            </div>
            {copied ? (
              <span className="text-[10px] text-emerald-400 font-medium tracking-wider uppercase flex items-center gap-1 shrink-0"><Check className="w-3 h-3" /> Copied</span>
            ) : (
              <Copy className="w-4 h-4 text-zinc-500 hover:text-white shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-md">
            <button
              disabled={isSpectatorDisabled}
              onClick={() => wsService.toggleSpectator(!currentUser?.isSpectator)}
              className={`text-xs font-semibold uppercase tracking-wider select-none transition-colors focus:outline-none ${
                isSpectatorDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              } ${currentUser?.isSpectator ? 'text-indigo-400' : 'text-zinc-500'}`}
              title={isSpectatorDisabled ? "Cannot switch during active reveal" : currentUser?.isSpectator ? "Switch to Voter Mode" : "Switch to Spectator Mode"}
            >
              Spectator Mode
            </button>
            <button
              role="switch"
              aria-checked={currentUser?.isSpectator}
              disabled={isSpectatorDisabled}
              onClick={() => wsService.toggleSpectator(!currentUser?.isSpectator)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isSpectatorDisabled ? 'opacity-40 cursor-not-allowed' : ''
              } ${currentUser?.isSpectator ? 'bg-indigo-600' : 'bg-zinc-700'}`}
              title={isSpectatorDisabled ? "Cannot switch during active reveal" : currentUser?.isSpectator ? "Switch to Voter Mode" : "Switch to Spectator Mode"}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  currentUser?.isSpectator ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {isOwner && (
            <button 
              onClick={handleReveal}
              disabled={!roomState.activeTaskId}
              className={`px-5 py-2 rounded-md font-medium transition-all duration-300 relative ${
                !roomState.activeTaskId
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : isRevealed 
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white' 
                    : allVoted
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-105'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {allVoted && !isRevealed && roomState.activeTaskId && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#0E0E10]"></span>
                </span>
              )}
              {isRevealed ? 'Reset Board' : 'Reveal Cards'}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar: Tasks and Participants */}
        <aside className="w-72 border-r border-zinc-800 bg-[#0E0E10] p-6 flex flex-col gap-6 shrink-0 overflow-hidden">
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            {roomState.tasks.length > 0 && (
              <div className="flex flex-col min-h-0 flex-1">
                <h3 className="text-xs font-semibold uppercase text-zinc-500 tracking-wider mb-2 shrink-0">Tasks</h3>
                <ul className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                  {roomState.tasks.map(task => {
                    const isSelected = roomState.activeTaskId === task.id;
                    const votesArray = Object.values(task.votes || {}) as { userName: string; vote: string }[];
                    const votesCount = votesArray.length;
                    const isEditing = editingTaskId === task.id;
                    
                    let avgDisplay = null;
                    if (task.isRevealed) {
                      const numericVotes = votesArray
                        .map(v => parseInt(v.vote, 10))
                        .filter(n => !isNaN(n));
                      
                      if (numericVotes.length > 0) {
                        const avg = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
                        avgDisplay = `Avg: ${avg.toFixed(1)}`;
                      } else {
                        avgDisplay = `No numeric`;
                      }
                    }

                    return (
                      <li 
                        key={task.id} 
                        className={`p-2 rounded-md border text-sm transition-colors flex justify-between items-center group ${isSelected ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400'} ${isOwner ? 'cursor-pointer hover:bg-zinc-800' : ''}`}
                        onClick={() => {
                          if (isOwner && !isEditing) wsService.setActiveTask(task.id);
                        }}
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          {isEditing ? (
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                const trimmedEditingTitle = editingTaskTitle.trim();
                                if (trimmedEditingTitle) {
                                  const taskExists = roomState.tasks.some(
                                    t => t.id !== task.id && t.title.toLowerCase() === trimmedEditingTitle.toLowerCase()
                                  );
                                  if (taskExists) {
                                    alert('This task already exists. Please choose another name.');
                                    return;
                                  }
                                  wsService.editTask(task.id, trimmedEditingTitle);
                                }
                                setEditingTaskId(null);
                              }}
                              className="flex items-center gap-2"
                            >
                              <input 
                                type="text"
                                autoFocus
                                value={editingTaskTitle}
                                onChange={(e) => setEditingTaskTitle(e.target.value)}
                                className="flex-1 min-w-0 bg-zinc-800 text-white px-2 py-1 text-xs rounded border border-zinc-700 focus:outline-none focus:border-indigo-500"
                                onBlur={() => setEditingTaskId(null)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                type="submit"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                }}
                                className="p-1 text-green-500 hover:text-green-400 shrink-0"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setEditingTaskId(null);
                                }}
                                className="p-1 text-zinc-500 hover:text-zinc-300 shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </form>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="truncate pr-2" title={task.title}>{task.title}</span>
                              {task.isRevealed && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                            </div>
                          )}
                          {!isEditing && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-zinc-500">{votesCount} {votesCount === 1 ? 'vote' : 'votes'}</span>
                              {avgDisplay && (
                                <>
                                  <span className="text-[10px] text-zinc-600">•</span>
                                  <span className="text-[10px] text-emerald-500 font-medium">{avgDisplay}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        {isOwner && !isEditing && (
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setEditingTaskId(task.id);
                                setEditingTaskTitle(task.title);
                              }}
                              className="text-zinc-600 hover:text-indigo-400 p-1 shrink-0"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {roomState.tasks.length > 1 && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setTaskToDelete({ id: task.id, title: task.title }); }}
                                className="text-zinc-600 hover:text-red-400 p-1 shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            
            {isOwner && (
              <form onSubmit={handleTaskSubmit} className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 shrink-0">
                <label className="text-xs text-zinc-500 leading-relaxed block mb-2">
                  Add new task:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={taskInput}
                    onChange={(e) => {
                      setTaskInput(e.target.value);
                      if (taskError) setTaskError(null);
                    }}
                    placeholder="e.g. US-204"
                    className="flex-1 bg-transparent text-zinc-200 font-medium focus:outline-none placeholder-zinc-700 min-w-0 text-sm"
                  />
                  <button type="submit" disabled={!taskInput.trim()} className="text-indigo-400 disabled:opacity-50 hover:text-indigo-300 p-1">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {taskError && (
                  <p className="text-red-400 text-xs mt-2">{taskError}</p>
                )}
              </form>
            )}
          </div>

          <div className="mt-auto pt-6 border-t border-zinc-800 flex flex-col shrink-0 min-h-0 max-h-[50%]">
            <button 
              className="flex items-center justify-between w-full text-xs font-semibold uppercase text-zinc-500 tracking-wider mb-4 hover:text-zinc-300 transition-colors shrink-0"
              onClick={() => setIsParticipantsExpanded(!isParticipantsExpanded)}
            >
              <span>Participants ({roomState.users.length})</span>
              {isParticipantsExpanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
            </button>
             {isParticipantsExpanded && (
              <ul className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {roomState.users.map(user => {
                  const isMe = user.id === currentUserId;
                  
                  if (isMe && isEditingName) {
                    return (
                      <li key={user.id} className="flex items-center justify-between gap-2">
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (editingNameValue.trim() && editingNameValue.trim() !== user.name) {
                              wsService.rename(editingNameValue.trim());
                            }
                            setIsEditingName(false);
                          }}
                          className="flex items-center gap-2 flex-1 min-w-0"
                        >
                          <input
                            type="text"
                            autoFocus
                            value={editingNameValue}
                            onChange={(e) => setEditingNameValue(e.target.value)}
                            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 flex-1 min-w-0"
                          />
                          <button
                            type="submit"
                            disabled={!editingNameValue.trim()}
                            className="text-emerald-500 hover:text-emerald-400 p-1 shrink-0"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditingName(false)}
                            className="text-zinc-500 hover:text-zinc-400 p-1 shrink-0"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      </li>
                    );
                  }

                  return (
                    <li key={user.id} className="flex items-center justify-between group/user">
                      <div className={`flex items-center gap-3 ${user.isOnline ? '' : 'opacity-40'} min-w-0 flex-1`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getUserColor(user.name)}`}>
                          {getInitials(user.name)}
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="text-sm text-zinc-200 truncate max-w-[100px]" title={user.name}>
                            {user.name} {isMe && '(You)'}
                          </span>
                          {isMe && (
                            <button
                              onClick={() => {
                                setEditingNameValue(user.name);
                                setIsEditingName(true);
                              }}
                              className="text-zinc-500 hover:text-indigo-400 p-0.5 transition-colors"
                              title="Edit display name"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {user.isSpectator && (
                          <Eye className="w-3 h-3 text-zinc-500 shrink-0" title="Spectator" />
                        )}
                      </div>
                      {user.isOnline ? (
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Online"></div>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Offline"></div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Main Content: The Table */}
        <section className="flex-1 bg-[#0A0A0B] p-8 flex flex-col items-center justify-center relative overflow-y-auto">
          {/* The "Table" Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-40 auto-rows-max">
            {roomState.users.filter(user => (user.isOnline || (isRevealed && user.hasVoted)) && !user.isSpectator).map(user => {
              if (isRevealed) {
                // Revealed Card
                return (
                  <div key={user.id} className="flex flex-col items-center gap-3">
                    <div className="w-24 h-36 bg-zinc-900 border-2 border-indigo-500/50 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/10">
                      <span className="text-3xl font-bold text-white">{user.vote || '-'}</span>
                    </div>
                    <span className="text-xs text-zinc-400 font-medium truncate w-full text-center">{user.name}</span>
                  </div>
                );
              } else if (user.hasVoted) {
                // Hidden Card (Voted)
                return (
                  <div key={user.id} className="flex flex-col items-center gap-3">
                    <div className="w-24 h-36 bg-zinc-900 border-2 border-emerald-500/50 rounded-xl flex flex-col items-center justify-center shadow-lg shadow-emerald-500/10">
                      <div className="w-8 h-10 border-2 border-emerald-700/50 rounded bg-emerald-900/20 mb-2"></div>
                      <span className="text-[10px] uppercase tracking-widest text-emerald-500/80">Voted</span>
                    </div>
                    <span className="text-xs text-zinc-400 font-medium truncate w-full text-center">{user.name}</span>
                  </div>
                );
              } else {
                // Waiting Card
                return (
                  <div key={user.id} className="flex flex-col items-center gap-3">
                    <div className="w-24 h-36 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-xl flex items-center justify-center">
                      <span className="text-zinc-700 text-xs italic">Waiting...</span>
                    </div>
                    <span className="text-xs text-zinc-500 truncate w-full text-center">{user.name}</span>
                  </div>
                );
              }
            })}
          </div>

          {/* Floating Deck or Average at the bottom */}
          {!roomState.activeTaskId ? (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-[#121214] border border-zinc-800 px-8 py-6 rounded-2xl shadow-2xl z-10 w-max max-w-[90vw] overflow-x-auto text-center">
              <span className="text-sm font-semibold text-zinc-500 tracking-widest">ADD A TASK TO START VOTING</span>
            </div>
          ) : isRevealed ? (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-[#121214] border border-indigo-500/30 px-12 py-6 rounded-2xl shadow-2xl z-10 flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-indigo-400/80 uppercase tracking-widest">Average Estimate</span>
              <span className="text-4xl font-bold text-white">
                {(() => {
                  const votes = roomState.users
                    .filter(u => (u.isOnline || (isRevealed && u.hasVoted)) && !u.isSpectator)
                    .map(u => u.vote)
                    .filter(v => v !== null && v !== '?' && v !== undefined)
                    .map(v => Number(v))
                    .filter(v => !isNaN(v));
                  if (votes.length === 0) return '-';
                  const sum = votes.reduce((a, b) => a + b, 0);
                  return (sum / votes.length).toFixed(1).replace(/\.0$/, '');
                })()}
              </span>
            </div>
          ) : currentUser?.isSpectator ? (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-[#121214] border border-zinc-800 px-8 py-6 rounded-2xl shadow-2xl z-10 w-max max-w-[90vw] overflow-x-auto text-center">
              <span className="text-sm font-semibold text-zinc-500 tracking-widest flex items-center gap-2">
                <Eye className="w-4 h-4" /> SPECTATOR MODE
              </span>
            </div>
          ) : currentUser?.hasVoted ? (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-[#121214] border border-emerald-500/30 px-12 py-6 rounded-2xl shadow-2xl z-10 flex flex-col items-center gap-4">
                <span className="text-xs font-semibold text-emerald-400/80 uppercase tracking-widest flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Vote Submitted
                </span>
                <span className="text-4xl font-bold text-white">{currentUser.vote}</span>
                <button onClick={() => handleVote(currentUser.vote!)} className="text-xs text-zinc-400 hover:text-white underline underline-offset-4 transition-colors">
                  Change Vote
                </button>
              </div>
          ) : (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-[#121214] border border-zinc-800 px-8 py-6 rounded-2xl shadow-2xl z-10 w-max max-w-[90vw] overflow-x-auto">
                <div className="text-center mb-4">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Choose your estimate</span>
                </div>
                <div className="flex gap-3">
                  {DECK.map(v => {
                    const isSelected = currentUser?.vote === v;
                    return (
                      <button
                        key={v}
                        onClick={() => handleVote(v)}
                        className={`shrink-0 w-12 sm:w-14 h-16 sm:h-20 bg-zinc-800 hover:bg-zinc-700 border rounded-lg flex items-center justify-center text-lg font-bold transition-all ${
                          isSelected 
                            ? 'text-indigo-400 border-indigo-500/30 ring-2 ring-indigo-500/20 bg-zinc-700' 
                            : 'border-zinc-700 text-zinc-300'
                        }`}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>
          )}

          {/* Stats / Summary */}
          <div className="absolute bottom-8 right-8 z-0 flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className={`flex h-2 w-2 rounded-full ${isConnected ? 'bg-indigo-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-[10px] text-zinc-500 font-mono tracking-tighter">
                {isConnected ? 'REALTIME SYNC ACTIVE' : 'DISCONNECTED'}
              </span>
            </div>
            {timeLeft && (
              <span className="text-[9px] text-zinc-600 font-mono tracking-tighter">
                {timeLeft}
              </span>
            )}
          </div>
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-500/10 rounded-full text-red-500 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Delete task?</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Are you sure you want to delete the task <span className="text-zinc-200 font-medium">"{taskToDelete.title}"</span>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  wsService.deleteTask(taskToDelete.id);
                  setTaskToDelete(null);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Room Confirmation Modal */}
      {showLeaveConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-500/10 rounded-full text-red-500 shrink-0">
                <LogOut className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Leave room?</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Are you sure you want to leave this room?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLeaveConfirmation(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
