function authMiddleware(req, res, next) {
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "your_secret_api_key_here") {
    console.warn("WARNING: API_KEY not set!");
    return next();
  }

  const providedKey =
    req.headers["x-api-key"] ||
    req.headers["authorization"]?.replace("Bearer ", "") ||
    req.query.api_key;

  if (!providedKey || providedKey !== apiKey) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Valid API key required.",
    });
  }

  next();
}

module.exports = authMiddleware;
