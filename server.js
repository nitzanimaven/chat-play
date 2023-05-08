const express = require('express');
const { Configuration, OpenAIApi } = require("openai");
const cors = require('cors');
// Create a new Express app
const app = express();
app.use(cors({
    origin: '*'
}));


// Define a function to send a prompt to ChatGPT and get its response
async function getChatResponse(prompt, user,key) {
    try {
        // Set up your OpenAI API key and endpoint
        const configuration = new Configuration({
            apiKey: key,
        });
        const openai = new OpenAIApi(configuration);
        let response = await openai.createCompletion({
            model: 'text-davinci-003',
            prompt: `${user}: ${prompt}\nChatGPT:`,
            max_tokens: 250,
            temperature: 0
        });

        return response.data.choices[0].text.trim();

    } catch (error) {
        console.error(error.message);
    }
}

// Start the server
const server = app.listen(3000, () => {
    console.log('Server listening on port 3000');
});

// Set up socket.io
const io = require('socket.io')(server, { cors: { origin: '*' } });
const users = {};

io.on('connection', (socket) => {
    console.log(`User ${socket.id} connected`);
    socket.on('join', (username) => {
        console.log(`User ${socket.id} joined as ${username}`);
        users[socket.id] = username;
        io.emit('status', `${username} joined the chat`);
    });
    socket.on('chat', (message) => {
        const user = users[socket.id];
        console.log(`User ${socket.id} sent message: ${message.message}`);
        getChatResponse(message.message, user,message.key).then((response) => {
            io.emit('chat', { user, message, response });
        });
    });
    socket.on('disconnect', () => {
        const username = users[socket.id];
        console.log(`User ${socket.id} disconnected`);
        delete users[socket.id];
        io.emit('status', `${username} left the chat`);
    });
});