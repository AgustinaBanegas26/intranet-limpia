const cors = require("cors");

const DEFAULT_DEV_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];

function getAllowedOrigins() {
  const envOrigins = String(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  if (envOrigins.length > 0) {
    return envOrigins;
  }

  return DEFAULT_DEV_ORIGINS;
}

function isAllowedOrigin(origin) {
  const allowedOrigins = getAllowedOrigins();

  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  const normalizedOrigin = origin.toLowerCase();
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
    return true;
  }
  if (normalizedOrigin.endsWith(".vercel.app")) {
    return true;
  }
  return false;
}

function createCorsMiddleware() {
  return cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS: origin not allowed: ${origin}`));
    },
    credentials: false,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  });
}

module.exports = { createCorsMiddleware, getAllowedOrigins };
