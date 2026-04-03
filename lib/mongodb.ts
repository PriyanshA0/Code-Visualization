import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

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
      .connect(MONGODB_URI!, {
        dbName: "talksy_visualizer",
        bufferCommands: false,
      })
      .then((mongoose) => mongoose)
      .catch(() => null);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
