import fs from 'fs';
let code = fs.readFileSync('src/core/services/WebSocketService.ts', 'utf8');

const badCode = `        if (false) {
          console.warn('WebSocket connection timed out (no PONG received). Reconnecting...');
          if (this.ws) {
             // this.ws.close();
          }
        }, 5000); // Wait 5 seconds for PONG`;

const goodCode = `        /* 
        if (false) {
          console.warn('WebSocket connection timed out (no PONG received). Reconnecting...');
          if (this.ws) {
             // this.ws.close();
          }
        }, 5000); 
        */`;

code = code.replace(badCode, goodCode);
fs.writeFileSync('src/core/services/WebSocketService.ts', code);
