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

  // 2) Handle complete audio blob
  socket.on('audioBlob', async ({ audioBase64 }) => {
    try {
      console.log('[Backend] ← Received audio blob');
      
      // STT
      const form = new FormData();
      form.append('file', Buffer.from(audioBase64, 'base64'), 'user.webm');
      form.append('language', 'english');
      
      const sttRes = await axios.post(
        'https://api.lemonfox.ai/v1/audio/transcriptions',
        form,
        { 
          headers: { 
            ...form.getHeaders(),
            Authorization: `Bearer ${process.env.LEMONFOX_API_KEY}`
          }
        }
      );
      
      const userText = sttRes.data.text.trim();
      if (!userText) {
        console.log('[Backend] Empty transcription—skipping');
        return;
      }
      
      console.log('[Backend] → STT result:', userText);
      socket.emit('userText', userText);

      // Add user's message to history
      chatHistories.get(socket.id).push({
        role: 'user',
        content: userText
      });

      // Chat: ask the LLM for a hint
      const chat = await openai.chat.completions.create({
        model: 'llama-8b-chat',
        messages: chatHistories.get(socket.id),
        temperature: 0.2
      });
      
      const hint = chat.choices[0].message.content.trim();
      console.log('[Backend] → Generated hint:', hint);
      
      // Add assistant's response to history
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
      console.log('[Backend] → Sending TTS audio for hint');
      socket.emit('botAudio', hintB64);
      socket.emit('botSpeaking', false);

    } catch(err) {
      console.error('[Backend] Error processing audio blob:', err);
      socket.emit('error', 'Something went wrong; please try again.');
      socket.emit('botSpeaking', false);
    }
  });

  // Clean up chat history when socket disconnects
  socket.on('disconnect', () => {
    chatHistories.delete(socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[Backend] Server listening on port ${PORT}`);
});

