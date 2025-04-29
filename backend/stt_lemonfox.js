const axios = require('axios');
const FormData = require('form-data');

async function transcribe(buffer) {
  const form = new FormData();
  form.append('file', buffer, { filename: 'audio.webm', contentType: 'audio/webm' });
  form.append('language', 'english');
  form.append('response_format', 'json');

  const res = await axios.post(
    'https://api.lemonfox.ai/v1/audio/transcriptions',
    form,
    {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${process.env.LEMONFOX_API_KEY}`,
      },
      responseType: 'json'
    }
  );
  return res.data.text;
}

module.exports = { transcribe }; 