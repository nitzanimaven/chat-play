const express = require('express');
const { Configuration, OpenAIApi } = require("openai");
const cors = require('cors');
const axios = require('axios');

const configuration = new Configuration({
    apiKey: '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',
});
const client = new OpenAIApi(configuration);

const app = express();
app.use(express.json());
app.use(cors({
    origin: '*'
}));

let users = [{ id: "1", conversation: [] }];

// POST endpoint for sending prompts and receiving responses
app.post('/chat', async (req, res) => {
    const userPrompt = req.body.prompt;
    const userID = req.body.userID;
    // const userPrompt = "hello! chatGPT";
    if(!userExists(userID)){
        users.push({ id: userID, conversation: [] });
    }
    try {
        const response = await sendMessage(userPrompt,userID);
        res.json({ response, userID });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'An error occurred' });
    }
});

function userExists(userID) {
    return users.some(function(el) {
      return el.id === userID;
    }); 
  }

// Function to send a prompt and receive a response from ChatGPT
async function sendMessage(prompt,userID) {
    users.find(x => x.id == userID).conversation.push({ role: 'user', content: prompt }); // Add user message to conversation
    //   console.log(buildPrompt())
    try {
        const response = await axios.post('https://api.openai.com/v1/engines/text-davinci-003/completions', {
            prompt: buildPrompt(userID),
            max_tokens: 50, // Adjust the response length as per your requirement
            temperature: 0.7, // Adjust the temperature for response randomness
        }, {
            headers: {
                'Authorization': 'Bearer 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', // Replace with your OpenAI API key
                'Content-Type': 'application/json',
            },
        });
        const reply = response.data.choices[0].text.trim();
        users.find(x => x.id == userID).conversation.push({ role: 'assistant', content: reply }); // Add assistant reply to conversation

        users.filter(x => {
            console.log(x.id + ": || ")
            x.conversation.filter(c => console.log(c))
        });
        console.log("----------------------------------------------------------------------------")
        // console.log(users.find(x => x.id === userID).conversation.filter(m => console.log(m)))
        return reply;
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
}

// Function to build the conversation prompt
function buildPrompt(userID) {
    let prompt = '';

    for (const message of users.find(x => x.id == userID).conversation) {
        if (message.role === 'user') {
            prompt += `User: ${message.content}\n`;
        } else {
            prompt += `Assistant: ${message.content}\n`;
        }
    }

    return prompt;
}

// Start the server
app.listen(3000, () => {
    console.log('Server listening on port 3000');
});