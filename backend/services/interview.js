const fs = require('fs');
const path = require('path');
const leetcodeService = require('./leetcode');

class InterviewService {
  constructor() {
    this.problems = [];
    this.loadProblems();
  }

  loadProblems() {
    try {
      const data = fs.readFileSync(path.join(__dirname, '..', 'data', 'leetcode_questions.json'), 'utf8');
      this.problems = JSON.parse(data);
      console.log(`[Interview] Loaded ${this.problems.length} problems from JSON`);
    } catch (err) {
      console.error('[Interview] Error loading problems:', err);
      this.problems = [];
    }
  }

  getRandomProblem() {
    // Filter out paid questions
    const freeProblems = this.problems.filter(problem => !problem.is_paid);
    if (freeProblems.length === 0) {
      throw new Error('No free problems available');
    }
    
    const problem = freeProblems[Math.floor(Math.random() * freeProblems.length)];
    
    return {
      title: problem.title,
      difficulty: problem.difficulty,
      formattedQuestion: 
        `**${problem.title}**  (Difficulty: ${problem.difficulty})\n\n` +
        `${problem.body}\n\n` +
        `**Topics:** ${problem.topics.join(', ')}\n\n` +
        `**Examples:**\n${problem.examples}\n\n` +
        `**Constraints:**\n${problem.constraints}\n\n` +
        `**Hints:**\n${problem.hints.map((hint, i) => `${i + 1}. ${hint}`).join('\n')}`,
      content: problem.body,
      examples: problem.examples,
      constraints: problem.constraints,
      hints: problem.hints,
      topics: problem.topics
    };
  }

  isNoise(text) {
    if (!text || text.length < 2) return true;
    const noiseRe = /^(thank you|hello|hi|okay|um+|ah+)$/i;
    return noiseRe.test(text);
  }

  isEcho(lastMessage, currentText) {
    return lastMessage && 
           lastMessage.role === 'assistant' && 
           lastMessage.content === currentText;
  }
}

module.exports = new InterviewService(); 