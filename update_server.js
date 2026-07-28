import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

// Update wss.on('connection') to attach currentUser to ws
code = code.replace(
  "wss.on('connection', (ws) => {",
  "wss.on('connection', (ws: any) => {"
);
code = code.replace(
  "let currentUser: { roomId: string; userId: string } | null = null;",
  "let currentUser: { roomId: string; userId: string } | null = null;\n  ws.currentUser = null;"
);

// Update JOIN_ROOM to not store ws in room.users
code = code.replace(
  "          const existingUserIndex = room.users.findIndex(u => u.id === user.id);\n          if (existingUserIndex >= 0) {\n            room.users[existingUserIndex] = { ...room.users[existingUserIndex], name: user.name, ws, isOnline: true };\n          } else {\n            room.users.push({ ...user, ws, isOnline: true, isSpectator: false });\n          }\n          \n          currentUser = { roomId, userId: user.id };\n          broadcastRoomState(roomId);",
  "          const existingUserIndex = room.users.findIndex(u => u.id === user.id);\n          if (existingUserIndex >= 0) {\n            room.users[existingUserIndex] = { ...room.users[existingUserIndex], name: user.name, isOnline: true };\n          } else {\n            room.users.push({ ...user, isOnline: true, isSpectator: false });\n          }\n          \n          currentUser = { roomId, userId: user.id };\n          ws.currentUser = currentUser;\n          broadcastRoomState(roomId);"
);

// Update ws.on('close')
const newClose = `  ws.on('close', () => {
    if (currentUser) {
      const room = rooms.get(currentUser.roomId);
      if (room) {
        let hasOtherConnections = false;
        wss.clients.forEach((client: any) => {
          if (client !== ws && client.readyState === WebSocket.OPEN && client.currentUser && client.currentUser.userId === currentUser.userId) {
            hasOtherConnections = true;
          }
        });

        if (!hasOtherConnections) {
          const userIndex = room.users.findIndex(u => u.id === currentUser!.userId);
          if (userIndex !== -1) {
            room.users[userIndex].isOnline = false;
            
            room.tasks.forEach(task => {
              if (!task.isRevealed) {
                delete task.votes[currentUser!.userId];
              }
            });
          }
        }
        
        if (!room.users.some(u => u.isOnline)) {
          closedRooms.add(room.id);
          rooms.delete(room.id);
        } else {
          broadcastRoomState(room.id);
        }
      }
    }
  });`;
code = code.replace(/  ws\.on\('close', \(\) => \{[\s\S]*?\}\);/m, newClose);

// Update broadcastRoomState
const newBroadcast = `function broadcastRoomState(roomId: string) {
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
    users: room.users.map(u => {
      const voteInfo = activeTask ? activeTask.votes[u.id] : null;
      return {
        id: u.id,
        name: u.name,
        isOnline: u.isOnline,
        isSpectator: u.isSpectator,
        hasVoted: !!voteInfo,
        vote: null
      };
    })
  };
  
  wss.clients.forEach((client: any) => {
    if (client.readyState === WebSocket.OPEN && client.currentUser && client.currentUser.roomId === roomId) {
      const uId = client.currentUser.userId;
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
            vote: (isRevealed || otherUser.id === uId) ? (voteInfo?.vote || null) : null
          };
        })
      };
      client.send(JSON.stringify({ type: 'ROOM_STATE', payload: userState }));
    }
  });
}`;
code = code.replace(/function broadcastRoomState\([\s\S]*?\}\n\}/m, newBroadcast);

fs.writeFileSync('server.ts', code);
