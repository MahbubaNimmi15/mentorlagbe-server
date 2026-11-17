
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

const dbName =
  process.env.DB_NAME || "MentorLagbeDB";

if (!uri) {
  throw new Error(
    "MONGODB_URI is missing from .env"
  );
}

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 10000,
});

let database = null;

export async function connectDB() {
  if (database) return database;

  await client.connect();

  database = client.db(dbName);

  await database.command({ ping: 1 });

  console.log(`MongoDB connected: ${dbName}`);

  return database;
}

export function getDB() {
  if (!database) {
    throw new Error("Database not connected");
  }

  return database;
}

export async function closeDB() {
  await client.close();
  database = null;
}
