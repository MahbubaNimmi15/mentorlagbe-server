
import { Router } from "express";

import {
  registerSchema,
  loginSchema,
} from "../validators/auth.validator.js";

const router = Router();

// POST /api/auth/register
router.post("/register", (req, res) => {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid registration information",
      errors: result.error.flatten().fieldErrors,
    });
  }

  // Registration requires a working database.
  return res.status(503).json({
    success: false,
    message: "Registration is temporarily unavailable",
    reason: "Database connection is not configured",
  });
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid login information",
      errors: result.error.flatten().fieldErrors,
    });
  }

  // Login requires a working database.
  return res.status(503).json({
    success: false,
    message: "Login is temporarily unavailable",
    reason: "Database connection is not configured",
  });
});

export default router;
