import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');
const actionCode = `
        case 'TOGGLE_VOTE_DISREGARD': {
          if (!currentUser) return;
          const room = rooms.get(currentUser.roomId);
          if (room && room.ownerId === currentUser.userId) {
            const task = room.tasks.find(t => t.id === data.payload.taskId);
            if (task && task.votes[data.payload.targetUserId]) {
              task.votes[data.payload.targetUserId].disregarded = data.payload.disregarded;
              broadcastRoomState(room.id);
            }
          }
          break;
        }
`;
code = code.replace("case 'SET_FINAL_ESTIMATE': {", actionCode + "        case 'SET_FINAL_ESTIMATE': {");
fs.writeFileSync('server.ts', code);
