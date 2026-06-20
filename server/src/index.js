import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`✔  OctoScore API listening on port ${PORT} (${process.env.NODE_ENV || "development"})`);
  });
}

start();

// Fail loud on unexpected async errors so the platform restarts the process.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});
