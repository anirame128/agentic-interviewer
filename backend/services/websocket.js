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

      // 2) initialize conversation with system message and first turn
      const conversation = llmService.createInitialConversation(problem);
      this.chatHistories.set(socket.id, conversation);

      // 3) send the first turn to client
      const firstTurn = conversation[1].content; // Get the first turn from our initial conversation
      socket.emit('botText', firstTurn);
      const firstAudioB64 = await audioService.textToSpeech(firstTurn);
      socket.emit('botAudio', firstAudioB64);

      // 4) get LLM's second turn (the problem introduction)
      const userKickoff = { role: 'user', content: 'Please introduce the problem.' };
      conversation.push(userKickoff);
      const opening = await llmService.generateResponse(conversation);
      conversation.push({ role: 'assistant', content: opening });

      // 5) send second turn to client
      socket.emit('botText', opening);
      const secondAudioB64 = await audioService.textToSpeech(opening);
      socket.emit('botAudio', secondAudioB64);

    } catch (err) {
      console.error('[WebSocket] Error starting interview:', err);
      socket.emit('error', 'Failed to start interview. Please try again.');
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
      const audioB64 = await audioService.textToSpeech(response);
      socket.emit('botAudio', audioB64);
    } catch (err) {
      console.error('[WebSocket] Error handling audio:', err);
      socket.emit('error', 'Something went wrong while processing your audio.');
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
      const audioB64 = await audioService.textToSpeech(response);
      socket.emit('botAudio', audioB64);
    } catch (err) {
      console.error('[WebSocket] Error handling text:', err);
      socket.emit('error', 'Something went wrong while handling your input.');
    }
  }
}

module.exports = WebSocketService; 