
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password) {
  if (typeof password !== "string" || !password) {
    throw new Error("A valid password is required");
  }

  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password, hashedPassword) {
  if (
    typeof password !== "string" ||
    typeof hashedPassword !== "string"
  ) {
    return false;
  }

  return bcrypt.compare(password, hashedPassword);
}