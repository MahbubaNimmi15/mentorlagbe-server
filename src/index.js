
import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();

const PORT = Number(process.env.PORT) || 5000;

const CLIENT_URLS = (
  process.env.CLIENT_URL || "http://localhost:3000"
)
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

const DATABASE_ENABLED =
  process.env.DATABASE_ENABLED === "true";

let databaseConnected = false;
let closeDatabase = async () => {};

// Security & CORS
app.disable("x-powered-by");

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || CLIENT_URLS.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    name: "MentorLagbe API",
    version: "1.0.0",
    message: "Welcome to MentorLagbe Backend",
  });
});

// Health route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    service: "mentorlagbe-server",
    database: databaseConnected
      ? "connected"
      : "not-connected",
  });
});

// Database status
app.get("/api/db-status", (req, res) => {
  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    database: databaseConnected
      ? "connected"
      : "unavailable",
  });
});

// API information
app.get("/api/info", (req, res) => {
  res.status(200).json({
    success: true,
    project: "MentorLagbe",
    backend: "Node.js + Express",
    databaseEnabled: DATABASE_ENABLED,
    features: {
      authentication: "pending",
      tuitionCRUD: "pending",
      applications: "pending",
      payments: "pending",
    },
  });
});

// Unknown route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Request error:", error.message);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

async function startServer() {
  try {
    if (DATABASE_ENABLED) {
      const {
        connectDB,
        closeDB,
      } = await import("./config/db.js");

      await connectDB();

      databaseConnected = true;
      closeDatabase = closeDB;

      console.log("MongoDB connection successful");
    } else {
      console.log(
        "MongoDB temporarily disabled for preview deployment"
      );
    }

    const server = app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          `MentorLagbe API running on port ${PORT}`
        );
      }
    );

    async function shutdown() {
      console.log("Shutting down server");

      server.close(async () => {
        try {
          await closeDatabase();
          process.exit(0);
        } catch (error) {
          console.error(error.message);
          process.exit(1);
        }
      });
    }

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error(
      "Server startup failed:",
      error.message
    );

    process.exitCode = 1;
  }
}

startServer();
