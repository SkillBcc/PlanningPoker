import fs from 'fs';
let code = fs.readFileSync('src/pages/Room.tsx', 'utf8');

const oldGrid = `{roomState.users.filter(user => (user.isOnline || (isRevealed && user.hasVoted)) && !user.isSpectator).map(user => {
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
            })}`;

const newGrid = `{roomState.users.filter(user => (user.isOnline || user.hasVoted) && !user.isSpectator).map(user => {
              if (isRevealed) {
                // Revealed Card
                return (
                  <div key={user.id} className="flex flex-col items-center gap-3 relative group">
                    {isOwner && user.hasVoted && roomState.activeTaskId && (
                      <button
                        onClick={() => wsService.toggleVoteDisregard(roomState.activeTaskId, user.id, !user.disregarded)}
                        className="absolute -top-3 -right-3 z-10 p-1.5 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-500 rounded-full border border-zinc-700 opacity-0 group-hover:opacity-100 transition-all shadow-md"
                        title={user.disregarded ? "Consider vote" : "Disregard vote"}
                      >
                        {user.disregarded ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </button>
                    )}
                    <div className={\`w-24 h-36 border-2 rounded-xl flex items-center justify-center shadow-lg transition-all \${user.disregarded ? 'bg-zinc-900/40 border-zinc-800/50 opacity-50 grayscale shadow-none' : 'bg-zinc-900 border-indigo-500/50 shadow-indigo-500/10'}\`}>
                      <span className={\`text-3xl font-bold \${user.disregarded ? 'text-zinc-600 line-through' : 'text-white'}\`}>{user.vote || '-'}</span>
                    </div>
                    <span className={\`text-xs font-medium truncate w-full text-center \${user.disregarded ? 'text-zinc-600' : 'text-zinc-400'}\`}>
                      {user.name} {user.disregarded && <span className="text-[9px] block text-red-500/70 uppercase">Disregarded</span>}
                    </span>
                  </div>
                );
              } else if (user.hasVoted) {
                // Hidden Card (Voted)
                return (
                  <div key={user.id} className="flex flex-col items-center gap-3 relative group">
                    {isOwner && roomState.activeTaskId && (
                      <button
                        onClick={() => wsService.toggleVoteDisregard(roomState.activeTaskId, user.id, !user.disregarded)}
                        className="absolute -top-3 -right-3 z-10 p-1.5 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-500 rounded-full border border-zinc-700 opacity-0 group-hover:opacity-100 transition-all shadow-md"
                        title={user.disregarded ? "Consider vote" : "Disregard vote"}
                      >
                        {user.disregarded ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </button>
                    )}
                    <div className={\`w-24 h-36 border-2 rounded-xl flex flex-col items-center justify-center shadow-lg transition-all \${user.disregarded ? 'bg-zinc-900/40 border-zinc-800/50 opacity-50 shadow-none' : 'bg-zinc-900 border-emerald-500/50 shadow-emerald-500/10'}\`}>
                      <div className={\`w-8 h-10 border-2 rounded mb-2 \${user.disregarded ? 'border-zinc-700/50 bg-zinc-800/20' : 'border-emerald-700/50 bg-emerald-900/20'}\`}></div>
                      <span className={\`text-[10px] uppercase tracking-widest \${user.disregarded ? 'text-zinc-600' : 'text-emerald-500/80'}\`}>Voted</span>
                    </div>
                    <span className={\`text-xs font-medium truncate w-full text-center \${user.disregarded ? 'text-zinc-600' : 'text-zinc-400'}\`}>
                      {user.name} {user.disregarded && <span className="text-[9px] block text-red-500/70 uppercase">Disregarded</span>}
                    </span>
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
            })}`;

code = code.replace(oldGrid, newGrid);
fs.writeFileSync('src/pages/Room.tsx', code);
