const WebSocket = require('ws');
const { WebSocketServer } = require('ws');
const { wsArcjet } = require('../arcjet');

//helper fucntion
function sendJson(socket, payload) {
    if(socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
}

//helper function
function broadcast(wss,payload){
    for (const client of wss.clients) {
        if(client.readyState !== WebSocket.OPEN) continue;

        client.send(JSON.stringify(payload));
    }
}


function attachWebSocketServer(server) {
    const wss = new WebSocketServer({
        noServer: true,
        maxPayload: 1024 * 1024
    });

    // Intercept HTTP Upgrade to gate with Arcjet before handshake
    server.on('upgrade', async (req, socket, head) => {
        if (req.url !== '/ws') {
            return; // Not our path; let other handlers (if any) deal with it.
        }

        // If Arcjet is configured, protect before completing the upgrade
        if (wsArcjet) {
            try {
                const decision = await wsArcjet.protect(req);
                if (decision.isDenied()) {
                    // Deny before handshake completes
                    try {
                        socket.destroy();
                    } catch (_) {}
                    return;
                }
            } catch (e) {
                console.error('WS upgrade protect error', e);
                try {
                    socket.destroy();
                } catch (_) {}
                return;
            }
        }

        // Proceed with the WebSocket handshake
        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
        });
    });

    wss.on('connection', (socket, req) => {
        socket.isAlive = true;

        socket.on('pong', () => {
            socket.isAlive = true;
        });

        sendJson(socket, { type: 'welcome' });

        socket.on('error', console.error);
    });

    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) return ws.terminate();

            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    wss.on('close', () => clearInterval(interval));

    function broadcastMatchCreated(match) {
        broadcast(wss, { type: 'match_created', data: match });
    }

    return { broadcastMatchCreated };
}

module.exports = { attachWebSocketServer };