import fs from 'fs';
let code = fs.readFileSync('src/core/services/WebSocketService.ts', 'utf8');

// First remove the bad pongTimeout clear in onmessage
code = code.replace(
  "        this.stopPing();\n      if (this.pongTimeout) clearTimeout(this.pongTimeout);\n      }",
  "        this.stopPing();\n      }"
);

// Add pongTimeout clear inside stopPing instead
code = code.replace(
  "  private stopPing() {\n    if (this.pingTimer) {\n      clearInterval(this.pingTimer);\n      this.pingTimer = null;\n    }\n  }",
  "  private stopPing() {\n    if (this.pingTimer) {\n      clearInterval(this.pingTimer);\n      this.pingTimer = null;\n    }\n    if (this.pongTimeout) {\n      clearTimeout(this.pongTimeout);\n      this.pongTimeout = null;\n    }\n  }"
);

fs.writeFileSync('src/core/services/WebSocketService.ts', code);
