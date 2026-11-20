
import { ObjectId } from "mongodb";

import { connectDB } from "../config/db.js";
import { verifyToken } from "../utils/token.js";

// Verify the JWT and load the current user from MongoDB.
export async function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || "";

  const match = /^Bearer\s+(.+)$/i.exec(authorization);

  if (!match) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const decoded = verifyToken(match[1]);

    if (
      typeof decoded !== "object" ||
      !decoded.sub ||
      !ObjectId.isValid(decoded.sub)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    const db = await connectDB();

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(decoded.sub) },
      {
        projection: {
          passwordHash: 0,
        },
      }
    );

    if (!user || user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: "Account unavailable",
      });
    }

    req.user = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token",
      });
    }

    console.error("Authentication error:", error.name);

    return res.status(503).json({
      success: false,
      message: "Authentication service unavailable",
    });
  }
}

// Allow access only to permitted roles.
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied for this role",
      });
    }

    next();
  };
}
