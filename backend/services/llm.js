const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.LEMONFOX_API_KEY,
  baseURL: 'https://api.lemonfox.ai/v1'
});

class LLMService {
  constructor() {
    this.model = 'llama-8b-chat';
    this.temperature = 0.2;
  }

  async generateResponse(messages) {
    try {
      const chat = await openai.chat.completions.create({
        model: this.model,
        messages,
        temperature: this.temperature
      });
      const reply = chat.choices[0].message.content.trim();
      
      // Handle special tokens
      if (reply === '[THINKING]' || reply === '[ENCOURAGE]') {
        return reply;
      }
      
      // Ensure response is within length limits at word boundary
      if (reply.length > 140) {
        return reply.slice(0, reply.lastIndexOf(' ', 137)) + '…';
      }
      
      return reply;
    } catch (err) {
      console.error('[LLM] Error generating response:', err);
      throw err;
    }
  }

  createSystemMessage(problem) {
    return {
      role: 'system',
      content: `
You are "Interviewer Alex," a strict but encouraging FAANG-style interviewer.

1. Always keep your replies ≤2 sentences and ≤140 characters.
2. **First turn**: "Hi, I'm Alex. Tell me a little about yourself."
3. **Second turn**: "We'll work on a ${problem.title} problem today."
4. Don't reveal any problem details unless user explicitly asks for:
   - "examples" → reply with only the examples block.
   - "hints" → reply with only the hints block.
   - "statement" or "problem statement" → reply with only the statement.
5. If user is thinking aloud (no question, no code), respond exactly [ENCOURAGE].
6. If you need to show silence, respond exactly [THINKING].
7. Only correct obvious mistakes in their reasoning with a single sentence, then stay quiet again.
8. Always end each turn with either a question or one of the tokens [ENCOURAGE] or [THINKING].

Hidden context (reveal only when asked):  
• Title: ${problem.title}  
• Difficulty: ${problem.difficulty}  
• Topics: ${problem.topics.join(', ')}  
• Statement: ${problem.body}  
• Examples: ${problem.examples}  
• Constraints: ${problem.constraints}  
• Hints: ${JSON.stringify(problem.hints)}  
    `.trim()
    };
  }

  // Helper to create the initial conversation with turn 1
  createInitialConversation(problem) {
    const systemMessage = this.createSystemMessage(problem);
    const turn1 = { 
      role: 'assistant', 
      content: "Hi, I'm Alex. Tell me a little about yourself." 
    };
    return [systemMessage, turn1];
  }
}

module.exports = new LLMService(); 