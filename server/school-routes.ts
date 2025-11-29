import { Router, Request, Response } from "express";
import { storage } from "./storage";
import { requireSchoolContext, checkTrialStatus } from "./school-middleware";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { nanoid } from "nanoid";
import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure school materials upload directory exists
const schoolMaterialsDir = 'uploads/school-materials/';
if (!fs.existsSync(schoolMaterialsDir)) {
  fs.mkdirSync(schoolMaterialsDir, { recursive: true });
}

// Configure multer for school material uploads
const schoolMaterialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, schoolMaterialsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadSchoolMaterial = multer({
  storage: schoolMaterialStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for school materials
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|ppt|pptx|xls|xlsx|txt|jpg|jpeg|png|gif|mp4|mp3|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, JPG, PNG, GIF, MP4, MP3, ZIP'));
    }
  }
});

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
    
    // Set school user session
    req.session.schoolUserId = user.id;
    req.session.schoolId = schoolId;
    
    // Save session explicitly
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
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

// School logout
router.post("/api/school/auth/logout", requireSchoolContext, async (req: Request, res: Response) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        res.status(500).json({ message: "Logout failed" });
        return;
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  } catch (error: any) {
    console.error("School logout error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
});

// Get current school user session
router.get("/api/school/auth/me", requireSchoolContext, async (req: Request, res: Response) => {
  try {
    if (!req.session.schoolUserId || !req.session.schoolId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    
    if (req.session.schoolId !== req.school!.id) {
      res.status(403).json({ message: "School mismatch" });
      return;
    }
    
    const user = await storage.getSchoolUser(req.session.schoolUserId);
    if (!user || !user.isActive) {
      req.session.destroy(() => {});
      res.status(401).json({ message: "Session invalid" });
      return;
    }
    
    const { password, ...safeUser } = user;
    res.json({
      user: safeUser,
      school: {
        id: req.school!.id,
        name: req.school!.name,
        subdomain: req.school!.subdomain,
        logoUrl: req.school!.logoUrl,
      },
    });
  } catch (error: any) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
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

// Get all parents with their linked students
router.get("/api/school/parents-with-students", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const schoolId = req.school!.id;
    const parents = await storage.getSchoolUsersByRole(schoolId, 'parent');
    
    const parentsWithStudents = await Promise.all(
      parents.map(async (parent) => {
        const links = await storage.getParentStudentLinks(parent.id);
        const linkedStudents = await Promise.all(
          links.map(async (link) => {
            const student = await storage.getSchoolUser(link.studentId);
            if (student) {
              const { password, ...safeStudent } = student;
              return { ...safeStudent, relationship: link.relationship };
            }
            return null;
          })
        );
        const { password, ...safeParent } = parent;
        return {
          ...safeParent,
          linkedStudents: linkedStudents.filter(Boolean),
        };
      })
    );
    
    res.json(parentsWithStudents);
  } catch (error: any) {
    console.error("Error fetching parents with students:", error);
    res.status(500).json({ message: "Failed to fetch parents with students" });
  }
});

// Delete parent-student link
router.delete("/api/school/parent-student-link/:parentId/:studentId", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { parentId, studentId } = req.params;
    const schoolId = req.school!.id;
    
    // Verify both users belong to this school
    const parent = await storage.getSchoolUser(parentId);
    const student = await storage.getSchoolUser(studentId);
    
    if (!parent || parent.schoolId !== schoolId) {
      res.status(404).json({ message: "Parent not found" });
      return;
    }
    
    if (!student || student.schoolId !== schoolId) {
      res.status(404).json({ message: "Student not found" });
      return;
    }
    
    await storage.deleteParentStudentLink(parentId, studentId);
    res.json({ message: "Link removed successfully" });
  } catch (error: any) {
    console.error("Error deleting parent-student link:", error);
    res.status(500).json({ message: "Failed to remove link" });
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
    
    const [students, teachers, parents, admins, classes, subjects] = await Promise.all([
      storage.getSchoolUsersByRole(schoolId, 'student'),
      storage.getSchoolUsersByRole(schoolId, 'teacher'),
      storage.getSchoolUsersByRole(schoolId, 'parent'),
      storage.getSchoolUsersByRole(schoolId, 'school_admin'),
      storage.getSchoolClasses(schoolId),
      storage.getSchoolSubjects(schoolId),
    ]);
    
    res.json({
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalParents: parents.length,
      totalAdmins: admins.length,
      totalUsers: students.length + teachers.length + parents.length + admins.length,
      totalClasses: classes.length,
      totalSubjects: subjects.length,
    });
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

// ============================================
// ACADEMIC TERM ROUTES
// ============================================

const academicTermSchema = z.object({
  name: z.string().min(1, "Term name is required"),
  sessionYear: z.string().min(1, "Session year is required"),
  startDate: z.string().transform(s => new Date(s)),
  endDate: z.string().transform(s => new Date(s)),
  isCurrent: z.boolean().optional(),
});

router.get("/api/school/terms", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const terms = await storage.getAcademicTerms(req.school!.id);
    res.json(terms);
  } catch (error: any) {
    console.error("Error fetching terms:", error);
    res.status(500).json({ message: "Failed to fetch academic terms" });
  }
});

router.get("/api/school/terms/current", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const term = await storage.getCurrentAcademicTerm(req.school!.id);
    res.json(term || null);
  } catch (error: any) {
    console.error("Error fetching current term:", error);
    res.status(500).json({ message: "Failed to fetch current term" });
  }
});

router.get("/api/school/terms/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const term = await storage.getAcademicTerm(req.params.id);
    if (!term || term.schoolId !== req.school!.id) {
      res.status(404).json({ message: "Term not found" });
      return;
    }
    res.json(term);
  } catch (error: any) {
    console.error("Error fetching term:", error);
    res.status(500).json({ message: "Failed to fetch term" });
  }
});

router.post("/api/school/terms", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const data = academicTermSchema.parse(req.body);
    const term = await storage.createAcademicTerm({
      schoolId: req.school!.id,
      name: data.name,
      sessionYear: data.sessionYear,
      startDate: data.startDate,
      endDate: data.endDate,
      isCurrent: data.isCurrent || false,
    });
    
    if (data.isCurrent) {
      await storage.setCurrentAcademicTerm(req.school!.id, term.id);
    }
    
    res.status(201).json(term);
  } catch (error: any) {
    console.error("Error creating term:", error);
    if (error.name === "ZodError") {
      res.status(400).json({ message: "Validation error", errors: error.errors });
      return;
    }
    res.status(500).json({ message: "Failed to create term" });
  }
});

router.patch("/api/school/terms/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const existing = await storage.getAcademicTerm(req.params.id);
    if (!existing || existing.schoolId !== req.school!.id) {
      res.status(404).json({ message: "Term not found" });
      return;
    }
    
    const updateData: any = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.sessionYear) updateData.sessionYear = req.body.sessionYear;
    if (req.body.startDate) updateData.startDate = new Date(req.body.startDate);
    if (req.body.endDate) updateData.endDate = new Date(req.body.endDate);
    
    const term = await storage.updateAcademicTerm(req.params.id, updateData);
    
    if (req.body.isCurrent === true) {
      await storage.setCurrentAcademicTerm(req.school!.id, term.id);
    }
    
    res.json(term);
  } catch (error: any) {
    console.error("Error updating term:", error);
    res.status(500).json({ message: "Failed to update term" });
  }
});

router.delete("/api/school/terms/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const existing = await storage.getAcademicTerm(req.params.id);
    if (!existing || existing.schoolId !== req.school!.id) {
      res.status(404).json({ message: "Term not found" });
      return;
    }
    await storage.deleteAcademicTerm(req.params.id);
    res.json({ message: "Term deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting term:", error);
    res.status(500).json({ message: "Failed to delete term" });
  }
});

// ============================================
// SCHOOL CLASS ROUTES
// ============================================

const schoolClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  level: z.number().optional(),
  section: z.string().optional(),
  capacity: z.number().optional(),
  classTeacherId: z.string().optional(),
  description: z.string().optional(),
});

router.get("/api/school/classes", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const classes = await storage.getSchoolClasses(req.school!.id);
    res.json(classes);
  } catch (error: any) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ message: "Failed to fetch classes" });
  }
});

router.get("/api/school/classes/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const cls = await storage.getSchoolClass(req.params.id);
    if (!cls || cls.schoolId !== req.school!.id) {
      res.status(404).json({ message: "Class not found" });
      return;
    }
    res.json(cls);
  } catch (error: any) {
    console.error("Error fetching class:", error);
    res.status(500).json({ message: "Failed to fetch class" });
  }
});

router.post("/api/school/classes", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const data = schoolClassSchema.parse(req.body);
    const cls = await storage.createSchoolClass({
      schoolId: req.school!.id,
      name: data.name,
      level: data.level || null,
      section: data.section || null,
      capacity: data.capacity || null,
      classTeacherId: data.classTeacherId || null,
      description: data.description || null,
    });
    res.status(201).json(cls);
  } catch (error: any) {
    console.error("Error creating class:", error);
    if (error.name === "ZodError") {
      res.status(400).json({ message: "Validation error", errors: error.errors });
      return;
    }
    res.status(500).json({ message: "Failed to create class" });
  }
});

router.patch("/api/school/classes/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const existing = await storage.getSchoolClass(req.params.id);
    if (!existing || existing.schoolId !== req.school!.id) {
      res.status(404).json({ message: "Class not found" });
      return;
    }
    
    const updateData: any = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.level !== undefined) updateData.level = req.body.level;
    if (req.body.section !== undefined) updateData.section = req.body.section;
    if (req.body.capacity !== undefined) updateData.capacity = req.body.capacity;
    if (req.body.classTeacherId !== undefined) updateData.classTeacherId = req.body.classTeacherId;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
    
    const cls = await storage.updateSchoolClass(req.params.id, updateData);
    res.json(cls);
  } catch (error: any) {
    console.error("Error updating class:", error);
    res.status(500).json({ message: "Failed to update class" });
  }
});

router.delete("/api/school/classes/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const existing = await storage.getSchoolClass(req.params.id);
    if (!existing || existing.schoolId !== req.school!.id) {
      res.status(404).json({ message: "Class not found" });
      return;
    }
    await storage.deleteSchoolClass(req.params.id);
    res.json({ message: "Class deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting class:", error);
    res.status(500).json({ message: "Failed to delete class" });
  }
});

// ============================================
// SCHOOL SUBJECT ROUTES
// ============================================

const schoolSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().optional(),
  description: z.string().optional(),
  creditUnits: z.number().optional(),
  isCompulsory: z.boolean().optional(),
});

router.get("/api/school/subjects", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const subjects = await storage.getSchoolSubjects(req.school!.id);
    res.json(subjects);
  } catch (error: any) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ message: "Failed to fetch subjects" });
  }
});

router.get("/api/school/subjects/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const subject = await storage.getSchoolSubject(req.params.id);
    if (!subject || subject.schoolId !== req.school!.id) {
      res.status(404).json({ message: "Subject not found" });
      return;
    }
    res.json(subject);
  } catch (error: any) {
    console.error("Error fetching subject:", error);
    res.status(500).json({ message: "Failed to fetch subject" });
  }
});

router.post("/api/school/subjects", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const data = schoolSubjectSchema.parse(req.body);
    const subject = await storage.createSchoolSubject({
      schoolId: req.school!.id,
      name: data.name,
      code: data.code || null,
      description: data.description || null,
      creditUnits: data.creditUnits || 1,
      isCompulsory: data.isCompulsory ?? true,
    });
    res.status(201).json(subject);
  } catch (error: any) {
    console.error("Error creating subject:", error);
    if (error.name === "ZodError") {
      res.status(400).json({ message: "Validation error", errors: error.errors });
      return;
    }
    res.status(500).json({ message: "Failed to create subject" });
  }
});

router.patch("/api/school/subjects/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const existing = await storage.getSchoolSubject(req.params.id);
    if (!existing || existing.schoolId !== req.school!.id) {
      res.status(404).json({ message: "Subject not found" });
      return;
    }
    
    const updateData: any = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.code !== undefined) updateData.code = req.body.code;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.creditUnits !== undefined) updateData.creditUnits = req.body.creditUnits;
    if (req.body.isCompulsory !== undefined) updateData.isCompulsory = req.body.isCompulsory;
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
    
    const subject = await storage.updateSchoolSubject(req.params.id, updateData);
    res.json(subject);
  } catch (error: any) {
    console.error("Error updating subject:", error);
    res.status(500).json({ message: "Failed to update subject" });
  }
});

router.delete("/api/school/subjects/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const existing = await storage.getSchoolSubject(req.params.id);
    if (!existing || existing.schoolId !== req.school!.id) {
      res.status(404).json({ message: "Subject not found" });
      return;
    }
    await storage.deleteSchoolSubject(req.params.id);
    res.json({ message: "Subject deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting subject:", error);
    res.status(500).json({ message: "Failed to delete subject" });
  }
});

// Class-Subject associations
router.get("/api/school/classes/:classId/subjects", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const classSubjectsList = await storage.getClassSubjects(req.params.classId);
    const subjectsWithDetails = await Promise.all(
      classSubjectsList.map(async (cs) => {
        const subject = await storage.getSchoolSubject(cs.subjectId);
        return { ...cs, subject };
      })
    );
    res.json(subjectsWithDetails);
  } catch (error: any) {
    console.error("Error fetching class subjects:", error);
    res.status(500).json({ message: "Failed to fetch class subjects" });
  }
});

router.post("/api/school/classes/:classId/subjects", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { subjectId, isCompulsory } = req.body;
    const cs = await storage.addSubjectToClass({
      classId: req.params.classId,
      subjectId,
      isCompulsory: isCompulsory ?? true,
    });
    res.status(201).json(cs);
  } catch (error: any) {
    console.error("Error adding subject to class:", error);
    res.status(500).json({ message: "Failed to add subject to class" });
  }
});

router.delete("/api/school/classes/:classId/subjects/:subjectId", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    await storage.removeSubjectFromClass(req.params.classId, req.params.subjectId);
    res.json({ message: "Subject removed from class" });
  } catch (error: any) {
    console.error("Error removing subject from class:", error);
    res.status(500).json({ message: "Failed to remove subject from class" });
  }
});

// ============================================
// TEACHER ASSIGNMENT ROUTES
// ============================================

router.get("/api/school/assignments", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { termId } = req.query;
    const assignments = await storage.getTeacherAssignments(req.school!.id, termId as string | undefined);
    res.json(assignments);
  } catch (error: any) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ message: "Failed to fetch teacher assignments" });
  }
});

router.get("/api/school/teachers/:teacherId/assignments", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const assignments = await storage.getTeacherAssignmentsByTeacher(req.params.teacherId);
    res.json(assignments);
  } catch (error: any) {
    console.error("Error fetching teacher assignments:", error);
    res.status(500).json({ message: "Failed to fetch teacher assignments" });
  }
});

router.post("/api/school/assignments", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { teacherId, classId, subjectId, termId } = req.body;
    const assignment = await storage.createTeacherAssignment({
      schoolId: req.school!.id,
      teacherId,
      classId,
      subjectId,
      termId: termId || null,
    });
    res.status(201).json(assignment);
  } catch (error: any) {
    console.error("Error creating assignment:", error);
    res.status(500).json({ message: "Failed to create teacher assignment" });
  }
});

router.delete("/api/school/assignments/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    await storage.deleteTeacherAssignment(req.params.id);
    res.json({ message: "Assignment deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting assignment:", error);
    res.status(500).json({ message: "Failed to delete assignment" });
  }
});

// ============================================
// CLASS ENROLLMENT ROUTES
// ============================================

router.get("/api/school/classes/:classId/enrollments", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { termId } = req.query;
    const enrollments = await storage.getClassEnrollments(req.params.classId, termId as string | undefined);
    const enrollmentsWithStudents = await Promise.all(
      enrollments.map(async (e) => {
        const student = await storage.getSchoolUser(e.studentId);
        if (student) {
          const { password, ...safeStudent } = student;
          return { ...e, student: safeStudent };
        }
        return e;
      })
    );
    res.json(enrollmentsWithStudents);
  } catch (error: any) {
    console.error("Error fetching enrollments:", error);
    res.status(500).json({ message: "Failed to fetch enrollments" });
  }
});

router.get("/api/school/students/:studentId/enrollments", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const enrollments = await storage.getStudentEnrollments(req.params.studentId);
    res.json(enrollments);
  } catch (error: any) {
    console.error("Error fetching student enrollments:", error);
    res.status(500).json({ message: "Failed to fetch student enrollments" });
  }
});

router.post("/api/school/enrollments", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { studentId, classId, termId } = req.body;
    const enrollment = await storage.enrollStudent({
      studentId,
      classId,
      termId: termId || null,
      status: "active",
    });
    res.status(201).json(enrollment);
  } catch (error: any) {
    console.error("Error creating enrollment:", error);
    res.status(500).json({ message: "Failed to enroll student" });
  }
});

router.patch("/api/school/enrollments/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const enrollment = await storage.updateEnrollment(req.params.id, { status });
    res.json(enrollment);
  } catch (error: any) {
    console.error("Error updating enrollment:", error);
    res.status(500).json({ message: "Failed to update enrollment" });
  }
});

router.delete("/api/school/enrollments/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    await storage.deleteEnrollment(req.params.id);
    res.json({ message: "Enrollment deleted" });
  } catch (error: any) {
    console.error("Error deleting enrollment:", error);
    res.status(500).json({ message: "Failed to delete enrollment" });
  }
});

// ============================================
// ATTENDANCE ROUTES
// ============================================

router.get("/api/school/attendance", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { classId, date, subjectId } = req.query;
    if (!classId || !date) {
      res.status(400).json({ message: "classId and date are required" });
      return;
    }
    const records = await storage.getAttendanceRecords(
      classId as string, 
      new Date(date as string),
      subjectId as string | undefined
    );
    res.json(records);
  } catch (error: any) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ message: "Failed to fetch attendance records" });
  }
});

router.get("/api/school/students/:studentId/attendance", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { termId } = req.query;
    if (!termId) {
      res.status(400).json({ message: "termId is required" });
      return;
    }
    const records = await storage.getStudentAttendance(req.params.studentId, termId as string);
    res.json(records);
  } catch (error: any) {
    console.error("Error fetching student attendance:", error);
    res.status(500).json({ message: "Failed to fetch student attendance" });
  }
});

router.post("/api/school/attendance", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { classId, studentId, termId, subjectId, date, status, markedById, remarks } = req.body;
    const record = await storage.markAttendance({
      schoolId: req.school!.id,
      classId,
      studentId,
      termId,
      subjectId: subjectId || null,
      date: new Date(date),
      status,
      markedById: markedById || null,
      remarks: remarks || null,
    });
    res.status(201).json(record);
  } catch (error: any) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ message: "Failed to mark attendance" });
  }
});

router.post("/api/school/attendance/bulk", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { classId, termId, subjectId, date, markedById, records } = req.body;
    const attendanceRecords = records.map((r: any) => ({
      schoolId: req.school!.id,
      classId,
      termId,
      subjectId: subjectId || null,
      date: new Date(date),
      studentId: r.studentId,
      status: r.status,
      markedById: markedById || null,
      remarks: r.remarks || null,
    }));
    const result = await storage.bulkMarkAttendance(attendanceRecords);
    res.status(201).json(result);
  } catch (error: any) {
    console.error("Error bulk marking attendance:", error);
    res.status(500).json({ message: "Failed to mark attendance" });
  }
});

router.patch("/api/school/attendance/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { status, remarks } = req.body;
    const record = await storage.updateAttendance(req.params.id, { status, remarks });
    res.json(record);
  } catch (error: any) {
    console.error("Error updating attendance:", error);
    res.status(500).json({ message: "Failed to update attendance" });
  }
});

router.get("/api/school/classes/:classId/attendance-summary", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { termId } = req.query;
    if (!termId) {
      res.status(400).json({ message: "termId is required" });
      return;
    }
    const summary = await storage.getAttendanceSummary(req.params.classId, termId as string);
    res.json(summary);
  } catch (error: any) {
    console.error("Error fetching attendance summary:", error);
    res.status(500).json({ message: "Failed to fetch attendance summary" });
  }
});

router.get("/api/school/classes/:classId/subjects/:subjectId/attendance", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { termId } = req.query;
    if (!termId) {
      res.status(400).json({ message: "termId is required" });
      return;
    }
    const records = await storage.getSubjectAttendance(req.params.classId, req.params.subjectId, termId as string);
    res.json(records);
  } catch (error: any) {
    console.error("Error fetching subject attendance:", error);
    res.status(500).json({ message: "Failed to fetch subject attendance" });
  }
});

router.get("/api/school/attendance/report", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { classId, termId, startDate, endDate } = req.query;
    if (!classId || !termId || !startDate || !endDate) {
      res.status(400).json({ message: "classId, termId, startDate, and endDate are required" });
      return;
    }
    const records = await storage.getAttendanceReport(
      classId as string,
      termId as string,
      new Date(startDate as string),
      new Date(endDate as string)
    );
    res.json(records);
  } catch (error: any) {
    console.error("Error fetching attendance report:", error);
    res.status(500).json({ message: "Failed to fetch attendance report" });
  }
});

// Get authenticated parent's linked children
router.get("/api/school/parent/children", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const parentUser = req.schoolUser;
    
    if (!parentUser || parentUser.role !== 'parent') {
      res.status(403).json({ message: "Access denied. Parent role required." });
      return;
    }
    
    const links = await storage.getParentStudentLinks(parentUser.id);
    
    const children = await Promise.all(
      links.map(async (link) => {
        const student = await storage.getSchoolUser(link.studentId);
        if (student) {
          // Get student's class info
          let className = "";
          if (student.classId) {
            const studentClass = await storage.getSchoolClass(student.classId);
            if (studentClass) {
              className = studentClass.name;
            }
          }
          
          return {
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            admissionNumber: student.admissionNumber || "",
            classId: student.classId || "",
            className,
            email: student.email,
            relationship: link.relationship,
          };
        }
        return null;
      })
    );
    
    res.json(children.filter(Boolean));
  } catch (error: any) {
    console.error("Error fetching parent's children:", error);
    res.status(500).json({ message: "Failed to fetch linked children" });
  }
});

router.get("/api/school/parent/children/:childId/attendance", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { termId } = req.query;
    if (!termId) {
      res.status(400).json({ message: "termId is required" });
      return;
    }
    const summary = await storage.getStudentAttendanceSummary(req.params.childId, termId as string);
    res.json(summary);
  } catch (error: any) {
    console.error("Error fetching child attendance:", error);
    res.status(500).json({ message: "Failed to fetch child attendance" });
  }
});

router.get("/api/school/parent/children/:childId/grades", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { termId } = req.query;
    if (!termId) {
      res.status(400).json({ message: "termId is required" });
      return;
    }
    const grades = await storage.getStudentGradesSummary(req.params.childId, termId as string);
    res.json(grades);
  } catch (error: any) {
    console.error("Error fetching child grades:", error);
    res.status(500).json({ message: "Failed to fetch child grades" });
  }
});

router.get("/api/school/parent/children/:childId/fees", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const summary = await storage.getStudentFeeSummary(req.params.childId);
    res.json(summary);
  } catch (error: any) {
    console.error("Error fetching child fees:", error);
    res.status(500).json({ message: "Failed to fetch child fees" });
  }
});

// ============================================
// ASSESSMENT TYPE ROUTES
// ============================================

router.get("/api/school/assessment-types", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const types = await storage.getAssessmentTypes(req.school!.id);
    res.json(types);
  } catch (error: any) {
    console.error("Error fetching assessment types:", error);
    res.status(500).json({ message: "Failed to fetch assessment types" });
  }
});

router.post("/api/school/assessment-types", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { name, code, weight, maxScore, description } = req.body;
    const type = await storage.createAssessmentType({
      schoolId: req.school!.id,
      name,
      code: code || null,
      weight,
      maxScore: maxScore || 100,
      description: description || null,
    });
    res.status(201).json(type);
  } catch (error: any) {
    console.error("Error creating assessment type:", error);
    res.status(500).json({ message: "Failed to create assessment type" });
  }
});

router.patch("/api/school/assessment-types/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const type = await storage.updateAssessmentType(req.params.id, req.body);
    res.json(type);
  } catch (error: any) {
    console.error("Error updating assessment type:", error);
    res.status(500).json({ message: "Failed to update assessment type" });
  }
});

router.delete("/api/school/assessment-types/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    await storage.deleteAssessmentType(req.params.id);
    res.json({ message: "Assessment type deleted" });
  } catch (error: any) {
    console.error("Error deleting assessment type:", error);
    res.status(500).json({ message: "Failed to delete assessment type" });
  }
});

// ============================================
// STUDENT GRADES ROUTES
// ============================================

router.get("/api/school/students/:studentId/grades", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { termId } = req.query;
    if (!termId) {
      res.status(400).json({ message: "termId is required" });
      return;
    }
    const grades = await storage.getStudentGrades(req.params.studentId, termId as string);
    res.json(grades);
  } catch (error: any) {
    console.error("Error fetching student grades:", error);
    res.status(500).json({ message: "Failed to fetch student grades" });
  }
});

router.get("/api/school/classes/:classId/subjects/:subjectId/grades", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { termId } = req.query;
    if (!termId) {
      res.status(400).json({ message: "termId is required" });
      return;
    }
    const grades = await storage.getClassGrades(req.params.classId, req.params.subjectId, termId as string);
    res.json(grades);
  } catch (error: any) {
    console.error("Error fetching class grades:", error);
    res.status(500).json({ message: "Failed to fetch class grades" });
  }
});

router.get("/api/school/grades", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { classId, subjectId, termId } = req.query;
    if (!classId || !subjectId || !termId) {
      res.status(400).json({ message: "classId, subjectId, and termId are required" });
      return;
    }
    const grades = await storage.getClassGrades(classId as string, subjectId as string, termId as string);
    res.json(grades);
  } catch (error: any) {
    console.error("Error fetching grades:", error);
    res.status(500).json({ message: "Failed to fetch grades" });
  }
});

router.post("/api/school/grades", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { studentId, classId, subjectId, termId, assessmentTypeId, score, maxScore, remarks, gradedById } = req.body;
    const grade = await storage.createStudentGrade({
      schoolId: req.school!.id,
      studentId,
      classId,
      subjectId,
      termId,
      assessmentTypeId,
      score,
      maxScore,
      remarks: remarks || null,
      gradedById: gradedById || null,
    });
    res.status(201).json(grade);
  } catch (error: any) {
    console.error("Error creating grade:", error);
    res.status(500).json({ message: "Failed to create grade" });
  }
});

router.patch("/api/school/grades/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { score, remarks } = req.body;
    const grade = await storage.updateStudentGrade(req.params.id, { score, remarks });
    res.json(grade);
  } catch (error: any) {
    console.error("Error updating grade:", error);
    res.status(500).json({ message: "Failed to update grade" });
  }
});

router.delete("/api/school/grades/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    await storage.deleteStudentGrade(req.params.id);
    res.json({ message: "Grade deleted" });
  } catch (error: any) {
    console.error("Error deleting grade:", error);
    res.status(500).json({ message: "Failed to delete grade" });
  }
});

router.post("/api/school/grades/bulk", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { classId, subjectId, termId, assessmentTypeId, entries } = req.body;
    if (!classId || !subjectId || !termId || !assessmentTypeId || !entries || !Array.isArray(entries)) {
      res.status(400).json({ message: "classId, subjectId, termId, assessmentTypeId, and entries array are required" });
      return;
    }
    
    const assessmentType = await storage.getAssessmentType(assessmentTypeId);
    if (!assessmentType) {
      res.status(404).json({ message: "Assessment type not found" });
      return;
    }
    
    const grades = await storage.bulkCreateStudentGrades(
      entries.map((entry: { studentId: string; score: number }) => ({
        schoolId: req.school!.id,
        studentId: entry.studentId,
        classId,
        subjectId,
        termId,
        assessmentTypeId,
        score: entry.score,
        maxScore: assessmentType.maxScore,
        remarks: null,
        gradedById: req.schoolUser?.id || null,
      }))
    );
    res.status(201).json(grades);
  } catch (error: any) {
    console.error("Error bulk creating grades:", error);
    res.status(500).json({ message: "Failed to save grades" });
  }
});

router.post("/api/school/results/calculate", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { classId, termId } = req.body;
    if (!classId || !termId) {
      res.status(400).json({ message: "classId and termId are required" });
      return;
    }
    
    const results = await storage.calculateTermResults(req.school!.id, classId, termId);
    res.status(201).json(results);
  } catch (error: any) {
    console.error("Error calculating term results:", error);
    res.status(500).json({ message: "Failed to calculate term results" });
  }
});

// ============================================
// TERM RESULTS ROUTES
// ============================================

router.get("/api/school/students/:studentId/results", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { termId } = req.query;
    if (!termId) {
      res.status(400).json({ message: "termId is required" });
      return;
    }
    const results = await storage.getTermResults(req.params.studentId, termId as string);
    res.json(results);
  } catch (error: any) {
    console.error("Error fetching term results:", error);
    res.status(500).json({ message: "Failed to fetch term results" });
  }
});

router.get("/api/school/classes/:classId/results", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { termId } = req.query;
    if (!termId) {
      res.status(400).json({ message: "termId is required" });
      return;
    }
    const results = await storage.getClassTermResults(req.params.classId, termId as string);
    res.json(results);
  } catch (error: any) {
    console.error("Error fetching class results:", error);
    res.status(500).json({ message: "Failed to fetch class results" });
  }
});

router.post("/api/school/results", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const result = await storage.createTermResult({
      schoolId: req.school!.id,
      ...req.body,
    });
    res.status(201).json(result);
  } catch (error: any) {
    console.error("Error creating result:", error);
    res.status(500).json({ message: "Failed to create result" });
  }
});

// ============================================
// FEE MANAGEMENT ROUTES
// ============================================

router.get("/api/school/fee-types", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const feeTypes = await storage.getFeeTypes(req.school!.id);
    res.json(feeTypes);
  } catch (error: any) {
    console.error("Error fetching fee types:", error);
    res.status(500).json({ message: "Failed to fetch fee types" });
  }
});

router.post("/api/school/fee-types", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { name, code, amount, description, isRecurring, frequency } = req.body;
    const feeType = await storage.createFeeType({
      schoolId: req.school!.id,
      name,
      code: code || null,
      amount,
      description: description || null,
      isRecurring: isRecurring ?? true,
      frequency: frequency || "termly",
    });
    res.status(201).json(feeType);
  } catch (error: any) {
    console.error("Error creating fee type:", error);
    res.status(500).json({ message: "Failed to create fee type" });
  }
});

router.patch("/api/school/fee-types/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const feeType = await storage.updateFeeType(req.params.id, req.body);
    res.json(feeType);
  } catch (error: any) {
    console.error("Error updating fee type:", error);
    res.status(500).json({ message: "Failed to update fee type" });
  }
});

router.delete("/api/school/fee-types/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    await storage.deleteFeeType(req.params.id);
    res.json({ message: "Fee type deleted" });
  } catch (error: any) {
    console.error("Error deleting fee type:", error);
    res.status(500).json({ message: "Failed to delete fee type" });
  }
});

// Class fees
router.get("/api/school/classes/:classId/fees", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { termId } = req.query;
    const fees = await storage.getClassFees(req.params.classId, termId as string | undefined);
    res.json(fees);
  } catch (error: any) {
    console.error("Error fetching class fees:", error);
    res.status(500).json({ message: "Failed to fetch class fees" });
  }
});

router.post("/api/school/class-fees", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const fee = await storage.createClassFee(req.body);
    res.status(201).json(fee);
  } catch (error: any) {
    console.error("Error creating class fee:", error);
    res.status(500).json({ message: "Failed to create class fee" });
  }
});

// Fee payments
router.get("/api/school/students/:studentId/payments", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { termId } = req.query;
    const payments = await storage.getFeePayments(req.params.studentId, termId as string | undefined);
    res.json(payments);
  } catch (error: any) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
});

router.get("/api/school/payments", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { termId } = req.query;
    const payments = await storage.getSchoolFeePayments(req.school!.id, termId as string | undefined);
    res.json(payments);
  } catch (error: any) {
    console.error("Error fetching school payments:", error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
});

router.post("/api/school/payments", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const payment = await storage.createFeePayment({
      schoolId: req.school!.id,
      ...req.body,
    });
    res.status(201).json(payment);
  } catch (error: any) {
    console.error("Error creating payment:", error);
    res.status(500).json({ message: "Failed to create payment" });
  }
});

router.get("/api/school/students/:studentId/fee-balance", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { termId } = req.query;
    if (!termId) {
      res.status(400).json({ message: "termId is required" });
      return;
    }
    const balance = await storage.getStudentFeeBalance(req.params.studentId, termId as string);
    res.json(balance);
  } catch (error: any) {
    console.error("Error fetching fee balance:", error);
    res.status(500).json({ message: "Failed to fetch fee balance" });
  }
});

router.get("/api/school/payments/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const payment = await storage.getFeePayment(req.params.id);
    if (!payment) {
      res.status(404).json({ message: "Payment not found" });
      return;
    }
    const student = await storage.getSchoolUser(payment.studentId);
    const feeType = await storage.getFeeType(payment.feeTypeId);
    res.json({ ...payment, student, feeType });
  } catch (error: any) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ message: "Failed to fetch payment" });
  }
});

// Parent outstanding fees
router.get("/api/school/parent/children/:childId/outstanding-fees", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const outstandingFees = await storage.getStudentOutstandingFees(req.params.childId);
    res.json(outstandingFees);
  } catch (error: any) {
    console.error("Error fetching outstanding fees:", error);
    res.status(500).json({ message: "Failed to fetch outstanding fees" });
  }
});

// ============================================
// PAYSTACK PAYMENT ROUTES
// ============================================

import { paystack } from "./paystack";

router.get("/api/school/paystack/status", requireSchoolContext, async (req: Request, res: Response) => {
  res.json({ configured: paystack.isConfigured() });
});

router.post("/api/school/paystack/initialize", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    if (!paystack.isConfigured()) {
      res.status(400).json({ message: "Paystack is not configured. Please contact the administrator." });
      return;
    }

    const { studentId, feeTypeId, termId, email } = req.body;
    const schoolUser = req.schoolUser!;

    if (!studentId || !feeTypeId || !termId || !email) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const student = await storage.getSchoolUser(studentId);
    const feeType = await storage.getFeeType(feeTypeId);

    if (!student || !feeType) {
      res.status(400).json({ message: "Invalid student or fee type" });
      return;
    }

    const outstandingFees = await storage.getStudentOutstandingFees(studentId);
    const feeData = outstandingFees.find(f => f.feeType.id === feeTypeId && f.termId === termId);
    
    if (!feeData || feeData.balance <= 0) {
      res.status(400).json({ message: "No outstanding balance for this fee" });
      return;
    }

    const serverCalculatedAmount = feeData.balance;

    const reference = paystack.generateReference();
    const protocol = req.protocol || 'https';
    const host = req.get('host') || process.env.REPLIT_DEV_DOMAIN || '';
    const callbackUrl = `${protocol}://${host}/school/payment-callback?reference=${reference}`;

    const result = await paystack.initializePayment({
      email,
      amount: serverCalculatedAmount,
      reference,
      callback_url: callbackUrl,
      metadata: {
        schoolId: req.school!.id,
        studentId,
        feeTypeId,
        termId,
        paidById: schoolUser.id,
        expectedAmount: serverCalculatedAmount,
        custom_fields: [
          { display_name: "Student Name", variable_name: "student_name", value: `${student.firstName} ${student.lastName}` },
          { display_name: "Fee Type", variable_name: "fee_type", value: feeType.name },
        ],
      },
    });

    const receiptNumber = await storage.generateReceiptNumber(req.school!.id);
    
    await storage.createFeePayment({
      schoolId: req.school!.id,
      studentId,
      feeTypeId,
      termId,
      amount: serverCalculatedAmount,
      paymentMethod: "paystack",
      paystackReference: reference,
      paystackAccessCode: result.data.access_code,
      status: "pending",
      paidById: schoolUser.id,
      receiptNumber,
    });

    res.json({
      authorization_url: result.data.authorization_url,
      access_code: result.data.access_code,
      reference: result.data.reference,
    });
  } catch (error: any) {
    console.error("Error initializing Paystack payment:", error);
    res.status(500).json({ message: error.message || "Failed to initialize payment" });
  }
});

router.get("/api/school/paystack/verify/:reference", requireSchoolContext, async (req: Request, res: Response) => {
  try {
    if (!paystack.isConfigured()) {
      res.status(400).json({ message: "Paystack is not configured" });
      return;
    }

    const { reference } = req.params;
    const result = await paystack.verifyPayment(reference);

    const payment = await storage.getFeePaymentByReference(reference);
    
    if (!payment) {
      res.status(404).json({ message: "Payment record not found" });
      return;
    }

    if (result.data.status === "success") {
      const paidAmount = result.data.amount;
      const expectedAmount = payment.amount;
      
      if (paidAmount !== expectedAmount) {
        console.error(`Payment amount mismatch: expected ${expectedAmount}, got ${paidAmount}`);
        await storage.updateFeePayment(payment.id, {
          status: "failed",
          notes: `Amount mismatch: expected ${expectedAmount}, received ${paidAmount}`,
        });
        res.status(400).json({ 
          status: "failed", 
          message: "Payment amount does not match expected amount. Please contact support." 
        });
        return;
      }

      await storage.updateFeePayment(payment.id, {
        status: "completed",
        paidAt: new Date(),
        paymentReference: result.data.reference,
      });
      res.json({ status: "success", message: "Payment verified successfully", payment: { ...payment, status: "completed" } });
    } else {
      await storage.updateFeePayment(payment.id, {
        status: "failed",
      });
      res.json({ status: "failed", message: result.data.gateway_response });
    }
  } catch (error: any) {
    console.error("Error verifying Paystack payment:", error);
    res.status(500).json({ message: error.message || "Failed to verify payment" });
  }
});

router.post("/api/school/paystack/webhook", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-paystack-signature"] as string;
    const body = JSON.stringify(req.body);

    if (!paystack.validateWebhookSignature(signature, body)) {
      res.status(400).json({ message: "Invalid signature" });
      return;
    }

    const event = req.body;

    if (event.event === "charge.success") {
      const reference = event.data.reference;
      const paidAmount = event.data.amount;
      const payment = await storage.getFeePaymentByReference(reference);

      if (payment && payment.status === "pending") {
        if (paidAmount !== payment.amount) {
          console.error(`Webhook: Payment amount mismatch: expected ${payment.amount}, got ${paidAmount}`);
          await storage.updateFeePayment(payment.id, {
            status: "failed",
            notes: `Amount mismatch: expected ${payment.amount}, received ${paidAmount}`,
          });
        } else {
          await storage.updateFeePayment(payment.id, {
            status: "completed",
            paidAt: new Date(),
            paymentReference: reference,
          });
        }
      }
    }

    res.sendStatus(200);
  } catch (error: any) {
    console.error("Error processing Paystack webhook:", error);
    res.sendStatus(500);
  }
});

// ============================================
// FEE REMINDERS ROUTES
// ============================================

router.get("/api/school/fees/overdue", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const overduePayments = await storage.getOverduePayments(req.school!.id);
    res.json(overduePayments);
  } catch (error: any) {
    console.error("Error fetching overdue payments:", error);
    res.status(500).json({ message: "Failed to fetch overdue payments" });
  }
});

router.post("/api/school/fees/send-reminder", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { studentId, parentId, amount, termId } = req.body;
    
    if (!studentId || !parentId || !amount || !termId) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const notification = await storage.sendFeeReminder(
      req.school!.id,
      studentId,
      parentId,
      amount,
      termId
    );

    res.json({ success: true, notification });
  } catch (error: any) {
    console.error("Error sending fee reminder:", error);
    res.status(500).json({ message: "Failed to send fee reminder" });
  }
});

router.post("/api/school/fees/send-bulk-reminders", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const overduePayments = await storage.getOverduePayments(req.school!.id);
    const results: Array<{ studentId: string; success: boolean; error?: string }> = [];

    for (const overdue of overduePayments) {
      if (overdue.parent) {
        try {
          await storage.sendFeeReminder(
            req.school!.id,
            overdue.student.id,
            overdue.parent.id,
            overdue.balance,
            overdue.termId
          );
          results.push({ studentId: overdue.student.id, success: true });
        } catch (err: any) {
          results.push({ studentId: overdue.student.id, success: false, error: err.message });
        }
      } else {
        results.push({ studentId: overdue.student.id, success: false, error: "No parent linked" });
      }
    }

    res.json({ 
      totalSent: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length,
      results 
    });
  } catch (error: any) {
    console.error("Error sending bulk fee reminders:", error);
    res.status(500).json({ message: "Failed to send bulk fee reminders" });
  }
});

// ============================================
// TIMETABLE ROUTES
// ============================================

router.get("/api/school/timetable-periods", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const periods = await storage.getTimetablePeriods(req.school!.id);
    res.json(periods);
  } catch (error: any) {
    console.error("Error fetching timetable periods:", error);
    res.status(500).json({ message: "Failed to fetch timetable periods" });
  }
});

router.post("/api/school/timetable-periods", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const period = await storage.createTimetablePeriod({
      schoolId: req.school!.id,
      ...req.body,
    });
    res.status(201).json(period);
  } catch (error: any) {
    console.error("Error creating timetable period:", error);
    res.status(500).json({ message: "Failed to create timetable period" });
  }
});

router.patch("/api/school/timetable-periods/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const period = await storage.updateTimetablePeriod(req.params.id, req.body);
    res.json(period);
  } catch (error: any) {
    console.error("Error updating timetable period:", error);
    res.status(500).json({ message: "Failed to update timetable period" });
  }
});

router.delete("/api/school/timetable-periods/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    await storage.deleteTimetablePeriod(req.params.id);
    res.json({ message: "Period deleted" });
  } catch (error: any) {
    console.error("Error deleting timetable period:", error);
    res.status(500).json({ message: "Failed to delete period" });
  }
});

// Timetable entries
router.get("/api/school/classes/:classId/timetable", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { termId } = req.query;
    const entries = await storage.getTimetableEntries(req.params.classId, termId as string | undefined);
    res.json(entries);
  } catch (error: any) {
    console.error("Error fetching timetable:", error);
    res.status(500).json({ message: "Failed to fetch timetable" });
  }
});

router.get("/api/school/teachers/:teacherId/timetable", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { termId } = req.query;
    const entries = await storage.getTeacherTimetable(req.params.teacherId, termId as string | undefined);
    res.json(entries);
  } catch (error: any) {
    console.error("Error fetching teacher timetable:", error);
    res.status(500).json({ message: "Failed to fetch teacher timetable" });
  }
});

router.post("/api/school/timetable", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { teacherId, dayOfWeek, periodId, termId } = req.body;
    
    if (teacherId) {
      const conflict = await storage.checkTeacherConflict(teacherId, dayOfWeek, periodId, termId);
      if (conflict) {
        const teacher = await storage.getSchoolUser(teacherId);
        const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'This teacher';
        res.status(400).json({ 
          message: `${teacherName} is already assigned to another class at this time slot. Please choose a different teacher or time slot.`,
          conflictingEntry: conflict,
        });
        return;
      }
    }
    
    const entry = await storage.createTimetableEntry({
      schoolId: req.school!.id,
      ...req.body,
    });
    res.status(201).json(entry);
  } catch (error: any) {
    console.error("Error creating timetable entry:", error);
    res.status(500).json({ message: "Failed to create timetable entry" });
  }
});

router.patch("/api/school/timetable/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { teacherId, dayOfWeek, periodId, termId } = req.body;
    
    if (teacherId && dayOfWeek !== undefined && periodId) {
      const conflict = await storage.checkTeacherConflict(teacherId, dayOfWeek, periodId, termId, req.params.id);
      if (conflict) {
        const teacher = await storage.getSchoolUser(teacherId);
        const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'This teacher';
        res.status(400).json({ 
          message: `${teacherName} is already assigned to another class at this time slot. Please choose a different teacher or time slot.`,
          conflictingEntry: conflict,
        });
        return;
      }
    }
    
    const entry = await storage.updateTimetableEntry(req.params.id, req.body);
    res.json(entry);
  } catch (error: any) {
    console.error("Error updating timetable entry:", error);
    res.status(500).json({ message: "Failed to update timetable entry" });
  }
});

router.delete("/api/school/timetable/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    await storage.deleteTimetableEntry(req.params.id);
    res.json({ message: "Timetable entry deleted" });
  } catch (error: any) {
    console.error("Error deleting timetable entry:", error);
    res.status(500).json({ message: "Failed to delete timetable entry" });
  }
});

// ============================================
// ANNOUNCEMENT ROUTES
// ============================================

router.get("/api/school/announcements", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { published } = req.query;
    const userRole = req.schoolUser?.role;
    const userId = req.schoolUser?.id;
    const isAdmin = userRole === "admin" || userRole === "school_admin";
    
    const isPublished = published === 'true' ? true : published === 'false' ? false : undefined;
    let announcements = await storage.getSchoolAnnouncements(req.school!.id, isPublished);
    
    if (!isAdmin && userId) {
      let userClassIds: string[] = [];
      
      if (userRole === "student") {
        const enrollments = await storage.getStudentEnrollments(userId);
        userClassIds = enrollments.map(e => e.classId);
      } else if (userRole === "parent") {
        const childLinks = await storage.getParentStudentLinks(userId);
        for (const link of childLinks) {
          const childEnrollments = await storage.getStudentEnrollments(link.studentId);
          for (const enrollment of childEnrollments) {
            if (!userClassIds.includes(enrollment.classId)) {
              userClassIds.push(enrollment.classId);
            }
          }
        }
      } else if (userRole === "teacher") {
        const assignments = await storage.getTeacherAssignmentsByTeacher(userId);
        for (const assignment of assignments) {
          if (!userClassIds.includes(assignment.classId)) {
            userClassIds.push(assignment.classId);
          }
        }
      }

      announcements = announcements.filter((announcement) => {
        if (!announcement.isPublished) return false;
        
        if (announcement.targetClassIds && announcement.targetClassIds.length > 0) {
          return userClassIds.some((classId) => announcement.targetClassIds?.includes(classId));
        }
        
        if (announcement.targetAudience === "all") return true;
        
        const roleMapping: Record<string, string[]> = {
          students: ["student"],
          teachers: ["teacher"],
          parents: ["parent"],
        };
        
        const allowedRoles = roleMapping[announcement.targetAudience] || [];
        return allowedRoles.includes(userRole || "");
      });
    }
    
    res.json(announcements);
  } catch (error: any) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
});

router.get("/api/school/announcements/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const announcement = await storage.getSchoolAnnouncement(req.params.id);
    if (!announcement || announcement.schoolId !== req.school!.id) {
      res.status(404).json({ message: "Announcement not found" });
      return;
    }
    res.json(announcement);
  } catch (error: any) {
    console.error("Error fetching announcement:", error);
    res.status(500).json({ message: "Failed to fetch announcement" });
  }
});

router.post("/api/school/announcements", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const schoolId = req.school!.id;
    const authorId = req.schoolUser!.id;
    
    const announcement = await storage.createSchoolAnnouncement({
      schoolId,
      authorId,
      ...req.body,
    });

    if (announcement.isPublished) {
      const targetUserIds: string[] = [];
      const { targetAudience, targetClassIds } = announcement;

      if (targetClassIds && targetClassIds.length > 0) {
        for (const classId of targetClassIds) {
          const enrollments = await storage.getClassEnrollments(classId);
          for (const enrollment of enrollments) {
            if (!targetUserIds.includes(enrollment.studentId)) {
              targetUserIds.push(enrollment.studentId);
              const parentLinks = await storage.getStudentParentLinks(enrollment.studentId);
              for (const link of parentLinks) {
                if (!targetUserIds.includes(link.parentId)) {
                  targetUserIds.push(link.parentId);
                }
              }
            }
          }
          const teacherAssignments = await storage.getTeacherAssignmentsByClass(classId);
          for (const assignment of teacherAssignments) {
            if (!targetUserIds.includes(assignment.teacherId)) {
              targetUserIds.push(assignment.teacherId);
            }
          }
        }
      } else {
        let users: any[] = [];
        if (targetAudience === "all") {
          users = await storage.getSchoolUsers(schoolId);
        } else if (targetAudience === "students") {
          users = await storage.getSchoolUsersByRole(schoolId, "student");
        } else if (targetAudience === "teachers") {
          users = await storage.getSchoolUsersByRole(schoolId, "teacher");
        } else if (targetAudience === "parents") {
          users = await storage.getSchoolUsersByRole(schoolId, "parent");
        }
        for (const user of users) {
          if (user.id !== authorId && !targetUserIds.includes(user.id)) {
            targetUserIds.push(user.id);
          }
        }
      }

      for (const userId of targetUserIds) {
        try {
          await storage.createSchoolNotification({
            schoolId,
            userId,
            type: announcement.type === "urgent" ? "urgent_announcement" : "announcement",
            title: announcement.type === "urgent" ? `Urgent: ${announcement.title}` : announcement.title,
            message: announcement.content.substring(0, 200) + (announcement.content.length > 200 ? "..." : ""),
            link: "/school/announcements",
          });
        } catch (notifError) {
          console.error(`Failed to send notification to user ${userId}:`, notifError);
        }
      }
    }

    res.status(201).json(announcement);
  } catch (error: any) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ message: "Failed to create announcement" });
  }
});

router.patch("/api/school/announcements/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const existing = await storage.getSchoolAnnouncement(req.params.id);
    if (!existing || existing.schoolId !== req.school!.id) {
      res.status(404).json({ message: "Announcement not found" });
      return;
    }
    const announcement = await storage.updateSchoolAnnouncement(req.params.id, req.body);
    res.json(announcement);
  } catch (error: any) {
    console.error("Error updating announcement:", error);
    res.status(500).json({ message: "Failed to update announcement" });
  }
});

router.delete("/api/school/announcements/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const existing = await storage.getSchoolAnnouncement(req.params.id);
    if (!existing || existing.schoolId !== req.school!.id) {
      res.status(404).json({ message: "Announcement not found" });
      return;
    }
    await storage.deleteSchoolAnnouncement(req.params.id);
    res.json({ message: "Announcement deleted" });
  } catch (error: any) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({ message: "Failed to delete announcement" });
  }
});

// ============================================
// SCHOOL NOTIFICATIONS ROUTES
// ============================================

router.get("/api/school/users/:userId/notifications", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const notifications = await storage.getSchoolUserNotifications(req.params.userId, limit ? parseInt(limit as string) : undefined);
    res.json(notifications);
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

router.post("/api/school/notifications", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const notification = await storage.createSchoolNotification({
      schoolId: req.school!.id,
      ...req.body,
    });
    res.status(201).json(notification);
  } catch (error: any) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Failed to create notification" });
  }
});

router.patch("/api/school/notifications/:id/read", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    await storage.markSchoolNotificationAsRead(req.params.id);
    res.json({ message: "Notification marked as read" });
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
});

router.delete("/api/school/notifications/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    await storage.deleteSchoolNotification(req.params.id);
    res.json({ message: "Notification deleted" });
  } catch (error: any) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
});

// ============================================
// SCHOOL MATERIALS/RESOURCES ROUTES
// ============================================

router.get("/api/school/materials", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const { classId, subjectId } = req.query;
    const materials = await storage.getSchoolMaterials(
      req.school!.id, 
      classId as string | undefined, 
      subjectId as string | undefined
    );
    res.json(materials);
  } catch (error: any) {
    console.error("Error fetching materials:", error);
    res.status(500).json({ message: "Failed to fetch materials" });
  }
});

router.get("/api/school/materials/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const material = await storage.getSchoolMaterial(req.params.id);
    if (!material || material.schoolId !== req.school!.id) {
      res.status(404).json({ message: "Material not found" });
      return;
    }
    res.json(material);
  } catch (error: any) {
    console.error("Error fetching material:", error);
    res.status(500).json({ message: "Failed to fetch material" });
  }
});

// Create material with URL (no file upload)
router.post("/api/school/materials", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const material = await storage.createSchoolMaterial({
      schoolId: req.school!.id,
      uploadedById: req.schoolUser!.id,
      ...req.body,
    });
    res.status(201).json(material);
  } catch (error: any) {
    console.error("Error creating material:", error);
    res.status(500).json({ message: "Failed to create material" });
  }
});

// Upload material with file
router.post("/api/school/materials/upload", requireSchoolContext, checkTrialStatus, uploadSchoolMaterial.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const { title, description, subjectId, classId, isPublic } = req.body;
    
    // Determine file type from extension
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    let fileType = 'other';
    if (['pdf'].includes(ext)) fileType = 'pdf';
    else if (['doc', 'docx'].includes(ext)) fileType = 'doc';
    else if (['xls', 'xlsx'].includes(ext)) fileType = 'xls';
    else if (['ppt', 'pptx'].includes(ext)) fileType = 'ppt';
    else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) fileType = 'image';
    else if (['mp4', 'avi', 'mov', 'webm'].includes(ext)) fileType = 'video';
    else if (['mp3', 'wav', 'ogg'].includes(ext)) fileType = 'audio';

    const material = await storage.createSchoolMaterial({
      schoolId: req.school!.id,
      uploadedById: req.schoolUser!.id,
      title: title || req.file.originalname,
      description: description || null,
      fileUrl: `/uploads/school-materials/${req.file.filename}`,
      fileType,
      fileSize: req.file.size,
      originalFilename: req.file.originalname,
      subjectId: subjectId || null,
      classId: classId || null,
      isPublic: isPublic === 'true' || isPublic === true,
    });

    res.status(201).json(material);
  } catch (error: any) {
    console.error("Error uploading material:", error);
    res.status(500).json({ message: "Failed to upload material" });
  }
});

router.patch("/api/school/materials/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const existing = await storage.getSchoolMaterial(req.params.id);
    if (!existing || existing.schoolId !== req.school!.id) {
      res.status(404).json({ message: "Material not found" });
      return;
    }
    const material = await storage.updateSchoolMaterial(req.params.id, req.body);
    res.json(material);
  } catch (error: any) {
    console.error("Error updating material:", error);
    res.status(500).json({ message: "Failed to update material" });
  }
});

router.delete("/api/school/materials/:id", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const existing = await storage.getSchoolMaterial(req.params.id);
    if (!existing || existing.schoolId !== req.school!.id) {
      res.status(404).json({ message: "Material not found" });
      return;
    }
    await storage.deleteSchoolMaterial(req.params.id);
    res.json({ message: "Material deleted" });
  } catch (error: any) {
    console.error("Error deleting material:", error);
    res.status(500).json({ message: "Failed to delete material" });
  }
});

// Increment view count
router.post("/api/school/materials/:id/view", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const existing = await storage.getSchoolMaterial(req.params.id);
    if (!existing || existing.schoolId !== req.school!.id) {
      res.status(404).json({ message: "Material not found" });
      return;
    }
    await storage.incrementMaterialViewCount(req.params.id);
    res.json({ message: "View count incremented" });
  } catch (error: any) {
    console.error("Error incrementing view count:", error);
    res.status(500).json({ message: "Failed to increment view count" });
  }
});

// Increment download count
router.post("/api/school/materials/:id/download", requireSchoolContext, checkTrialStatus, async (req: Request, res: Response) => {
  try {
    const existing = await storage.getSchoolMaterial(req.params.id);
    if (!existing || existing.schoolId !== req.school!.id) {
      res.status(404).json({ message: "Material not found" });
      return;
    }
    await storage.incrementMaterialDownloadCount(req.params.id);
    res.json({ message: "Download count incremented" });
  } catch (error: any) {
    console.error("Error incrementing download count:", error);
    res.status(500).json({ message: "Failed to increment download count" });
  }
});

export default router;
