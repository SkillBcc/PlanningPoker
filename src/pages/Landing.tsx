import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { wsService } from '../services/WebSocketService';
import { Github, Coffee } from 'lucide-react';

import logoImage from '../assets/images/planning_poker_white_p_logo_1782837649464.jpg';

export default function Landing() {
  const navigate = useNavigate();
  const [name, setName] = useState(wsService.getUserName() || '');
  const [roomId, setRoomId] = useState('');
  const [initialTask, setInitialTask] = useState('');

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !initialTask.trim()) return;
    wsService.setUserName(name);
    const newRoomId = uuidv4().substring(0, 8);
    navigate(`/room/${newRoomId}`, { state: { initialTask: initialTask.trim() } });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomId.trim()) return;
    wsService.setUserName(name);
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="bg-[#0A0A0B] text-zinc-300 min-h-screen flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md bg-[#0E0E10] border border-zinc-800 p-8 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img 
            src={logoImage} 
            alt="Planning Poker Logo" 
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-xl object-cover shadow-lg border border-zinc-700/50"
          />
          <h1 className="text-2xl font-medium tracking-tight text-white">Planning Poker</h1>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              placeholder="Enter your name"
            />
          </div>

          <form onSubmit={handleCreateRoom} className="space-y-4 pt-4 border-t border-zinc-800">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Initial Task Name</label>
              <input
                type="text"
                value={initialTask}
                onChange={(e) => setInitialTask(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="e.g. US-101: Login Page"
              />
            </div>
            <button
              type="submit"
              disabled={!name.trim() || !initialTask.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-lg font-medium transition-colors"
            >
              Create New Room
            </button>
          </form>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink-0 mx-4 text-xs text-zinc-500 uppercase">Or</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Room ID</label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="e.g. 43f1xk92"
              />
            </div>
            <button
              type="submit"
              disabled={!name.trim() || !roomId.trim()}
              className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-lg font-medium transition-colors"
            >
              Join Room
            </button>
          </form>
        </div>
      </div>

      <div className="absolute bottom-4 flex flex-col items-center justify-center gap-4">
        <div className="flex gap-4">
          <a 
            href="https://github.com/SkillBcc/PlanningPoke" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-zinc-700 hover:text-zinc-400 transition-colors"
            title="View source on GitHub"
          >
            <Github className="w-5 h-5" />
          </a>
          <a 
            href="https://buymeacoffee.com/skillbcc" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-zinc-700 hover:text-zinc-400 transition-colors"
            title="Support this project"
          >
            <Coffee className="w-5 h-5" />
          </a>
        </div>
        <button 
          onClick={() => navigate('/terms')}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Terms of Use
        </button>
      </div>
    </div>
  );
}
