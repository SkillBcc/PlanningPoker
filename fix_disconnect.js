import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const disconnectLogic = `        if (!hasOtherConnections) {
          const userIndex = room.users.findIndex(u => u.id === currentUser!.userId);
          if (userIndex !== -1) {
            room.users[userIndex].isOnline = false;
            
            room.tasks.forEach(task => {
              if (!task.isRevealed) {
                delete task.votes[currentUser!.userId];
              }
            });
          }
        }`;

const newDisconnectLogic = `        if (!hasOtherConnections) {
          const userIndex = room.users.findIndex(u => u.id === currentUser!.userId);
          if (userIndex !== -1) {
            room.users[userIndex].isOnline = false;
            // Vote preservation: Do not delete task.votes for disconnected users.
          }
        }`;

code = code.replace(disconnectLogic, newDisconnectLogic);
fs.writeFileSync('server.ts', code);
