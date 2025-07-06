const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

// POST /api/email-marketing/compose
router.post('/compose', async (req, res) => {
  const { text, language = 'en', strength = 3 } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }

  try {
    const apiUrl = 'https://rewriter-paraphraser-text-changer-multi-language.p.rapidapi.com/rewrite';
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'rewriter-paraphraser-text-changer-multi-language.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ language, strength, text })
    });
    if (!response.ok) {
      const errText = await response.text();
      let errorMsg = errText;
      let statusCode = 500;
      // Try to parse JSON error if possible
      try {
        const errJson = JSON.parse(errText);
        if (errJson && errJson.message) errorMsg = errJson.message;
        // Handle RapidAPI quota/rate limit errors
        if (errJson && errJson.message && errJson.message.toLowerCase().includes('quota')) {
          statusCode = 429;
        }
      } catch (e) {}
      // Also check for common rate limit phrases
      if (errText.toLowerCase().includes('quota') || errText.toLowerCase().includes('rate limit')) {
        statusCode = 429;
      }
      console.error('RapidAPI Paraphraser error:', errText);
      return res.status(statusCode).json({ error: errorMsg });
    }
    const data = await response.json();
    res.json({ result: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
