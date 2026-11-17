
import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();

app.disable("x-powered-by");

const DATABASE_ENABLED = false;

function getAllowedOrigins() {
  return (
    process.env.CLIENT_URL || "http://localhost:3000"
  )
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

app.use(
  cors({
    origin(origin, callback) {
      const allowedOrigins = getAllowedOrigins();

      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("Origin not allowed by CORS")
      );
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

// API Home
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    project: "MentorLagbe",
    message: "Welcome to MentorLagbe API",
    version: "1.0.0",
  });
});

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    service: "mentorlagbe-server",
    database: "not-connected",
  });
});

// Database Status
app.get("/api/db-status", (req, res) => {
  res.status(503).json({
    success: false,
    database: "unavailable",
    message:
      "MongoDB integration is temporarily disabled",
  });
});

// API Information
app.get("/api/info", (req, res) => {
  res.status(200).json({
    success: true,
    project: "MentorLagbe",
    framework: "Express.js",
    databaseEnabled: DATABASE_ENABLED,
    features: {
      authentication: "pending",
      tuitionCRUD: "pending",
      applications: "pending",
      stripePayments: "pending",
    },
  });
});

// Unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("API Error:", error.message);

  if (error.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed",
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Vercel imports this Express application.
export default app;
