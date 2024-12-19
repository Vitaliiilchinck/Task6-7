const { WebSocketServer, WebSocket } = require('ws');
const { Client } = require('./Client');

class ChatServer {
    wss = null;
    clientsMap = new Map();

    constructor(options) {
        this.port = options.port;
    }

    init() {
        this.wss = new WebSocketServer({ port: this.port });

        this.wss.on('connection', (ws) => this.onConnection(ws));
        this.wss.on('error', console.error);

        console.log(`ChatServer started on port ${this.port}`);
    }

    onConnection(ws) {
        console.log('New connection established');

        ws.on('message', (data) => this.onMessage(ws, data));
        ws.on('close', () => {
            console.log('A client disconnected');
            this.removeClient(ws);
        });
    }

    onMessage(ws, data) {
        let msgObject;
        try {
            msgObject = JSON.parse(data.toString());
        } catch (e) {
            console.error('Invalid message format:', e);
            ws.send(
                JSON.stringify({ type: 'error', data: 'Invalid message format' })
            );
            return;
        }

        console.log('Received message:', msgObject);

        switch (msgObject.type) {
            case 'message':
                this.broadcast(msgObject);
                break;
            case 'options':
                this.createClient(ws, msgObject);
                break;
            default:
                console.warn('Unknown message type:', msgObject.type);
        }
    }

    createClient(ws, msgObject) {
        const existingClient = this.clientsMap.get(msgObject.sessionId);

        if (existingClient) {
            existingClient.updateWS(ws);
            console.log(`Client ${existingClient.username} reconnected`);
            return;
        }

        if (!msgObject.data?.username) {
            ws.send(
                JSON.stringify({ type: 'error', data: 'Username is required' })
            );
            return;
        }

        const client = new Client({
            ws,
            username: msgObject.data.username,
            sessionId: msgObject.sessionId,
        });

        this.clientsMap.set(client.sessionId, client);
        console.log(`Client ${client.username} connected`);
    }

    broadcast(msgObject) {
        const sender = this.clientsMap.get(msgObject.sessionId);
        if (!sender) {
            console.error('Sender not found:', msgObject.sessionId);
            return;
        }

        const messageToSend = {
            type: 'message',
            data: {
                sender: sender.username,
                message: msgObject.data,
            },
        };

        this.clientsMap.forEach((client) => {
            if (
                client.ws.readyState === WebSocket.OPEN &&
                client.sessionId !== msgObject.sessionId
            ) {
                client.send(messageToSend);
            }
        });

        console.log(
            `Broadcast message from ${sender.username}: ${msgObject.data}`
        );
    }

    removeClient(ws) {
        // Find and remove the client associated with the WebSocket
        for (const [sessionId, client] of this.clientsMap.entries()) {
            if (client.ws === ws) {
                this.clientsMap.delete(sessionId);
                console.log(`Client ${client.username} disconnected`);
                break;
            }
        }
    }
}

module.exports = { ChatServer };
