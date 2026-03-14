import mongoose from "mongoose";
import "dotenv/config";
import User from "../src/models/user.model";
import { DB_NAME } from "../src/utils/constants";

const MONGO_URI = process.env.MONGODB_URI;
const email = process.env.SUPER_ADMIN_EMAIL;
const password = process.env.SUPER_ADMIN_PASSWORD;

if (!MONGO_URI) {
  console.error("❌  MONGODB_URI is not set in environment variables.");
  process.exit(1);
}

async function main() {
  console.log("\n🔐  CTF Platform — Superadmin Bootstrap\n");

  // Connect
  console.log("⏳  Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI! + "/" + DB_NAME);
  console.log("✅  Connected.\n");

  // Guard: prevent duplicate superadmins if one already exists
  const existingCount = await User.countDocuments({ role: "superadmin" });
  if (existingCount > 0) {
    console.log(
      `⚠️   A superadmin account already exists (${existingCount} found).\n` +
        "     Use the admin panel or the createAdmin script to manage accounts.\n"
    );
    await mongoose.disconnect();
    process.exit(0);
  }

  // Create superadmin
  const superadmin = await User.create({
    email,
    password,
    fullName: "Platform Superadmin",
    role: "superadmin",
    isVerified: true,
    providers: [{ provider: "local", providerId: email }],
  });

  console.log("\n✅  Superadmin created successfully!\n");
  console.log(`   ID:       ${superadmin._id}`);
  console.log(`   Username: ${superadmin.username}`);
  console.log(`   Email:    ${superadmin.email}`);
  console.log(`   Role:     ${superadmin.role}`);
  console.log(
    "\n⚠️   Store these credentials securely. This script will refuse to run again.\n"
  );

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("❌  Fatal error:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
