
import { Router } from "express";

const router = Router();

const DATABASE_ENABLED = false;

// GET /api/health
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    service: "mentorlagbe-server",
    database: "not-connected",
  });
});

// GET /api/db-status
router.get("/db-status", (req, res) => {
  res.status(503).json({
    success: false,
    database: "unavailable",
    message: "MongoDB integration is temporarily disabled",
  });
});

// GET /api/info
router.get("/info", (req, res) => {
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

export default router;
