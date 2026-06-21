import "dotenv/config";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import User from "../models/User.js";

// Create (or promote) the admin account from env, without touching demo data.
async function run() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("✖ Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first.");
    process.exit(1);
  }

  await connectDB();
  const email = ADMIN_EMAIL.toLowerCase();

  let user = await User.findOne({ email });
  if (user) {
    user.role = "admin";
    if (ADMIN_PASSWORD) user.password = ADMIN_PASSWORD; // reset to env value
    await user.save();
    console.log(`✔  Admin updated (role + password): ${email}`);
  } else {
    await User.create({
      name: ADMIN_NAME || "Tournament Admin",
      email,
      password: ADMIN_PASSWORD,
      role: "admin",
    });
    console.log(`✔  Admin created: ${email}`);
  }

  await mongoose.connection.close();
  process.exit(0);
}

run().catch(async (err) => {
  console.error("✖ Failed:", err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
