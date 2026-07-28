import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const closeLogic = `        if (!room.users.some(u => u.isOnline)) {
          closedRooms.add(room.id);
          rooms.delete(room.id);
        } else {
          broadcastRoomState(room.id);
        }`;

const newCloseLogic = `        broadcastRoomState(room.id);`;

code = code.replace(closeLogic, newCloseLogic);
fs.writeFileSync('server.ts', code);
