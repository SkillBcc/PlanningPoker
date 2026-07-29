import { WebSocket } from 'ws';
const ws = new WebSocket('ws://localhost:3000');
ws.on('open', () => {
  console.log('Connected');
  ws.send(JSON.stringify({
    type: 'JOIN_ROOM',
    payload: {
      roomId: 'test_room',
      user: { id: 'test_user', name: 'Test' },
      initialTask: 'Task 1',
      deckType: 'simplified'
    }
  }));
});
ws.on('message', (data) => {
  console.log('Message:', data.toString().substring(0, 50));
});
ws.on('close', (code, reason) => {
  console.log('Closed:', code, reason.toString());
});
ws.on('error', (err) => {
  console.log('Error:', err);
});
setTimeout(() => ws.close(), 10000);
