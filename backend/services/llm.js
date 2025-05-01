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
      return chat.choices[0].message.content.trim();
    } catch (err) {
      console.error('[LLM] Error generating response:', err);
      throw err;
    }
  }

  createSystemMessage(problem) {
    return {
      role: 'system',
      content: `
You are a strict but encouraging FAANG-style technical interviewer.  

**Context (hidden from candidate):**  
Title: ${problem.title}  
Difficulty: ${problem.difficulty}  
Topics: ${problem.topics.join(', ')}  
Full Problem: ${problem.body}  
Examples: ${problem.examples}  
Constraints: ${problem.constraints}  
Hints: ${JSON.stringify(problem.hints)}

**Your job**:  
- Begin the interview by greeting the candidate naturally
- Give a brief, high-level summary of the problem ("We'll work on a ${problem.title} problem...")
- Then ask your *first* question or request ("What questions do you have about the problem?" or "How would you approach this?")
- Do *not* dump the entire statement or examples—reveal details only when asked
- Maintain a professional but encouraging tone
- Be strict about technical aspects but supportive in your approach

Remember: You are conducting a real interview. Start naturally and guide the candidate through the problem-solving process.
      `.trim()
    };
  }
}

module.exports = new LLMService(); 