// backend/routes/sentiment.js
// Route for icon sentiment analysis using PromptAPI

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');



// Use Hugging Face Inference API for distilbert/distilbert-base-uncased-finetuned-sst-2-english
const HF_API_KEY = process.env.HUGGING_FACE_TOKEN;
const HF_MODEL = 'distilbert/distilbert-base-uncased-finetuned-sst-2-english';
const ENDPOINT = `https://api-inference.huggingface.co/models/${HF_MODEL}`;



// POST /api/sentiment


// This route will always accept JSON { text: ... } and send to Hugging Face

// Hugging Face sometimes returns { error: 'Model is loading' } or a string error. Handle both.
router.post('/', express.json(), async (req, res) => {
  const text = req.body && typeof req.body.text === 'string' ? req.body.text : '';
  if (!text) {
    return res.status(400).json({ error: 'Missing or invalid text' });
  }
  try {
    const apiRes = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: text })
    });
    const contentType = apiRes.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await apiRes.json();
    } else {
      const textData = await apiRes.text();
      return res.status(apiRes.status).json({ error: 'HuggingFace error', status: apiRes.status, details: textData });
    }
    // Hugging Face returns [{label,score}...] or [{...}] (sometimes wrapped in another array)
    let best = null;
    if (Array.isArray(data)) {
      let arr = data;
      if (Array.isArray(data[0])) arr = data[0];
      // For distilbert, the array is usually [{label,score}, ...]
      if (arr.length && arr[0].label && typeof arr[0].score === 'number') {
        best = arr.reduce((a, b) => (a.score > b.score ? a : b));
      }
    }
    if (!best && data.label && typeof data.score === 'number') {
      best = data;
    }
    if (best && best.label) {
      res.json({
        sentiment: best.label.toLowerCase(),
        score: best.score
      });
    } else if (data.error) {
      if (typeof data.error === 'string' && data.error.toLowerCase().includes('loading')) {
        return res.status(503).json({ error: 'The sentiment model is loading. Please try again in a few seconds.' });
      }
      res.status(502).json({ error: data.error });
    } else {
      res.status(502).json({ error: 'Invalid response from HuggingFace', details: data });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
