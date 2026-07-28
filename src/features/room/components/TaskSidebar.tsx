import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, AlertTriangle } from 'lucide-react';
import { RoomState } from '../../../core/services/WebSocketService';

interface TaskSidebarProps {
  roomState: RoomState;
  isOwner: boolean;
  actions: {
    setActiveTask: (id: string) => void;
    editTask: (id: string, title: string) => void;
    deleteTask: (id: string) => void;
    addTask: (title: string) => void;
  };
}

export const TaskSidebar = ({ roomState, isOwner, actions }: TaskSidebarProps) => {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [taskError, setTaskError] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string, title: string } | null>(null);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim()) return;

    const taskExists = roomState.tasks.some(t => t.title.toLowerCase() === taskInput.trim().toLowerCase());
    
    if (taskExists) {
      setTaskError('This task already exists. Please choose another name.');
      return;
    }

    actions.addTask(taskInput.trim());
    setTaskInput('');
    setTaskError(null);
  };

  return (
    <aside className="w-72 border-r border-zinc-800 bg-[#0E0E10] p-6 flex flex-col gap-6 shrink-0 overflow-hidden" data-testid="task-sidebar">
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        {roomState.tasks.length > 0 && (
          <div className="flex flex-col min-h-0 flex-1">
            <h3 className="text-xs font-semibold uppercase text-zinc-500 tracking-wider mb-2 shrink-0">Tasks</h3>
            <ul className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {roomState.tasks.map(task => {
                const isSelected = roomState.activeTaskId === task.id;
                const votesArray = Object.values(task.votes || {}) as { userName: string; vote: string; disregarded?: boolean }[];
                const isEditing = editingTaskId === task.id;
                
                let avgDisplay = null;
                if (task.isRevealed) {
                  const numericVotes = votesArray.filter(v => !v.disregarded)
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
                      if (isOwner && !isEditing) actions.setActiveTask(task.id);
                    }}
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      {isEditing ? (
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            const trimmedTitle = editingTaskTitle.trim();
                            if (trimmedTitle) {
                              const exists = roomState.tasks.some(t => t.id !== task.id && t.title.toLowerCase() === trimmedTitle.toLowerCase());
                              if (exists) {
                                alert('This task already exists.');
                                return;
                              }
                              actions.editTask(task.id, trimmedTitle);
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
                            onClick={(e) => e.stopPropagation()}
                            onBlur={() => setEditingTaskId(null)}
                            className="bg-zinc-950 border border-zinc-700 text-white text-xs px-2 py-1 rounded w-full focus:outline-none focus:border-indigo-500"
                          />
                          <button type="submit" className="text-emerald-500 hover:text-emerald-400 p-1 bg-emerald-500/10 rounded" onClick={(e) => e.stopPropagation()}>
                            <Check className="w-3 h-3" />
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setEditingTaskId(null); }} className="text-zinc-500 hover:text-zinc-400 p-1 bg-zinc-800 rounded">
                            <X className="w-3 h-3" />
                          </button>
                        </form>
                      ) : (
                        <span className="truncate font-medium block" title={task.title}>
                          {task.title}
                        </span>
                      )}
                      
                      {task.isRevealed && !isEditing && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-zinc-800 text-zinc-400'}`}>
                            {avgDisplay}
                          </span>
                          {task.finalEstimate && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/10 text-emerald-500'}`}>
                              Final: {task.finalEstimate}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {isOwner && !isEditing && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTaskId(task.id);
                            setEditingTaskTitle(task.title);
                          }}
                          className="p-1.5 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors"
                          title="Edit task"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setTaskToDelete({ id: task.id, title: task.title });
                          }}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {isOwner && (
          <div className="shrink-0 pt-4 border-t border-zinc-800/50">
            <h3 className="text-xs font-semibold uppercase text-zinc-500 tracking-wider mb-2">Add New Task</h3>
            <form onSubmit={handleAddTask} className="flex flex-col gap-2 relative">
              <div className="flex gap-2 relative">
                <input
                  type="text"
                  value={taskInput}
                  onChange={(e) => {
                    setTaskInput(e.target.value);
                    if (taskError) setTaskError(null);
                  }}
                  placeholder="e.g. Navigation Header"
                  className={`flex-1 bg-zinc-900 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 transition-all ${
                    taskError 
                      ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500' 
                      : 'border-zinc-800 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!taskInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {taskError && (
                <div className="flex items-center gap-1.5 text-rose-400 text-[10px] bg-rose-500/10 px-2 py-1.5 rounded-md border border-rose-500/20">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span className="leading-tight">{taskError}</span>
                </div>
              )}
            </form>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0E0E10] border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-black">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Task</h3>
                <p className="text-sm text-zinc-400 mt-1">Are you sure you want to delete this task?</p>
              </div>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-3 mb-6">
              <span className="text-sm text-zinc-300 font-medium truncate block" title={taskToDelete.title}>
                {taskToDelete.title}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  actions.deleteTask(taskToDelete.id);
                  setTaskToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-rose-900/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
