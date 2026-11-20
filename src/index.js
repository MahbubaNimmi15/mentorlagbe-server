import tuitionActivationRoutes from "./routes/tuition-activation.routes.js";
import tuitionRejectionRoutes from "./routes/tuition-rejection.routes.js";

import "dotenv/config";
import express from "express";
import cors from "cors";

import systemRoutes from "./routes/system.routes.js";
import authRoutes from "./routes/auth.routes.js";
import protectedRoutes from "./routes/protected.routes.js";
import tuitionRoutes from "./routes/tuition.routes.js";
import tuitionManagementRoutes from "./routes/tuition-management.routes.js";

const app = express();

app.disable("x-powered-by");

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

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    project: "MentorLagbe",
    message: "Welcome to MentorLagbe API",
    version: "1.0.0",
  });
});


// API Routes
app.use("/api", systemRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);

// Main tuition routes
app.use("/api/tuitions", tuitionRoutes);

// Admin rejection route before tutor-only routers
app.use("/api/tuitions", tuitionRejectionRoutes);

// Tutor management and activation
app.use("/api/tuitions", tuitionManagementRoutes);
app.use("/api/tuitions", tuitionActivationRoutes);






// Unknown Routes
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Central Error Handler
app.use((error, req, res, next) => {
  console.error("API Error:", error.message);

  if (error.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed",
    });
  }

  if (
    error instanceof SyntaxError &&
    error.status === 400
  ) {
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

export default app;

