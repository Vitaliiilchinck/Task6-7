const { WebSocket } = require('ws');
const crypto = require('crypto');

class ChatClient {
    constructor(options) {
        if (!options.url) {
            throw new Error('WebSocket URL is required');
        }
        if (!options.key) {
            throw new Error('Encryption key is required');
        }

        this.ws = new WebSocket(options.url);
        this.sessionId = options.sessionId || null;
        this.username = options.username;
        this.key = crypto.createHash('sha256').update(options.key).digest(); // Генерація 256-бітного ключа
    }

    init() {
        this.ws.on('open', () => this.onOpen());
        this.ws.on('message', (data) => this.onMessage(data));
        this.ws.on('error', (error) => console.error('WebSocket error:', error));
        this.ws.on('close', () => console.log('Connection closed'));
    }

    onOpen() {
        console.log('Connected to the server');
        this.ws.send(
            JSON.stringify({
                type: 'options',
                sessionId: this.sessionId,
                data: {
                    username: this.username,
                },
            })
        );
    }

    onMessage(data) {
        let parsedData;
        try {
            parsedData = JSON.parse(data);
        } catch (e) {
            console.error('Error parsing message:', e);
            return;
        }

        switch (parsedData.type) {
            case 'message': {
                const decryptedMessage = this.decrypt(parsedData.data.message);
                console.log(`${parsedData.data.sender} >>: ${decryptedMessage}`);
                break;
            }
            case 'options':
                this.setOptions(parsedData);
                break;
            default:
                console.log('Unknown message type:', parsedData.type);
        }
    }

    setOptions(msgObject) {
        this.sessionId = msgObject.sessionId;
        console.log('Your sessionId:', this.sessionId);
    }

    send(message) {
        const encryptedMessage = this.encrypt(message);
        const msgObject = {
            type: 'message',
            sessionId: this.sessionId,
            data: encryptedMessage,
        };

        if (this.ws.readyState === this.ws.OPEN) {
            this.ws.send(JSON.stringify(msgObject));
        } else {
            console.error('Cannot send message, WebSocket is not open');
        }
    }

    encrypt(data) {
        const iv = crypto.randomBytes(16); // Ініціалізаційний вектор
        const cipher = crypto.createCipheriv('aes-256-cbc', this.key, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    }

    decrypt(data) {
        try {
            const [ivHex, encryptedMessage] = data.split(':');
            const iv = Buffer.from(ivHex, 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, iv);
            let decrypted = decipher.update(encryptedMessage, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            console.error('Error decrypting message:', error.message);
            return '[Decryption Error]';
        }
    }
}

module.exports = { ChatClient };
