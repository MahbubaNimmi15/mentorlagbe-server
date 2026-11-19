
import "dotenv/config";
import express from "express";
import cors from "cors";

import systemRoutes from "./routes/system.routes.js";

const app = express();

app.disable("x-powered-by");

// Allowed frontend origins
function getAllowedOrigins() {
  return (
    process.env.CLIENT_URL || "http://localhost:3000"
  )
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

// CORS middleware
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

// Parse JSON requests
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

// System API routes
app.use("/api", systemRoutes);

// API 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Central error handler
app.use((error, req, res, next) => {
  console.error("API Error:", error.message);

  if (error.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed",
    });
  }

  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Vercel serverless entry point
export default app;
