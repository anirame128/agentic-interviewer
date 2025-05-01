const axios = require('axios');

async function generate(text) {
  const res = await axios.post(
    'https://api.lemonfox.ai/v1/audio/speech',
    {
      input: text,
      voice: 'sarah', // or any supported LemonFox voice
      response_format: 'mp3'
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.LEMONFOX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    }
  );
  // Return base64-encoded audio
  return Buffer.from(res.data, 'binary').toString('base64');
}

module.exports = { generate }; 