import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace("ws.on('close', () => {", "ws.on('close', (code, reason) => {\n    console.log('WS CLOSED:', code, reason?.toString());");
fs.writeFileSync('server.ts', code);
