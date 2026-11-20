
import { Router } from "express";

import { connectDB } from "../config/db.js";

import {
  registerSchema,
  loginSchema,
} from "../validators/auth.validator.js";

import {
  hashPassword,
  comparePassword,
} from "../utils/password.js";

import { generateToken } from "../utils/token.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

let usersCollectionPromise = null;

// Connect to MongoDB and ensure email uniqueness.
async function getUsersCollection() {
  if (!usersCollectionPromise) {
    usersCollectionPromise = (async () => {
      const db = await connectDB();
      const users = db.collection("users");

      await users.createIndex(
        { email: 1 },
        { unique: true }
      );

      return users;
    })().catch((error) => {
      usersCollectionPromise = null;
      throw error;
    });
  }

  return usersCollectionPromise;
}

// Never send password hashes to the frontend.
function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid registration information",
      errors: result.error.flatten().fieldErrors,
    });
  }

  const { name, email, password, role } = result.data;

  try {
    const users = await getUsersCollection();

    const existingUser = await users.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();

    const newUser = {
      name,
      email,
      passwordHash,
      role,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await users.insertOne(newUser);

    const user = {
      ...newUser,
      _id: insertResult.insertedId,
    };

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: publicUser(user),
      token,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    console.error("Registration failed:", error.name);

    return res.status(503).json({
      success: false,
      message: "Registration service unavailable",
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid login information",
      errors: result.error.flatten().fieldErrors,
    });
  }

  const { email, password } = result.data;

  try {
    const users = await getUsersCollection();

    const user = await users.findOne({ email });

    if (!user || user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await comparePassword(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: publicUser(user),
      token,
    });
  } catch (error) {
    console.error("Login failed:", error.name);

    return res.status(503).json({
      success: false,
      message: "Login service unavailable",
    });
  }
});

// GET /api/auth/me
// Return the current user after JWT verification.
router.get("/me", requireAuth, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Authenticated user retrieved successfully",
    user: req.user,
  });
});

export default router;
