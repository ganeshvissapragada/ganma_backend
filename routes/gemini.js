const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();
const router = express.Router();

// Use Gemini 1.5 Flash for text generation
const { GoogleGenerativeAI } = require('@google/generative-ai');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Debug the API key
console.log('=== GEMINI ROUTE DEBUG ===');
console.log('API Key exists:', !!process.env.GEMINI_API_KEY);
console.log('API Key prefix:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 20) + '...' : 'MISSING');




router.post('/', async (req, res) => {
  console.log('=== GEMINI API REQUEST ===');
  console.log('Request body:', req.body);
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ reply: 'No prompt provided' });
  }
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    res.json({ reply: response });
  } catch (err) {
    console.error('Gemini API error:', err);
    let errorMsg = err.message || 'Unknown Gemini API error';
    // Try to extract more info if available
    if (err.status === 429) {
      errorMsg = 'Gemini API quota exceeded. Please try again later.';
    } else if (err.status === 400 && /API key/i.test(errorMsg)) {
      errorMsg = 'Gemini API key is invalid or expired.';
    }
    res.status(500).json({ reply: 'Gemini API error', error: errorMsg });
  }
});

// New endpoint for Gemini Vision (image+text)
router.post('/vision', async (req, res) => {
  const { prompt, preprompt, fileContent } = req.body;

  if (!prompt || !fileContent || !fileContent.startsWith('data:image/')) {
    return res.status(400).json({ reply: 'Prompt and image required' });
  }

  // Extract mime type and base64 data
  const matches = fileContent.match(/^data:(image\/[^;]+);base64,(.+)$/);
  const mimeType = matches ? matches[1] : 'image/png';
  const base64Data = matches ? matches[2] : fileContent.split(',')[1];

  const fullPrompt = preprompt ? `${preprompt}\n${prompt}` : prompt;

  // Vision endpoint is not supported by Janus-Pro-7B; return not implemented
  return res.status(501).json({ reply: 'Image+text vision is not supported by Janus-Pro-7B. Use image captioning endpoint instead.' });
});

// New endpoint for Gemini 2.0 Flash Preview Image Generation
router.post('/image-gen', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });

  // Janus-Pro-7B does not support image generation; return not implemented
  return res.status(501).json({ error: 'Image generation is not supported by Janus-Pro-7B. Use the stable-diffusion endpoint instead.' });
});

module.exports = router;