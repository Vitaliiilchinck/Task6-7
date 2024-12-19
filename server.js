const { ChatServer } = require('./server/ChatServer');

const chatServer = new ChatServer({ port: 2109 });

chatServer.init();