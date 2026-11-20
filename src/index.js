
import "dotenv/config";
import express from "express";
import cors from "cors";

import systemRoutes from "./routes/system.routes.js";
import authRoutes from "./routes/auth.routes.js";

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

// JSON body parser
app.use(express.json({ limit: "1mb" }));

// API home
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    project: "MentorLagbe",
    message: "Welcome to MentorLagbe API",
    version: "1.0.0",
  });
});

// API routes
app.use("/api", systemRoutes);
app.use("/api/auth", authRoutes);

// Unknown routes
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

// Vercel imports this Express application
export default app;