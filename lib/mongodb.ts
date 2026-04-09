import mongoose from "mongoose";

function normalizeMongoUri(raw?: string) {
  if (!raw) return undefined;

  let value = raw.trim();

  // Handle accidentally pasted values like: MONGODB_URI=mongodb+srv://...
  value = value.replace(/^MONGODB_(?:URI|URL)\s*=\s*/i, "");

  // Remove surrounding quotes if present.
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return value;
}

const MONGODB_URI = normalizeMongoUri(process.env.MONGODB_URI) ?? normalizeMongoUri(process.env.MONGODB_URL);

function isUsableMongoUri(uri?: string) {
  if (!uri) return false;

  const lowered = uri.toLowerCase();
  if (lowered.includes("username:password")) return false;
  if (lowered.includes("your_mongodb")) return false;
  if (lowered.includes("cluster.mongodb.net") && lowered.includes("username")) {
    return false;
  }

  return true;
}

// Singleton pattern for maintaining single connection
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDB() {
  if (!isUsableMongoUri(MONGODB_URI)) {
    // Local test mode: allow API usage without Mongo configuration.
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI!, { bufferCommands: false })
      .then((mongoose) => mongoose)
      .catch(() => null);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
