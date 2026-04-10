const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

// Map of room name → Set of connected WebSocket clients
const rooms = new Map();

wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const room = url.searchParams.get('room') || 'default';

    if (!rooms.has(room)) rooms.set(room, new Set());
    rooms.get(room).add(ws);

    console.log(`Client connected to room "${room}" (${rooms.get(room).size} in room)`);

    ws.on('message', (data) => {
        // Broadcast to all other clients in the same room
        rooms.get(room).forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    });

    ws.on('close', () => {
        rooms.get(room).delete(ws);
        if (rooms.get(room).size === 0) rooms.delete(room);
        console.log(`Client disconnected from room "${room}"`);
    });

    ws.on('error', (err) => {
        console.error(`WebSocket error in room "${room}":`, err.message);
    });
});

console.log(`Relay server running on port ${PORT}`);
