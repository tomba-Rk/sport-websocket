// Import the express module (CommonJS)
const express = require('express');
const {matchRouter} = require("./routes/matches");
const http = require("http");
const {attachWebSocketServer} = require("./ws/server");
const {securityMiddleware} = require("./arcjet");


const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || '0.0.0.0';

// Create an instance of an Express app
const app = express();
const server = http.createServer(app);

// Use the JSON middleware
app.use(express.json());

// Define the root GET route
app.get('/', (req, res) => {
    res.send('Welcome to your Express server!');
});

app.use(securityMiddleware());

app.use('/matches',matchRouter)
// Define the port the server will listen on

const {broadcastMatchCreated} = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;


// Start the server and log the URL
server.listen(PORT, HOST,() => {

    const baseUrl= HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
    console.log(`Server is running on ${baseUrl}`);
    console.log(`WebSocket server is running on ${baseUrl.replace('http', 'ws')}/ws`)
});