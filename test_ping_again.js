import fs from 'fs';
let code = fs.readFileSync('src/core/services/WebSocketService.ts', 'utf8');
code = code.replace("if (this.pongTimeout) clearTimeout(this.pongTimeout);", "");
code = code.replace("this.pongTimeout = setTimeout(() => {", "if (false) {");
code = code.replace(/this\.ws\.close\(\);/g, "// this.ws.close();");
fs.writeFileSync('src/core/services/WebSocketService.ts', code);
