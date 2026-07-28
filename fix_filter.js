import fs from 'fs';
let code = fs.readFileSync('src/pages/Room.tsx', 'utf8');
code = code.replace(
  /\.filter\(u => \(u\.isOnline \|\| u\.hasVoted\) \.filter\(u => \(u\.isOnline \|\| u\.hasVoted\) && !u\.isSpectator\)\.filter\(u => \(u\.isOnline \|\| u\.hasVoted\) && !u\.isSpectator\) !u\.isSpectator && !u\.disregarded\)/g,
  ".filter(u => (u.isOnline || u.hasVoted) && !u.isSpectator && !u.disregarded)"
);
fs.writeFileSync('src/pages/Room.tsx', code);
