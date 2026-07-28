import fs from 'fs';
let code = fs.readFileSync('src/core/services/WebSocketService.ts', 'utf8');
const methodCode = `
  public toggleVoteDisregard(taskId: string, targetUserId: string, disregarded: boolean) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'TOGGLE_VOTE_DISREGARD',
        payload: { taskId, targetUserId, disregarded }
      }));
    }
  }
`;
code = code.replace("public setFinalEstimate", methodCode + "\n  public setFinalEstimate");
fs.writeFileSync('src/core/services/WebSocketService.ts', code);
