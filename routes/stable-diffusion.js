const express = require('express');
const router = express.Router();
// Use dynamic import for fetch to support Node.js 18+ and all environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

// POST /api/stable-diffusion/image-gen
router.post('/image-gen', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });

  try {
    // Use RapidAPI FLUX text-to-image endpoint
    const response = await fetch('https://ai-text-to-image-generator-flux-free-api.p.rapidapi.com/aaaaaaaaaaaaaaaaaiimagegenerator/quick.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'ai-text-to-image-generator-flux-free-api.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY
      },
      body: JSON.stringify({
        prompt,
        style_id: 27, // You can make this dynamic if needed
        size: '16-9'  // You can make this dynamic if needed
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('RapidAPI FLUX error:', err);
      return res.status(500).json({ error: err });
    }

    // The response is JSON with an image URL or error
    const data = await response.json();
    console.log('RapidAPI FLUX response:', data); // Debug log
    if (data && Array.isArray(data.final_result) && data.final_result.length > 0) {
      // Use the first image's origin or thumb URL
      res.json({ imageUrl: data.final_result[0].origin || data.final_result[0].thumb });
    } else {
      res.status(500).json({ error: 'No image returned from RapidAPI FLUX', raw: data });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// If you want to use the Replicate API key from .env, you can do:
// const replicateToken = process.env.REPLICATE_API_TOKEN ;
// and use replicateToken in the Authorization header.
