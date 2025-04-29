require('dotenv').config();
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const OpenAI = require('openai');
const axios = require('axios');
const FormData = require('form-data');

const openai = new OpenAI({
  apiKey: process.env.LEMONFOX_API_KEY,
  baseURL: 'https://api.lemonfox.ai/v1'
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', socket => {
  console.log('[Backend] New user connected:', socket.id);

  // 1) Interview kicks off
  socket.on('startInterview', () => {
    console.log('[Backend] ← Received startInterview');
    const question = "Find the middle node of a singly linked list.";
    socket.emit('botText', question);
    
    // TTS
    axios.post(
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
    )
    .then(res => {
      const b64 = Buffer.from(res.data, 'binary').toString('base64');
      console.log('[Backend] → Sending TTS audio for question');
      socket.emit('botAudio', b64);
    })
    .catch(err => {
      console.error('[Backend] TTS failed:', err);
      socket.emit('error', 'TTS failed');
    });
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

      // Chat: ask the LLM for a hint
      const chat = await openai.chat.completions.create({
        model: 'llama-8b-chat',
        messages: [
          { role: 'system', content:
             "You are a FAANG-style interviewer. The user is stuck on a question. When they ask for a hint, give a single concise hint—not the full solution." },
          { role: 'user', content: userText }
        ]
      });
      const hint = chat.choices[0].message.content.trim();
      console.log('[Backend] → Generated hint:', hint);
      socket.emit('botText', hint);

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

    } catch(err) {
      console.error('[Backend] Error processing audio blob:', err);
      socket.emit('error', 'Something went wrong; please try again.');
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[Backend] Server listening on port ${PORT}`);
});

