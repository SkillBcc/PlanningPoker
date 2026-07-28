import fs from 'fs';
let code = fs.readFileSync('src/core/services/WebSocketService.ts', 'utf8');

code = code.replace(
  "this.ws.send(JSON.stringify({ type: 'PING' }));",
  "this.ws.send(JSON.stringify({ type: 'SYNC' }));"
);

code = code.replace(
  "private pingTimer: NodeJS.Timeout | null = null;",
  "private pingTimer: NodeJS.Timeout | null = null;\n  private pongTimeout: NodeJS.Timeout | null = null;"
);

code = code.replace(
  "this.stopPing();",
  "this.stopPing();\n      if (this.pongTimeout) clearTimeout(this.pongTimeout);"
);

// handle PONG
const messageHandling = `    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'PONG') {
        if (this.pongTimeout) clearTimeout(this.pongTimeout);
        return;
      }
      if (data.type === 'ROOM_STATE') {`;

code = code.replace(
`    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'ROOM_STATE') {`, messageHandling);

// Update startPing to include pong timeout
const pingLogic = `  private startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING' }));
        
        if (this.pongTimeout) clearTimeout(this.pongTimeout);
        this.pongTimeout = setTimeout(() => {
          console.warn('WebSocket connection timed out (no PONG received). Reconnecting...');
          if (this.ws) {
             this.ws.close();
          }
        }, 5000); // Wait 5 seconds for PONG
      }
    }, 10000); // Send ping every 10 seconds to keep connection alive
  }`;

code = code.replace(/  private startPing\(\) \{[\s\S]*?10000\);.*?\n  \}/, pingLogic); // if already changed
code = code.replace(/  private startPing\(\) \{[\s\S]*?30000\);.*?\n  \}/, pingLogic);

fs.writeFileSync('src/core/services/WebSocketService.ts', code);
