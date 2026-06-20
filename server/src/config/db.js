import mongoose from "mongoose";

// Connect to MongoDB (Atlas or local Community Server). Exits the process on a
// hard failure so the platform (Railway) can restart the service cleanly.
export default async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("✖  MONGO_URI is not set — add it to your .env / Railway variables.");
    process.exit(1);
  }

  mongoose.set("strictQuery", true);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      // Connection pool sizing for the Atlas free tier (M0 caps at 500
      // connections). One small, reused pool is plenty because the response
      // cache absorbs nearly all read traffic — requests rarely touch Mongo.
      // A bounded pool also prevents a request spike from exhausting M0's
      // connection limit (which would otherwise crash the API).
      maxPoolSize: 10,
      minPoolSize: 1,
      socketTimeoutMS: 45000,
    });
    console.log(`✔  MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`✖  MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
}
