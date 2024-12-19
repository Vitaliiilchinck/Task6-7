const { randomUUID } = require('crypto');

class Client {
    constructor(options) {
        this.ws = options.ws;
        this.username = options.username;
        this.sessionId = options.sessionId || randomUUID();

        this.sendOptions();
    }

    sendOptions() {
        this.send({
            type: 'options',
            sessionId: this.sessionId,
            data: {
                username: this.username,
            },
        });
    }

    updateWS(ws) {
        if (this.ws) {
            this.ws.terminate();
        }

        this.ws = ws;
    }

    send(msgObject) {
        if (this.ws && this.ws.readyState === this.ws.OPEN) {
            this.ws.send(JSON.stringify(msgObject));
        } else {
            console.error('Cannot send message, WebSocket is not open');
        }
    }
}

module.exports = { Client };
