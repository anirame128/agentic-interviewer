const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { Options } = require('selenium-webdriver/chrome');

class LeetCodeService {
  constructor() {
    this.baseUrl = 'https://leetcode.com';
    this.cache = new Map();
    this.driver = null;
  }

  async initializeDriver() {
    if (!this.driver) {
      const options = new Options();
      options.addArguments('--headless');
      options.addArguments('--no-sandbox');
      options.addArguments('--disable-dev-shm-usage');
      
      this.driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
    }
  }

  async fetchProblemDetails(slug) {
    // Check cache first
    if (this.cache.has(slug)) {
      return this.cache.get(slug);
    }

    try {
      await this.initializeDriver();
      const url = `${this.baseUrl}/problems/${slug}/`;
      
      await this.driver.get(url);
      // Wait for the content to load
      await this.driver.sleep(5000);

      // Get problem description
      const descriptionElement = await this.driver.findElement(
        By.css('.content__u3I1.question-content__JfgR')
      );
      const content = await descriptionElement.getText();

      // Get examples
      const examplesElement = await this.driver.findElement(
        By.css('.example-container')
      );
      const examples = await examplesElement.getText();

      // Get constraints
      const constraintsElement = await this.driver.findElement(
        By.css('.question-constraints')
      );
      const constraints = await constraintsElement.getText();

      // Get difficulty
      const difficultyElement = await this.driver.findElement(
        By.css('.css-10o4wqw')
      );
      const difficulty = await difficultyElement.getText();

      const details = {
        content,
        examples,
        constraints,
        difficulty,
        hints: [] // LeetCode hints are premium content
      };

      // Cache the result
      this.cache.set(slug, details);
      return details;
    } catch (err) {
      console.error('[LeetCode] Error fetching problem details:', err.message);
      // Return a more informative fallback
      return {
        content: 'Unable to fetch problem details due to LeetCode protection. Please visit the problem directly on LeetCode for full details.',
        examples: 'Please check the problem on LeetCode for examples.',
        constraints: 'Please check the problem on LeetCode for constraints.',
        difficulty: 'Unknown',
        hints: ['Visit the problem on LeetCode for hints and solutions.']
      };
    }
  }

  formatProblemDetails(problem, details) {
    return [
      `**${problem.title}**  (Difficulty: ${details.difficulty || problem.difficulty})`,
      '',
      '**Description:**',
      details.content,
      '',
      '**Constraints:**',
      details.constraints,
      '',
      '**Examples:**',
      details.examples,
      '',
      '**Hints:**',
      Array.isArray(details.hints) ? details.hints.join('\n') : details.hints
    ].join('\n');
  }

  async cleanup() {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
    }
  }
}

module.exports = new LeetCodeService(); 