// index.js - Instagram Downloader API
// Vercel + Telegram Bot ke liye ready

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const auth = require("./lib/auth");
const scraper = require("./lib/instagramScraper");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// =============================================
// PUBLIC ROUTES (no auth needed)
// =============================================

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "✅ Instagram Downloader API is running!",
    version: "1.0.0",
    endpoints: {
      download: "POST /api/download",
      story: "POST /api/story",
      highlights: "POST /api/highlights",
      highlight_media: "POST /api/highlight/media",
      profile: "GET /api/profile/:username",
    },
    note: "Protected endpoints need x-api-key header",
  });
});

// =============================================
// PROTECTED ROUTES (API key required)
// =============================================

// 1. POST/VIDEO/REEL/CAROUSEL download
// Body: { url: "https://www.instagram.com/p/...", session_id: "optional" }
app.post("/api/download", auth, async (req, res) => {
  const { url, session_id } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: "url field zaroori hai",
      example: { url: "https://www.instagram.com/p/ABC123/", session_id: "optional" },
    });
  }

  // Instagram URL validate karo
  if (!url.includes("instagram.com")) {
    return res.status(400).json({
      success: false,
      error: "Sirf Instagram URLs allowed hain",
    });
  }

  const sessionId = session_id || process.env.INSTAGRAM_SESSION_ID;

  try {
    const result = await scraper.downloadMedia(url, sessionId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Server error: " + error.message,
    });
  }
});

// 2. STORY download
// Body: { username: "username", session_id: "required" }
app.post("/api/story", auth, async (req, res) => {
  const { username, session_id } = req.body;

  if (!username) {
    return res.status(400).json({
      success: false,
      error: "username zaroori hai",
      example: { username: "instagram", session_id: "your_session_id" },
    });
  }

  const sessionId = session_id || process.env.INSTAGRAM_SESSION_ID;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: "Story download ke liye session_id ZAROORI hai",
      how_to_get: "Browser mein Instagram.com open karo > DevTools > Application > Cookies > sessionid value copy karo",
    });
  }

  try {
    const result = await scraper.fetchStory(username, sessionId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 3. HIGHLIGHTS list
// Body: { username: "username", session_id: "required" }
app.post("/api/highlights", auth, async (req, res) => {
  const { username, session_id } = req.body;

  if (!username) {
    return res.status(400).json({ success: false, error: "username zaroori hai" });
  }

  const sessionId = session_id || process.env.INSTAGRAM_SESSION_ID;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: "Highlights ke liye session_id ZAROORI hai",
    });
  }

  try {
    const result = await scraper.fetchHighlights(username, sessionId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 4. HIGHLIGHT MEDIA (specific highlight ke andar ki media)
// Body: { highlight_id: "17865955229085400", session_id: "required" }
app.post("/api/highlight/media", auth, async (req, res) => {
  const { highlight_id, session_id } = req.body;

  if (!highlight_id) {
    return res.status(400).json({
      success: false,
      error: "highlight_id zaroori hai",
      tip: "Pehle /api/highlights call karo, wahan se id milegi",
    });
  }

  const sessionId = session_id || process.env.INSTAGRAM_SESSION_ID;

  try {
    const result = await scraper.fetchHighlightMedia(highlight_id, sessionId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 5. PROFILE info
// Params: username
app.get("/api/profile/:username", auth, async (req, res) => {
  const { username } = req.params;
  const sessionId = req.query.session_id || process.env.INSTAGRAM_SESSION_ID;

  try {
    const result = await scraper.fetchProfile(username, sessionId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    available_routes: ["/", "/api/download", "/api/story", "/api/highlights", "/api/highlight/media", "/api/profile/:username"],
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// Server start (local development)
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Instagram API Server running on http://localhost:${PORT}`);
    console.log(`📖 Docs: http://localhost:${PORT}/`);
  });
}

// Vercel ke liye export
module.exports = app;
