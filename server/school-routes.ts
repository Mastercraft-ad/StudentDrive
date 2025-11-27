import { Router, Request, Response } from "express";
import { storage } from "./storage";
import { requireSchoolContext, checkTrialStatus } from "./school-middleware";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { nanoid } from "nanoid";

const router = Router();

// Public school registration endpoint
const schoolRegistrationSchema = z.object({
  name: z.string().min(2, "School name must be at least 2 characters"),
  subdomain: z.string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(30, "Subdomain must be at most 30 characters")
    .regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default("Nigeria"),
  adminFirstName: z.string().min(2, "First name must be at least 2 characters"),
  adminLastName: z.string().min(2, "Last name must be at least 2 characters"),
  adminEmail: z.string().email("Invalid admin email address"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
  registrantUserId: z.string().optional(),
});

// Check subdomain availability
router.get("/api/schools/check-subdomain/:subdomain", async (req: Request, res: Response) => {
  try {
    const { subdomain } = req.params;
    const isAvailable = await storage.checkSubdomainAvailability(subdomain);
    res.json({ available: isAvailable, subdomain: subdomain.toLowerCase() });
  } catch (error: any) {
    console.error("Error checking subdomain:", error);
    res.status(500).json({ message: "Failed to check subdomain availability" });
  }
});

// Register a new school
router.post("/api/schools/register", async (req: Request, res: Response) => {
  try {
    const validatedData = schoolRegistrationSchema.parse(req.body);
    
    // Check subdomain availability
    const isAvailable = await storage.checkSubdomainAvailability(validatedData.subdomain);
    if (!isAvailable) {
      res.status(400).json({ message: "This subdomain is already taken. Please choose another." });
      return;
    }
    
    // Get or determine the owner (public user who registers the school)
    let ownerId = validatedData.registrantUserId;
    
    if (!ownerId) {
      // Check if user exists by email in public users
      const existingUser = await storage.getUserByEmail(validatedData.adminEmail);
      if (existingUser) {
        ownerId = existingUser.id;
      } else {
        // Create a minimal public user entry as the owner
        const hashedPassword = await bcrypt.hash(validatedData.adminPassword, 10);
        const newUser = await storage.createUser({
          id: nanoid(),
          email: validatedData.adminEmail,
          password: hashedPassword,
          firstName: validatedData.adminFirstName,
          lastName: validatedData.adminLastName,
          role: "institution",
          emailVerified: false,
          onboardingCompleted: false,
        });
        ownerId = newUser.id;
      }
    }
    
    // Generate slug from school name
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Create the school
    const school = await storage.createSchool({
      name: validatedData.name,
      subdomain: validatedData.subdomain,
      slug,
      email: validatedData.email,
      ownerId,
      phone: validatedData.phone || null,
      address: validatedData.address || null,
      city: validatedData.city || null,
      state: validatedData.state || null,
      country: validatedData.country,
    });
    
    // Activate trial period
    const updatedSchool = await storage.activateSchoolTrial(school.id, 14);
    
    // Hash admin password and create school admin user in schoolUsers table
    const hashedAdminPassword = await bcrypt.hash(validatedData.adminPassword, 10);
    const adminUser = await storage.createSchoolUser({
      schoolId: school.id,
      email: validatedData.adminEmail,
      firstName: validatedData.adminFirstName,
      lastName: validatedData.adminLastName,
      password: hashedAdminPassword,
      role: "school_admin",
    });
    
    res.status(201).json({
      message: "School registered successfully! Your 14-day free trial has started.",
      school: {
        id: updatedSchool.id,
        name: updatedSchool.name,
        subdomain: updatedSchool.subdomain,
        trialEndDate: updatedSchool.trialEndDate,
      },
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
      },
    });
  } catch (error: any) {
    console.error("Error registering school:", error);
    if (error.name === "ZodError") {
      res.status(400).json({ message: "Validation error", errors: error.errors });
      return;
    }
    res.status(500).json({ message: "Failed to register school" });
  }
});

// Get subscription plans
router.get("/api/schools/subscription-plans", async (_req: Request, res: Response) => {
  try {
    const plans = await storage.getActiveSubscriptionPlans();
    res.json(plans);
  } catch (error: any) {
    console.error("Error fetching subscription plans:", error);
    res.status(500).json({ message: "Failed to fetch subscription plans" });
  }
});

// ============================================
// SCHOOL CONTEXT REQUIRED ENDPOINTS (subdomain)
// ============================================

// School authentication
const schoolLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

router.post("/api/school/auth/login", requireSchoolContext, async (req: Request, res: Response) => {
  try {
    const { email, password } = schoolLoginSchema.parse(req.body);
    const schoolId = req.school!.id;
    
    const user = await storage.getSchoolUserByEmail(schoolId, email);
    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }
    
    if (!user.isActive) {
      res.status(401).json({ message: "Your account has been deactivated. Please contact the school administrator." });
      return;
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }
    
    // Update last login
    await storage.updateSchoolUser(user.id, { 
      // lastLoginAt is tracked separately via schema default
    });
    
    // Return user info (session management can be added later)
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      school: {
        id: req.school!.id,
        name: req.school!.name,
        subdomain: req.school!.subdomain,
        logoUrl: req.school!.logoUrl,
      },
    });
  } catch (error: any) {
    console.error("School login error:", error);
    if (error.name === "ZodError") {
      res.status(400).json({ message: "Validation error", errors: error.errors });
      return;
    }
    res.status(500).json({ message: "Login failed" });
  }
});

// Get current school info
router.get("/api/school/info", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const school = await storage.getSchool(req.school!.id);
    if (!school) {
      res.status(404).json({ message: "School not found" });
      return;
    }
    
    res.json({
      id: school.id,
      name: school.name,
      subdomain: school.subdomain,
      slug: school.slug,
      email: school.email,
      phone: school.phone,
      logoUrl: school.logoUrl,
      address: school.address,
      city: school.city,
      state: school.state,
      country: school.country,
      subscriptionStatus: school.subscriptionStatus,
      trialEndDate: school.trialEndDate,
      primaryColor: school.primaryColor,
      secondaryColor: school.secondaryColor,
    });
  } catch (error: any) {
    console.error("Error fetching school info:", error);
    res.status(500).json({ message: "Failed to fetch school information" });
  }
});

// Get school users (admin only)
router.get("/api/school/users", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { role } = req.query;
    let users;
    
    if (role && typeof role === 'string') {
      users = await storage.getSchoolUsersByRole(req.school!.id, role);
    } else {
      users = await storage.getSchoolUsers(req.school!.id);
    }
    
    // Remove passwords from response
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
  } catch (error: any) {
    console.error("Error fetching school users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Create school user (admin only)
const createSchoolUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["school_admin", "teacher", "student", "parent"]),
  phone: z.string().optional(),
  admissionNumber: z.string().optional(),
  employeeId: z.string().optional(),
});

router.post("/api/school/users", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const validatedData = createSchoolUserSchema.parse(req.body);
    const schoolId = req.school!.id;
    
    // Check if email already exists in this school
    const existingUser = await storage.getSchoolUserByEmail(schoolId, validatedData.email);
    if (existingUser) {
      res.status(400).json({ message: "A user with this email already exists in your school" });
      return;
    }
    
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    
    const user = await storage.createSchoolUser({
      schoolId,
      email: validatedData.email,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      password: hashedPassword,
      role: validatedData.role,
      phone: validatedData.phone || null,
      admissionNumber: validatedData.admissionNumber || null,
      employeeId: validatedData.employeeId || null,
    });
    
    const { password, ...safeUser } = user;
    res.status(201).json(safeUser);
  } catch (error: any) {
    console.error("Error creating school user:", error);
    if (error.name === "ZodError") {
      res.status(400).json({ message: "Validation error", errors: error.errors });
      return;
    }
    res.status(500).json({ message: "Failed to create user" });
  }
});

// Update school user
router.patch("/api/school/users/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await storage.getSchoolUser(id);
    
    if (!user || user.schoolId !== req.school!.id) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    
    const updateData: any = {};
    
    if (req.body.firstName) updateData.firstName = req.body.firstName;
    if (req.body.lastName) updateData.lastName = req.body.lastName;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
    if (req.body.role) updateData.role = req.body.role;
    
    if (req.body.password) {
      updateData.password = await bcrypt.hash(req.body.password, 10);
    }
    
    const updatedUser = await storage.updateSchoolUser(id, updateData);
    const { password, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (error: any) {
    console.error("Error updating school user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
});

// Delete school user
router.delete("/api/school/users/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await storage.getSchoolUser(id);
    
    if (!user || user.schoolId !== req.school!.id) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    
    await storage.deleteSchoolUser(id);
    res.json({ message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting school user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

// Parent-Student linking
router.post("/api/school/parent-student-link", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { parentId, studentId, relationship } = req.body;
    const schoolId = req.school!.id;
    
    // Verify both users exist and belong to this school
    const parent = await storage.getSchoolUser(parentId);
    const student = await storage.getSchoolUser(studentId);
    
    if (!parent || parent.schoolId !== schoolId || parent.role !== 'parent') {
      res.status(400).json({ message: "Invalid parent user" });
      return;
    }
    
    if (!student || student.schoolId !== schoolId || student.role !== 'student') {
      res.status(400).json({ message: "Invalid student user" });
      return;
    }
    
    const link = await storage.createParentStudentLink({
      parentId,
      studentId,
      relationship: relationship || 'parent',
    });
    
    res.status(201).json(link);
  } catch (error: any) {
    console.error("Error creating parent-student link:", error);
    res.status(500).json({ message: "Failed to link parent and student" });
  }
});

// Get parent's linked students
router.get("/api/school/parent/:parentId/students", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { parentId } = req.params;
    const links = await storage.getParentStudentLinks(parentId);
    
    const students = await Promise.all(
      links.map(async (link) => {
        const student = await storage.getSchoolUser(link.studentId);
        if (student) {
          const { password, ...safeStudent } = student;
          return { ...safeStudent, relationship: link.relationship };
        }
        return null;
      })
    );
    
    res.json(students.filter(Boolean));
  } catch (error: any) {
    console.error("Error fetching parent's students:", error);
    res.status(500).json({ message: "Failed to fetch linked students" });
  }
});

// Update school settings (admin only)
router.patch("/api/school/settings", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const allowedFields = ['name', 'email', 'phone', 'address', 'city', 'state', 'country', 'logoUrl', 'primaryColor', 'secondaryColor'];
    const updateData: any = {};
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }
    
    const school = await storage.updateSchool(req.school!.id, updateData);
    res.json({
      id: school.id,
      name: school.name,
      subdomain: school.subdomain,
      email: school.email,
      phone: school.phone,
      logoUrl: school.logoUrl,
      address: school.address,
      city: school.city,
      state: school.state,
      country: school.country,
      primaryColor: school.primaryColor,
      secondaryColor: school.secondaryColor,
    });
  } catch (error: any) {
    console.error("Error updating school settings:", error);
    res.status(500).json({ message: "Failed to update school settings" });
  }
});

// Get school subscription status
router.get("/api/school/subscription", requireSchoolContext, async (req: Request, res: Response) => {
  try {
    const school = await storage.getSchool(req.school!.id);
    if (!school) {
      res.status(404).json({ message: "School not found" });
      return;
    }
    
    let plan = null;
    if (school.subscriptionPlanId) {
      plan = await storage.getSubscriptionPlan(school.subscriptionPlanId);
    }
    
    res.json({
      status: school.subscriptionStatus,
      plan: plan ? {
        id: plan.id,
        name: plan.name,
        code: plan.code,
        price: plan.price,
        billingPeriod: plan.billingPeriod,
      } : null,
      trialStartDate: school.trialStartDate,
      trialEndDate: school.trialEndDate,
      subscriptionStartDate: school.subscriptionStartDate,
      subscriptionEndDate: school.subscriptionEndDate,
    });
  } catch (error: any) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({ message: "Failed to fetch subscription status" });
  }
});

// Dashboard stats
router.get("/api/school/dashboard/stats", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const schoolId = req.school!.id;
    
    const [students, teachers, parents, admins] = await Promise.all([
      storage.getSchoolUsersByRole(schoolId, 'student'),
      storage.getSchoolUsersByRole(schoolId, 'teacher'),
      storage.getSchoolUsersByRole(schoolId, 'parent'),
      storage.getSchoolUsersByRole(schoolId, 'school_admin'),
    ]);
    
    res.json({
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalParents: parents.length,
      totalAdmins: admins.length,
      totalUsers: students.length + teachers.length + parents.length + admins.length,
    });
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

export default router;
