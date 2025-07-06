// Move dotenv.config() to the VERY TOP - before any other requires
require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const geminiRoute = require('./routes/gemini'); // Now this will have access to env vars
const stableDiffusionRoutes = require('./routes/stable-diffusion');
const imageAnalysisRoutes = require('./routes/image-analysis');

// Debug - check if all important API keys are loaded
console.log('🔑 Gemini API Key loaded:', process.env.GEMINI_API_KEY ? 'YES' : 'NO');
console.log('🔑 Hugging Face API Key loaded:', process.env.HUGGINGFACE_API_KEY ? 'YES' : 'NO');
console.log('🔑 Replicate API Token loaded:', process.env.REPLICATE_API_TOKEN ? 'YES' : 'NO');
console.log('🔑 PromptAPI Key loaded:', process.env.PROMPTAPI_KEY ? 'YES' : 'NO');
const sentimentRoute = require('./routes/sentiment');

// Create app instance
const app = express();


// Add CORS and JSON middleware first
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: '20mb' }));

// Register the sentiment route after middleware
app.use('/api/sentiment', sentimentRoute);

// Remove duplicate app declaration and duplicate middleware

// Gemini API route
app.use('/api/gemini', geminiRoute);


// Stable Diffusion API route
app.use('/api/stable-diffusion', stableDiffusionRoutes);

// Image Analysis API route
app.use('/api/image-analysis', imageAnalysisRoutes);


// Email Marketing API route
app.use('/api/email-marketing', require('./routes/email-marketing'));

// Newsletter API route (SambaNova image generation for newsletter icon)
app.use('/api/newsletter', require('./routes/newsletter'));

// Social Media API route
app.use('/api/social-media', require('./routes/social-media'));

// Other routes
app.use("/api/auth", require("./routes/auth"));

// DB connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Connection error", err));

// Start server
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});