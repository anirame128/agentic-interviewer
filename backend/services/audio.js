const axios = require('axios');

class AudioService {
  constructor() {
    this.apiKey = process.env.LEMONFOX_API_KEY;
    this.baseUrl = 'https://api.lemonfox.ai/v1';
  }

  async textToSpeech(text) {
    try {
      const ttsRes = await axios.post(
        `${this.baseUrl}/audio/speech`,
        {
          input: text,
          voice: 'sarah',
          response_format: 'mp3'
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`
          },
          responseType: 'arraybuffer'
        }
      );
      return Buffer.from(ttsRes.data, 'binary').toString('base64');
    } catch (err) {
      console.error('[Audio] Error in textToSpeech:', err);
      throw err;
    }
  }

  async speechToText(audioBuffer) {
    try {
      const sttRes = await axios.post(
        `${this.baseUrl}/audio/transcriptions`,
        audioBuffer,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'audio/mp3'
          }
        }
      );
      return sttRes.data.text.trim();
    } catch (err) {
      console.error('[Audio] Error in speechToText:', err);
      throw err;
    }
  }

  isValidWebM(buffer) {
    // WebM header starts with 0x1A45DFA3
    const webmHeader = Buffer.from([0x1A, 0x45, 0xDF, 0xA3]);
    return buffer.slice(0, 4).equals(webmHeader);
  }
}

module.exports = new AudioService(); 