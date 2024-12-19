const readline = require('readline');
const { ChatClient } = require('./client/ChatClient');

const args = process.argv.slice(2);
const sessionId = args.includes('--sessionId') ? args[args.indexOf('--sessionId') + 1] : null;
const name = args.includes('--name') ? args[args.indexOf('--name') + 1] : null;
const key = args.includes('--key') ? args[args.indexOf('--key') + 1] : null;

if (!name || !key) {
    console.error(
        'Arguments --name and --key are required.\nUsage: node client.js --name <username> --key <encryption_key> [--sessionId <sessionId>]'
    );
    process.exit(1);
}

const client = new ChatClient({ url: 'ws://localhost:2109', username: name, sessionId, key });
client.init();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.on('line', (input) => {
    if (input.trim().toLowerCase() === 'exit') {
        rl.close();
    } else {
        client.send(input);
    }
});
