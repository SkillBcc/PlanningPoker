import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/  ws\.on\('close', \(\) => \{[\s\S]*?\}\);\n\}\);/g, "  });\n});"); // Wait, no, it's better to just write the file completely? Or restore from git?
fs.writeFileSync('server.ts', code);
