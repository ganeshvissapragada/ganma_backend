const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

// POST /api/newsletter/image-gen
router.post('/image-gen', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const apiKey = process.env.NEWSLETTER_HF_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Hugging Face API key not set' });
    const apiUrl = 'https://api-inference.huggingface.co/models/CompVis/stable-diffusion-v1-4';
    const body = { inputs: prompt };
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: errText });
    }
    // The response is an image (base64) or a JSON with error
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.startsWith('image/')) {
      // Return the image as base64
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      res.json({ image: `data:${contentType};base64,${base64}` });
    } else {
      const data = await response.json();
      res.json({ result: data });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
