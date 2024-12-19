const { ChatServer } = require('./server/ChatServer');

const chatServer = new ChatServer({ port: 4108 });

chatServer.init();