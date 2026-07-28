import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const newCode = `  wss.clients.forEach((client: any) => {
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
  });`;

const lines = code.split('\n');
lines.splice(436, 19, newCode);
fs.writeFileSync('server.ts', lines.join('\n'));
