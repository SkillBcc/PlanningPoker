const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes("case 'SYNC':")) {
  code = code.replace("case 'PING': {", "");
  code = code.replace("case 'JOIN_ROOM':", "case 'PING': { break; }\n        case 'SYNC': {\n          if (currentUser) {\n            broadcastRoomState(currentUser.roomId);\n          }\n          break;\n        }\n        case 'JOIN_ROOM':");
  fs.writeFileSync('server.ts', code);
}
