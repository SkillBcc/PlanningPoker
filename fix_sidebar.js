import fs from 'fs';
let code = fs.readFileSync('src/features/room/components/TaskSidebar.tsx', 'utf8');
code = code.replace(
  "const votesArray = Object.values(task.votes || {}) as { userName: string; vote: string }[];",
  "const votesArray = Object.values(task.votes || {}) as { userName: string; vote: string; disregarded?: boolean }[];"
);
code = code.replace(
  "const numericVotes = votesArray",
  "const numericVotes = votesArray.filter(v => !v.disregarded)"
);
fs.writeFileSync('src/features/room/components/TaskSidebar.tsx', code);
