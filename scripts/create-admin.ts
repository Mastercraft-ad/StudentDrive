import { db } from "../server/db";
import { users } from "../shared/schema";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@studentdrive.com";
  const password = process.env.ADMIN_PASSWORD;
  
  if (!password) {
    console.error("❌ Error: ADMIN_PASSWORD environment variable is required!");
    console.error("Please set ADMIN_PASSWORD before running this script.");
    console.error("\nExample: ADMIN_PASSWORD=your-secure-password npm run create-admin");
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("❌ Error: Password must be at least 12 characters long!");
    process.exit(1);
  }
  
  const existingAdmin = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email),
  });

  if (existingAdmin) {
    console.log("⚠️  Admin user with this email already exists!");
    console.log("📧 Email:", email);
    console.log("\nIf you need to update the password, please do so from the settings page after logging in.");
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    id: randomUUID(),
    email,
    password: hashedPassword,
    role: "admin",
    firstName: "Admin",
    lastName: "User",
    emailVerified: true,
    onboardingCompleted: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("✅ Admin user created successfully!");
  console.log("📧 Email:", email);
  console.log("🔑 Password: ********** (stored securely)");
  console.log("\n🎉 You can now log in at: /auth/login");
  console.log("\n⚠️  IMPORTANT: Save these credentials securely!");
  
  process.exit(0);
}

createAdmin().catch(console.error);
