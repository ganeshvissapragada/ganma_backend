const express = require('express');
const router = express.Router();
const multer = require('multer');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

// Multer setup for image upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/image-analysis
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    // Use BLIP image captioning model from Hugging Face (open, free, reliable)
    const apiUrl = 'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base';
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Hugging Face API key not set' });
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/octet-stream',
        'Accept': 'application/json'
      },
      body: req.file.buffer,
    });

    if (!response.ok) {
      const error = await response.text();
      // Log the error for debugging
      console.error('Hugging Face API error:', error);
      return res.status(500).json({ message: 'Hugging Face API error', error });
    }

    const result = await response.json();
    // Log the result for debugging
    console.log('Hugging Face API result:', result);
    // Try to extract a useful message for the frontend
    if (Array.isArray(result) && result[0]?.generated_text) {
      res.json({ result: result[0].generated_text });
    } else if (result.error) {
      res.status(500).json({ message: 'Hugging Face API error', error: result.error });
    } else {
      res.json({ result });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
