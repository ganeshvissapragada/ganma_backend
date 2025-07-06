const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

// GET /api/social-media/instagram/:username
router.get('/instagram/:username', async (req, res) => {
  const { username } = req.params;
  if (!username) {
    return res.status(400).json({ error: 'username is required' });
  }

  try {
    const apiUrl = `https://instagram-profile1.p.rapidapi.com/getprofile/${encodeURIComponent(username)}`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'instagram-profile1.p.rapidapi.com'
      }
    });
    if (!response.ok) {
      const errText = await response.text();
      let errorMsg = errText;
      let statusCode = 500;
      try {
        const errJson = JSON.parse(errText);
        if (errJson && errJson.message) errorMsg = errJson.message;
        if (errJson && errJson.message && errJson.message.toLowerCase().includes('quota')) {
          statusCode = 429;
        }
      } catch (e) {}
      if (errText.toLowerCase().includes('quota') || errText.toLowerCase().includes('rate limit')) {
        statusCode = 429;
      }
      console.error('RapidAPI Instagram error:', errText);
      return res.status(statusCode).json({ error: errorMsg });
    }
    const data = await response.json();
    res.json({ profile: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
