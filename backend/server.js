require('dotenv').config();
const fs = require('fs').promises;
const http = require('http');
const express = require('express');
const {Server} = require('socket.io');
const OpenAI = require('openai');
const path = require('path');
const os = require('os');
const { generate: generateTTS } = require('./tts_lemonfox');
const { transcribe } = require('./stt_lemonfox');

const openai = new OpenAI({
    apiKey: process.env.LEMONFOX_API_KEY,
    baseURL: 'https://api.lemonfox.ai/v1',
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {origin: '*'}
});

const sessions = {};
const PAUSE_MS = 2000; // 2 seconds pause to trigger bot response

io.on('connection', (socket) => {
    console.log('[Backend] New user connected:', socket.id);

    socket.on('startInterview', ({durationMinutes}) => {
        console.log('[Backend] ← Received startInterview, duration:', durationMinutes);
        sessions[socket.id] = {
            start: Date.now(),
            duration: durationMinutes * 60 * 1000,
            buffer: '',
            pauseTimer: null,
            chatHistory: [
                {role: 'system', content: 'You are a friendly FAANG-style interviewer.'}
            ]
        };

        sessions[socket.id].timer = setTimeout(() => {
            console.log('[Backend] Timer expired for user:', socket.id);
            socket.emit('timeUp');
        }, sessions[socket.id].duration);

        sendBotMessage(socket, `Hi, let's begin. Your first question: Find the middle node of a singly linked list. You have ${durationMinutes} minutes.`);
    });

    socket.on('audioChunk', async ({ audioBase64 }) => {
        try {
            console.log('[Backend] ← Received audio chunk from user:', socket.id);
            // LemonFox STT
            const buffer = Buffer.from(audioBase64, 'base64');
            const userText = await transcribe(buffer);
            console.log('[Backend] → LemonFox transcription:', userText);
            if (userText) {
                sessions[socket.id].buffer += (sessions[socket.id].buffer ? ' ' : '') + userText;
                socket.emit('userText', userText);
            }
            // Reset the pause timer
            if (sessions[socket.id].pauseTimer) {
                clearTimeout(sessions[socket.id].pauseTimer);
            }
            sessions[socket.id].pauseTimer = setTimeout(async () => {
                const bufferedText = sessions[socket.id].buffer.trim();
                if (bufferedText) {
                    const chatHistory = sessions[socket.id].chatHistory;
                    chatHistory.push({ role: 'user', content: bufferedText });
                    const chatRes = await openai.chat.completions.create({
                        model: 'llama-8b-chat',
                        messages: chatHistory
                    });
                    const botText = chatRes.choices[0].message.content.trim();
                    console.log('[Backend] → Generated bot response:', botText);
                    sessions[socket.id].chatHistory = chatHistory;
                    await sendBotMessage(socket, botText);
                    sessions[socket.id].buffer = '';
                }
            }, PAUSE_MS);
        } catch (error) {
            console.error('[Backend] Error processing audio:', error);
            console.error('[Backend] Error stack:', error.stack);
            socket.emit('error', 'An error occurred while processing your audio. Please try again.');
            // Clean up temp files if they exist
            try {
                if (tempFile) {
                    await fs.unlink(tempFile);
                }
                if (tempDir) {
                    await fs.rmdir(tempDir);
                }
            } catch (cleanupError) {
                console.error('[Backend] Error cleaning up:', cleanupError);
            }
        }
    });

    socket.on('stopInterview', () => {
        clearSession(socket);
        socket.emit('stopped');
    });

    socket.on('disconnect', () => {
        console.log('[Backend] User disconnected:', socket.id);
        clearSession(socket);
    });
});

function clearSession(socket) {
    if (sessions[socket.id]) {
        if (sessions[socket.id].timer) {
            clearTimeout(sessions[socket.id].timer);
        }
        delete sessions[socket.id];
        console.log('[Backend] Cleared session for user:', socket.id);
    }
}

async function sendBotMessage(socket, txt) {
    console.log('[Backend] → sendBotMessage:', txt);
    socket.emit('botText', txt);
    
    try {
        console.log('[Backend] Starting TTS generation...');
        const audio = await generateTTS(txt);
        console.log('[Backend] TTS generated successfully, length:', audio.length);
        socket.emit('botAudio', audio);
    } catch (error) {
        console.error('[Backend] TTS generation failed with error:', error);
        console.error('[Backend] Error stack:', error.stack);
        socket.emit('error', 'TTS generation failed. Please check if the TTS service is running.');
    }
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`[Backend] Server listening on port ${PORT}`);
});

