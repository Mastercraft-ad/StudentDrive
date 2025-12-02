import { db } from "../server/db";
import { users } from "../shared/schema";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

async function createSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  
  if (!email) {
    console.error("Error: SUPER_ADMIN_EMAIL environment variable is required!");
    process.exit(1);
  }
  
  if (!password) {
    console.error("Error: SUPER_ADMIN_PASSWORD environment variable is required!");
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("Error: Password must be at least 12 characters long!");
    process.exit(1);
  }
  
  const existingSuperAdmin = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email),
  });

  if (existingSuperAdmin) {
    console.log("Super admin with this email already exists!");
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    id: randomUUID(),
    email,
    password: hashedPassword,
    role: "super_admin",
    firstName: "Super",
    lastName: "Admin",
    emailVerified: true,
    onboardingCompleted: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("Super admin created successfully!");
  console.log("Email:", email);
  console.log("Password: ********** (stored securely)");
  
  process.exit(0);
}

createSuperAdmin().catch(console.error);
