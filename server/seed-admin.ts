import { storage } from "./storage";
import { hashPassword } from "./auth";

async function seedAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      console.error("Missing required environment variables!");
      console.error("Please set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.");
      console.error("\nExample:");
      console.error("  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=YourSecurePassword123! npx tsx server/seed-admin.ts");
      process.exit(1);
    }

    if (password.length < 12) {
      console.error("Password must be at least 12 characters long for security.");
      process.exit(1);
    }

    const existingAdmin = await storage.getUserByEmail(email);
    
    if (existingAdmin) {
      console.log("Admin user already exists with email:", email);
      console.log("If you need to update the password, please do so from the settings page after logging in.");
      return;
    }

    const hashedPassword = await hashPassword(password);
    
    const admin = await storage.createUser({
      email,
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      emailVerified: true,
      onboardingCompleted: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    });

    console.log("Admin user created successfully!");
    console.log("Email:", admin.email);
    console.log("Password: ********** (stored securely)");
    console.log("\nYou can now log in at /login");
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

seedAdmin();
