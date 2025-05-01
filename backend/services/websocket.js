const { Server } = require('socket.io');
const llmService = require('./llm');
const audioService = require('./audio');
const interviewService = require('./interview');

class WebSocketService {
  constructor(server) {
    this.io = new Server(server, { cors: { origin: '*' } });
    this.chatHistories = new Map();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', socket => {
      console.log('[WebSocket] New user connected:', socket.id);
      this.chatHistories.set(socket.id, []);

      socket.on('startInterview', () => this.handleStartInterview(socket));
      socket.on('audioUtterance', (data) => this.handleAudioUtterance(socket, data));
      socket.on('userText', (text) => this.handleUserText(socket, text));
    });
  }

  async handleStartInterview(socket) {
    try {
      console.log('[WebSocket] ← Received startInterview');

      // 1) grab a rich problem object
      const problem = interviewService.getRandomProblem();

      // 2) system context hides the details
      const systemMessage = llmService.createSystemMessage(problem);

      // 3) ask the LLM to produce the FIRST interviewer prompt
      const userKickoff = {
        role: 'user',
        content: 'Please begin the interview with your opening prompt.'
      };

      // 4) get LLM's opening question
      const opening = await llmService.generateResponse([
        systemMessage,
        userKickoff
      ]);

      // 5) initialize history with system + assistant
      this.chatHistories.set(socket.id, [
        systemMessage,
        { role: 'assistant', content: opening }
      ]);

      // 6) send it to client
      socket.emit('botText', opening);
      socket.emit('botSpeaking', true);

      const audioB64 = await audioService.textToSpeech(opening);
      socket.emit('botAudio', audioB64);
      socket.emit('botSpeaking', false);

    } catch (err) {
      console.error('[WebSocket] Error starting interview:', err);
      socket.emit('error', 'Failed to start interview. Please try again.');
      socket.emit('botSpeaking', false);
    }
  }

  async handleAudioUtterance(socket, { audioBase64 }) {
    try {
      console.log('[WebSocket] ← Received audio blob');
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      
      const text = await audioService.speechToText(audioBuffer);
      if (interviewService.isNoise(text)) return;

      socket.emit('userText', text);
      this.chatHistories.get(socket.id).push({ role: 'user', content: text });

      const response = await llmService.generateResponse(this.chatHistories.get(socket.id));
      this.chatHistories.get(socket.id).push({ role: 'assistant', content: response });

      socket.emit('botText', response);
      socket.emit('botSpeaking', true);

      const audioB64 = await audioService.textToSpeech(response);
      socket.emit('botAudio', audioB64);
      socket.emit('botSpeaking', false);
    } catch (err) {
      console.error('[WebSocket] Error handling audio:', err);
      socket.emit('error', 'Something went wrong while processing your audio.');
      socket.emit('botSpeaking', false);
    }
  }

  async handleUserText(socket, text) {
    try {
      console.log('[WebSocket] ← Received user text:', text);
      if (interviewService.isNoise(text)) return;

      const chatHistory = this.chatHistories.get(socket.id);
      if (interviewService.isEcho(chatHistory[chatHistory.length - 1], text)) {
        console.log('[WebSocket] Ignoring echo of bot message');
        return;
      }

      socket.emit('userText', text);
      chatHistory.push({ role: 'user', content: text });

      const response = await llmService.generateResponse(chatHistory);
      chatHistory.push({ role: 'assistant', content: response });

      socket.emit('botText', response);
      socket.emit('botSpeaking', true);

      const audioB64 = await audioService.textToSpeech(response);
      socket.emit('botAudio', audioB64);
      socket.emit('botSpeaking', false);
    } catch (err) {
      console.error('[WebSocket] Error handling text:', err);
      socket.emit('error', 'Something went wrong while handling your input.');
      socket.emit('botSpeaking', false);
    }
  }
}

module.exports = WebSocketService; 