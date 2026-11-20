
import jwt from "jsonwebtoken";

const TOKEN_EXPIRY = "7d";

export function generateToken(user) {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET must contain at least 32 characters"
    );
  }

  return jwt.sign(
    {
      role: user.role,
    },
    secret,
    {
      subject: String(user._id),
      expiresIn: TOKEN_EXPIRY,
      algorithm: "HS256",
    }
  );
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.verify(token, secret, {
    algorithms: ["HS256"],
  });
}
