import "dotenv/config";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import Group from "../models/Group.js";
import Team from "../models/Team.js";
import Player from "../models/Player.js";
import Match from "../models/Match.js";
import Gallery from "../models/Gallery.js";
import Quiz from "../models/Quiz.js";
import Content from "../models/Content.js";
import User from "../models/User.js";

import {
  GROUPS,
  TEAMS,
  MATCHES,
  GALLERY,
  QUIZ,
  BRACKET,
  RULES,
  buildPlayers,
} from "./data.js";

// Idempotent upsert keyed by _id — re-running refreshes demo rows without
// touching anything an admin added separately.
async function upsertAll(Model, docs) {
  if (!docs.length) return;
  const ops = docs.map((doc) => ({
    replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true },
  }));
  await Model.bulkWrite(ops);
}

async function seedAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log("ℹ  Skipping admin (set ADMIN_EMAIL + ADMIN_PASSWORD in .env to create one).");
    return;
  }
  const email = ADMIN_EMAIL.toLowerCase();
  let user = await User.findOne({ email });
  if (user) {
    user.role = "admin";
    await user.save();
    console.log(`✔  Admin already exists, role ensured: ${email}`);
  } else {
    await User.create({
      name: ADMIN_NAME || "Tournament Admin",
      email,
      password: ADMIN_PASSWORD,
      role: "admin",
    });
    console.log(`✔  Admin created: ${email}`);
  }
}

async function run() {
  await connectDB();

  console.log("→ Seeding groups…");
  await upsertAll(Group, GROUPS);

  console.log("→ Seeding teams…");
  await upsertAll(Team, TEAMS);

  console.log("→ Seeding players (rosters)…");
  const players = TEAMS.flatMap((t) => buildPlayers(t._id));
  await upsertAll(Player, players);

  console.log("→ Seeding matches…");
  await upsertAll(Match, MATCHES);

  console.log("→ Seeding gallery…");
  await upsertAll(Gallery, GALLERY);

  console.log("→ Seeding quiz…");
  await upsertAll(Quiz, QUIZ);

  console.log("→ Seeding content (bracket + rules)…");
  if (BRACKET) {
    await Content.findByIdAndUpdate(
      "bracket",
      { data: BRACKET },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }
  await Content.findByIdAndUpdate(
    "rules",
    { data: RULES },
    { upsert: true, setDefaultsOnInsert: true }
  );

  console.log("→ Seeding admin user…");
  await seedAdmin();

  console.log(
    `✅ Seed complete — ${GROUPS.length} groups, ${TEAMS.length} teams, ${players.length} players, ${MATCHES.length} matches, ${GALLERY.length} memories, ${QUIZ.length} questions.`
  );
  await mongoose.connection.close();
  process.exit(0);
}

run().catch(async (err) => {
  console.error("✖ Seed failed:", err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
