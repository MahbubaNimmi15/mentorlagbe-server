
import { Router } from "express";

import {
  requireAuth,
  requireRole,
} from "../middlewares/auth.middleware.js";

const router = Router();

// All routes below require a valid JWT.
router.use(requireAuth);

// GET /api/protected/student
router.get(
  "/student",
  requireRole("student"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Student access granted",
      user: req.user,
    });
  }
);

// GET /api/protected/tutor
router.get(
  "/tutor",
  requireRole("tutor"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Tutor access granted",
      user: req.user,
    });
  }
);

// GET /api/protected/admin
router.get(
  "/admin",
  requireRole("admin"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Admin access granted",
      user: req.user,
    });
  }
);

export default router;
