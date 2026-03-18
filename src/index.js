// Import the express module (CommonJS)
const express = require('express');
const {matchRouter} = require("./routes/matches");


// Create an instance of an Express app
const app = express();

// Use the JSON middleware
app.use(express.json());

// Define the root GET route
app.get('/', (req, res) => {
    res.send('Welcome to your Express server!');
});

app.use('/matches',matchRouter)
// Define the port the server will listen on
const PORT = 8000;

// Start the server and log the URL
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});