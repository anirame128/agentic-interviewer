require('dotenv').config();
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const OpenAI = require('openai');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const openai = new OpenAI({
  apiKey: process.env.LEMONFOX_API_KEY,
  baseURL: 'https://api.lemonfox.ai/v1'
});

// Load the CSV into an array
const problems = [];
fs.createReadStream(path.join(__dirname, 'data', 'leetcode_problems.csv'))
  .pipe(csv())
  .on('data', row => problems.push(row))
  .on('end', () => console.log(`[Backend] Loaded ${problems.length} problems from CSV`));

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Store chat history per socket
const chatHistories = new Map();

io.on('connection', socket => {
  console.log('[Backend] New user connected:', socket.id);
  
  // Initialize chat history for this socket
  chatHistories.set(socket.id, []);

  // 1) Interview kicks off
  socket.on('startInterview', async () => {
    try {
      console.log('[Backend] ← Received startInterview');

      // Pick a random LeetCode problem from our CSV
      const rnd = problems[Math.floor(Math.random() * problems.length)];
      const question = 
        `**${rnd.title}**  (Difficulty: ${rnd.difficulty})\n\n` +
        `${rnd.prompt}\n\n` +
        `Example(s):\n${rnd.examples}`;

      // Initialize chat history with that question as the only system message
      const systemMessage = {
        role: 'system',
        content: `
          You are a strict FAANG-style interviewer.
          Current question: ${rnd.title}
          Prompt: ${rnd.prompt}
          Examples: ${rnd.examples}
          You will never change or add new questions, and will only provide concise hints when the user explicitly asks for a hint.
          Do not wander or hallucinate.
        `
      };
      chatHistories.set(socket.id, [ systemMessage, { role:'assistant', content: question } ]);

      console.log('[Backend] → Asking question:', rnd.title);
      socket.emit('botText', question);
      socket.emit('botSpeaking', true);

      // TTS
      const ttsRes = await axios.post(
        'https://api.lemonfox.ai/v1/audio/speech',
        { 
          input: question, 
          voice: 'sarah', 
          response_format: 'mp3' 
        },
        { 
          headers: { 
            Authorization: `Bearer ${process.env.LEMONFOX_API_KEY}` 
          }, 
          responseType: 'arraybuffer' 
        }
      );
      
      const b64 = Buffer.from(ttsRes.data, 'binary').toString('base64');
      console.log('[Backend] → Sending TTS audio for question');
      socket.emit('botAudio', b64);
      socket.emit('botSpeaking', false);

    } catch(err) {
      console.error('[Backend] Error starting interview:', err);
      socket.emit('error', 'Failed to start interview. Please try again.');
      socket.emit('botSpeaking', false);
    }
  });

  // 2) Handle audio blob from frontend
  socket.on('audioUtterance', async ({ audioBase64 }) => {
    try {
      console.log('[Backend] ← Received audio blob, length:', audioBase64.length);
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      
      // STT for user audio
      const sttRes = await axios.post(
        'https://api.lemonfox.ai/v1/audio/transcriptions',
        audioBuffer,
        {
          headers: {
            Authorization: `Bearer ${process.env.LEMONFOX_API_KEY}`,
            'Content-Type': 'audio/mp3'
          }
        }
      );

      const text = sttRes.data.text.trim();
      console.log('[Backend] → Transcribed text:', text);

      // Filter empty/short input
      if (!text || text.length < 2) return;

      const noiseRe = /^(thank you|hello|hi|okay|um+|ah+)$/i;
      if (noiseRe.test(text)) {
        console.log('[Backend] Dropping likely noise input:', text);
        return;
      }

      socket.emit('userText', text); // Reflect back to frontend

      chatHistories.get(socket.id).push({
        role: 'user',
        content: text
      });

      const chat = await openai.chat.completions.create({
        model: 'llama-8b-chat',
        messages: chatHistories.get(socket.id),
        temperature: 0.2
      });

      const hint = chat.choices[0].message.content.trim();
      console.log('[Backend] → Generated response:', hint);

      chatHistories.get(socket.id).push({
        role: 'assistant',
        content: hint
      });

      socket.emit('botText', hint);
      socket.emit('botSpeaking', true);

      // TTS for hint
      const ttsRes = await axios.post(
        'https://api.lemonfox.ai/v1/audio/speech',
        {
          input: hint,
          voice: 'sarah',
          response_format: 'mp3'
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.LEMONFOX_API_KEY}`
          },
          responseType: 'arraybuffer'
        }
      );

      const hintB64 = Buffer.from(ttsRes.data, 'binary').toString('base64');
      socket.emit('botAudio', hintB64);
      socket.emit('botSpeaking', false);
    } catch (err) {
      console.error('[Backend] Error handling audioUtterance:', err);
      socket.emit('error', 'Something went wrong while processing your audio.');
      socket.emit('botSpeaking', false);
    }
  });

  // 3) Handle direct userText from SpeechRecognition (text only)
  socket.on('userText', async (text) => {
    try {
      console.log('[Backend] ← Received user text:', text);

      // Filter empty/short input
      if (!text || text.length < 2) return;
      const noiseRe = /^(thank you|hello|hi|okay|um+|ah+)$/i;
      if (noiseRe.test(text)) {
        console.log('[Backend] Dropping likely noise input:', text);
        return;
      }

      // Get the last message from chat history
      const chatHistory = chatHistories.get(socket.id);
      const lastMessage = chatHistory[chatHistory.length - 1];

      // If the last message was from the assistant and matches the current text,
      // it means we're receiving an echo of our own message - ignore it
      if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content === text) {
        console.log('[Backend] Ignoring echo of bot message');
        return;
      }

      // Reflect back to frontend UI
      socket.emit('userText', text);

      // Append to chat history
      chatHistories.get(socket.id).push({
        role: 'user',
        content: text
      });

      // Ask the LLM
      const chat = await openai.chat.completions.create({
        model: 'llama-8b-chat',
        messages: chatHistories.get(socket.id),
        temperature: 0.2
      });
      const reply = chat.choices[0].message.content.trim();
      console.log('[Backend] → Generated response:', reply);

      // Save & emit bot response
      chatHistories.get(socket.id).push({
        role: 'assistant',
        content: reply
      });
      socket.emit('botText', reply);
      socket.emit('botSpeaking', true);

      // TTS back to client
      const ttsRes = await axios.post(
        'https://api.lemonfox.ai/v1/audio/speech',
        { input: reply, voice: 'sarah', response_format: 'mp3' },
        {
          headers: { Authorization: `Bearer ${process.env.LEMONFOX_API_KEY}` },
          responseType: 'arraybuffer'
        }
      );
      const b64 = Buffer.from(ttsRes.data, 'binary').toString('base64');
      socket.emit('botAudio', b64);
      socket.emit('botSpeaking', false);
    } catch (err) {
      console.error('[Backend] Error handling userText:', err);
      socket.emit('error', 'Something went wrong while handling your input.');
      socket.emit('botSpeaking', false);
    }
  });

  // Helper function to validate WebM header
  function isValidWebM(buffer) {
    // WebM header starts with 0x1A45DFA3
    const webmHeader = Buffer.from([0x1A, 0x45, 0xDF, 0xA3]);
    return buffer.slice(0, 4).equals(webmHeader);
  }

  // Clean up chat history when socket disconnects
  socket.on('disconnect', () => {
    chatHistories.delete(socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[Backend] Server listening on port ${PORT}`);
});

