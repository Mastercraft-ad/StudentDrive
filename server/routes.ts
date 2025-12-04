import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import multer from "multer";
import path from "path";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { db } from "./db";
import { setupAuth, isAuthenticated, requireEmailVerified, requireOnboarding, generateVerificationToken, hashPassword } from "./auth";
import { sendVerificationEmail } from "./email";
import { getUserStatistics, getUserActivityLogs, logUserActivity, updateUserStatistics } from "./activity-logger";
import schoolRoutes from "./school-routes";
import superAdminRoutes from "./super-admin-routes";
import { authLimiter, registrationLimiter, passwordResetLimiter, uploadLimiter } from "./rate-limiter";
import {
  insertCourseSchema,
  insertMaterialSchema,
  insertQuizSchema,
  insertQuizQuestionSchema,
  insertBookmarkSchema,
  insertInstitutionSchema,
  insertInstitutionReviewSchema,
  insertProgrammeSchema,
  insertMaterialReviewSchema,
  insertMaterialRatingSchema,
  insertMaterialReportSchema,
  type Programme,
  users,
} from "@shared/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const baseOnboardingSchema = z.object({
  role: z.enum(["student", "institution", "admin"]),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  institutionId: z.string().optional(),
  bio: z.string().optional(),
});

const studentOnboardingSchema = baseOnboardingSchema.extend({
  role: z.literal("student"),
  institutionId: z.string().min(1, "Please select your institution").transform(val => val === "no-institution" ? null : val),
  currentLevel: z.number().min(100).max(900),
  yearOfAdmission: z.number().min(2011).max(new Date().getFullYear()),
  expectedGraduationYear: z.number().min(new Date().getFullYear()).max(new Date().getFullYear() + 8),
  modeOfStudy: z.enum(["Full-time", "Part-time"]),
  programmeId: z.string().min(1, "Programme is required"),
  studyGoals: z.array(z.string()).min(2, "Please select at least 2 study goals"),
  learningStyle: z.array(z.string()).min(2, "Please select at least 2 learning styles"),
  studySchedule: z.array(z.string()).min(1, "Please select at least 1 study schedule"),
});

const institutionOnboardingSchema = baseOnboardingSchema.extend({
  role: z.literal("institution"),
  institutionName: z.string().min(2, "Institution name is required"),
  institutionType: z.string().min(1, "Institution type is required"),
  numberOfStudents: z.number().min(1),
  departments: z.array(z.string()).min(1, "Please select at least 1 department"),
  institutionAddress: z.string().min(5, "Address is required"),
  institutionPhone: z.string().min(10, "Valid phone number is required"),
  bio: z.string().min(20, "Description must be at least 20 characters"),
});

// Configure multer for file uploads
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/materials/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|ppt|pptx|txt|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, JPEG, and PNG files are allowed.'));
    }
  }
});

// Helper function to check and award badges based on current progress
async function checkAndAwardBadges(userId: string): Promise<void> {
  try {
    const gamification = await storage.getOrCreateUserGamification(userId);
    const allBadges = await storage.getBadges();
    const earnedBadgeIds = (await storage.getUserBadges(userId)).map(ub => ub.badgeId);
    
    for (const badge of allBadges) {
      if (earnedBadgeIds.includes(badge.id)) continue;
      
      const condition = badge.unlockCondition as any;
      let shouldAward = false;
      
      switch (condition.type) {
        case 'quiz_count':
          shouldAward = gamification.quizzesCompleted >= condition.value;
          break;
        case 'perfect_score':
          shouldAward = gamification.perfectScores >= condition.value;
          break;
        case 'streak_days':
          shouldAward = gamification.currentStreak >= condition.value;
          break;
        case 'materials_viewed':
          shouldAward = gamification.materialsViewed >= condition.value;
          break;
        case 'reviews_completed':
          shouldAward = gamification.reviewsCompleted >= condition.value;
          break;
        case 'level':
          shouldAward = gamification.level >= condition.value;
          break;
        case 'total_xp':
          shouldAward = gamification.totalXp >= condition.value;
          break;
      }
      
      if (shouldAward) {
        await storage.awardBadge(userId, badge.id);
        
        // Award XP for earning badge
        if (badge.xpReward > 0) {
          await storage.addXp(userId, badge.xpReward, 'badge_earned', badge.id, `Earned badge: ${badge.name}`);
        }
      }
    }
  } catch (error) {
    console.error("Error checking badges:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);
  
  // Register school management system routes
  app.use(schoolRoutes);
  app.use(superAdminRoutes);

  const getBaseUrl = (req: Request) => {
    if (process.env.REPLIT_DOMAINS) {
      const domain = process.env.REPLIT_DOMAINS.split(',')[0];
      return `https://${domain}`;
    }
    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}`;
  };

  app.post("/api/auth/register", registrationLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password } = registerSchema.parse(req.body);

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hashPassword(password);

      const user = await storage.createUser({
        email,
        password: hashedPassword,
        verificationToken: null,
        verificationTokenExpiry: null,
        emailVerified: true,
        onboardingCompleted: false,
      });

      res.json({ 
        message: "Registration successful! You can now log in.",
        userId: user.id,
        success: true
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.get("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Invalid verification token" });
      }

      const users = await storage.getAllUsers();
      const user = users.find(u => u.verificationToken === token);

      if (!user) {
        return res.status(400).json({ message: "Invalid verification token" });
      }

      if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
        return res.status(400).json({ message: "Verification token expired" });
      }

      await storage.updateUser(user.id, {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      });

      res.json({ message: "Email verified successfully. You can now log in." });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Email verification failed" });
    }
  });

  app.post("/api/auth/login", authLimiter, (req: Request, res: Response, next) => {
    try {
      loginSchema.parse(req.body);
    } catch (error: any) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid email or password" });
      }

      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        req.session.save((err) => {
          if (err) {
            return res.status(500).json({ message: "Login failed" });
          }
          res.json({ message: "Login successful", user });
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/auth/onboarding", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { role } = req.body;
      
      let data;
      if (role === "student") {
        data = studentOnboardingSchema.parse(req.body);
        
        // Verify that the selected programme belongs to the selected institution
        if (data.programmeId && data.institutionId && data.institutionId !== "no-institution") {
          const programme = await storage.getProgramme(data.programmeId);
          if (!programme) {
            return res.status(400).json({ message: "Invalid programme selected" });
          }
          if (programme.institutionId !== data.institutionId) {
            return res.status(400).json({ message: "Selected programme does not belong to the selected institution" });
          }
        }
        
        await storage.updateUser(req.user.id, {
          ...data,
          onboardingCompleted: true,
        });
      } else if (role === "institution") {
        data = institutionOnboardingSchema.parse(req.body);
        
        // Create institution in institutions table and link user
        const profileSlug = data.institutionName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        
        const institutionData = {
          name: data.institutionName,
          profileSlug,
          description: data.bio,
          website: null,
          logoUrl: null,
        };
        
        const { institution, user: updatedUser } = await storage.createInstitutionWithOwner(
          institutionData,
          req.user.id,
          data
        );
        
        return res.json({ 
          message: "Onboarding completed", 
          user: updatedUser,
          institution 
        });
      } else {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updatedUser = await storage.getUser(req.user.id);
      res.json({ message: "Onboarding completed", user: updatedUser });
    } catch (error: any) {
      console.error("Onboarding error:", error);
      res.status(400).json({ message: error.message || "Onboarding failed" });
    }
  });

  app.patch("/api/auth/profile", isAuthenticated, async (req: any, res: Response) => {
    try {
      const updateSchema = z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
      });

      const data = updateSchema.parse(req.body);
      await storage.updateUser(req.user.id, data);

      const updatedUser = await storage.getUser(req.user.id);
      res.json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error: any) {
      console.error("Profile update error:", error);
      res.status(400).json({ message: error.message || "Failed to update profile" });
    }
  });

  app.post("/api/auth/change-password", isAuthenticated, passwordResetLimiter, async (req: any, res: Response) => {
    try {
      const changePasswordSchema = z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(8, "New password must be at least 8 characters"),
      });

      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const hashedNewPassword = await hashPassword(newPassword);
      await storage.updateUser(req.user.id, { password: hashedNewPassword });

      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      console.error("Password change error:", error);
      res.status(400).json({ message: error.message || "Failed to change password" });
    }
  });

  app.get("/api/materials", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const { courseId, level, semester, topic, materialType, uploaderRole, search, sortBy, page, limit } = req.query;
      let materials = await storage.getMaterialsWithStats();
      
      // Filter to only show approved materials for non-admin users
      // Admins can see all materials for moderation purposes
      if (req.user.role !== 'admin') {
        materials = materials.filter(m => m.moderationStatus === 'approved');
      }
      
      // Apply filters
      if (courseId) {
        materials = materials.filter(m => m.courseId === courseId);
      }
      if (level) {
        materials = materials.filter(m => m.level === parseInt(level as string));
      }
      if (semester) {
        materials = materials.filter(m => m.semester === parseInt(semester as string));
      }
      if (topic) {
        materials = materials.filter(m => m.topic?.toLowerCase().includes((topic as string).toLowerCase()));
      }
      if (materialType) {
        materials = materials.filter(m => m.materialType === materialType);
      }
      if (search) {
        const searchLower = (search as string).toLowerCase();
        materials = materials.filter(m => 
          m.title.toLowerCase().includes(searchLower) ||
          m.description?.toLowerCase().includes(searchLower)
        );
      }
      
      // Filter by uploader role if specified
      if (uploaderRole) {
        const userIds = materials.map(m => m.uploadedById).filter(Boolean) as string[];
        const uniqueUserIds = Array.from(new Set(userIds));
        const uploaders = await Promise.all(
          uniqueUserIds.map(id => storage.getUser(id))
        );
        const uploaderMap = new Map(uploaders.filter(Boolean).map(u => [u!.id, u!.role]));
        materials = materials.filter(m => m.uploadedById && uploaderMap.get(m.uploadedById) === uploaderRole);
      }
      
      // Apply sorting
      if (sortBy) {
        switch (sortBy) {
          case 'newest':
            materials.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
          case 'oldest':
            materials.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            break;
          case 'highest_rated':
            materials.sort((a, b) => (b.stats?.averageRating || 0) - (a.stats?.averageRating || 0));
            break;
          case 'most_reviewed':
            materials.sort((a, b) => (b.stats?.reviewCount || 0) - (a.stats?.reviewCount || 0));
            break;
          case 'alphabetical':
            materials.sort((a, b) => a.title.localeCompare(b.title));
            break;
          default:
            // Default is newest (already sorted by createdAt desc)
            break;
        }
      }
      
      // Apply pagination
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const pageLimit = Math.max(1, Math.min(100, parseInt(limit as string) || 25)); // Clamp between 1 and 100
      const startIndex = (pageNum - 1) * pageLimit;
      const endIndex = startIndex + pageLimit;
      const total = materials.length;
      const paginatedMaterials = materials.slice(startIndex, endIndex);
      
      // Get all distinct topics from all materials (before pagination)
      const allTopics = Array.from(new Set(
        materials
          .map(m => m.topic)
          .filter((topic): topic is string => Boolean(topic))
      ));

      res.json({
        materials: paginatedMaterials,
        pagination: {
          page: pageNum,
          limit: pageLimit,
          total,
          totalPages: Math.ceil(total / pageLimit),
        },
        topics: allTopics,
      });
    } catch (error) {
      console.error("Error fetching materials:", error);
      res.status(500).json({ message: "Failed to fetch materials" });
    }
  });

  app.get("/api/materials/recent", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      let materials = await storage.getMaterials();
      
      // Filter to only show approved materials for non-admin users
      if (req.user.role !== 'admin') {
        materials = materials.filter(m => m.moderationStatus === 'approved');
      }
      
      res.json(materials.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recent materials:", error);
      res.status(500).json({ message: "Failed to fetch recent materials" });
    }
  });

  app.get("/api/materials/my-library", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const materials = await storage.getMaterialsByUser(req.user.id);
      res.json(materials);
    } catch (error) {
      console.error("Error fetching user materials:", error);
      res.status(500).json({ message: "Failed to fetch your materials" });
    }
  });

  app.get("/api/materials/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      let material = await storage.getMaterial(req.params.id);
      
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      // Filter to only show approved materials for non-admin users
      if (req.user.role !== 'admin' && material.moderationStatus !== 'approved') {
        return res.status(404).json({ message: "Material not found" });
      }
      
      // Increment view count and get updated material
      await storage.updateMaterial(req.params.id, {
        viewCount: (material.viewCount || 0) + 1
      });
      
      // Fetch the updated material to get the correct view count
      material = await storage.getMaterial(req.params.id) || material;
      
      // Fetch uploader info
      let uploadedBy = null;
      if (material.uploadedById) {
        const uploader = await storage.getUser(material.uploadedById);
        if (uploader) {
          uploadedBy = {
            id: uploader.id,
            firstName: uploader.firstName,
            lastName: uploader.lastName,
            role: uploader.role,
          };
        }
      }
      
      // Fetch course info
      let course = null;
      if (material.courseId) {
        const courseData = await storage.getCourse(material.courseId);
        if (courseData) {
          course = {
            title: courseData.title,
          };
        }
      }
      
      res.json({
        ...material,
        uploadedBy,
        course,
      });
    } catch (error) {
      console.error("Error fetching material:", error);
      res.status(500).json({ message: "Failed to fetch material" });
    }
  });

  app.post("/api/upload", isAuthenticated, requireOnboarding, uploadLimiter, upload.single('file'), async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const fileUrl = `/uploads/materials/${req.file.filename}`;
      const fileSize = req.file.size;
      const originalFilename = req.file.originalname;
      
      res.json({
        fileUrl,
        fileSize,
        originalFilename,
        fileType: path.extname(req.file.originalname).substring(1).toLowerCase()
      });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      res.status(400).json({ message: error.message || "Failed to upload file" });
    }
  });

  app.post("/api/materials", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const data = insertMaterialSchema.parse({ 
        ...req.body, 
        uploadedById: req.user.id,
        institutionId: req.user.institutionId,
        programmeId: req.user.programmeId
      });
      const material = await storage.createMaterial(data);
      res.json(material);
    } catch (error) {
      console.error("Error creating material:", error);
      res.status(400).json({ message: "Failed to create material" });
    }
  });

  app.put("/api/materials/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const material = await storage.getMaterial(req.params.id);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      // Check ownership
      if (material.uploadedById !== req.user.id) {
        return res.status(403).json({ message: "You can only edit your own materials" });
      }
      
      const data = insertMaterialSchema.partial().parse(req.body);
      const updatedMaterial = await storage.updateMaterial(req.params.id, data);
      res.json(updatedMaterial);
    } catch (error) {
      console.error("Error updating material:", error);
      res.status(400).json({ message: "Failed to update material" });
    }
  });

  app.delete("/api/materials/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const material = await storage.getMaterial(req.params.id);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      // Check ownership
      if (material.uploadedById !== req.user.id) {
        return res.status(403).json({ message: "You can only delete your own materials" });
      }
      
      await storage.deleteMaterial(req.params.id);
      res.json({ message: "Material deleted successfully" });
    } catch (error) {
      console.error("Error deleting material:", error);
      res.status(500).json({ message: "Failed to delete material" });
    }
  });

  app.post("/api/materials/:id/download", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const material = await storage.getMaterial(req.params.id);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      // Increment download count
      await storage.updateMaterial(req.params.id, {
        downloadCount: (material.downloadCount || 0) + 1
      });
      
      res.json({ message: "Download tracked successfully" });
    } catch (error) {
      console.error("Error tracking download:", error);
      res.status(500).json({ message: "Failed to track download" });
    }
  });

  app.get("/api/courses", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.post("/api/courses", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const data = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(data);
      res.json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(400).json({ message: "Failed to create course" });
    }
  });

  app.post("/api/courses/bulk", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const { courses: coursesData } = req.body;

      if (!Array.isArray(coursesData) || coursesData.length === 0) {
        return res.status(400).json({ message: "Invalid data format. Expected an array of courses." });
      }

      // Validate each course item
      const validatedCourses = coursesData.map((course, index) => {
        try {
          return insertCourseSchema.parse(course);
        } catch (error) {
          throw new Error(`Invalid data at row ${index + 1}: ${error instanceof Error ? error.message : 'Validation failed'}`);
        }
      });

      const result = await storage.bulkCreateCourses(validatedCourses);

      res.json({
        success: true,
        added: result.added,
        skipped: result.skipped,
        message: `${result.added} course${result.added !== 1 ? 's' : ''} added successfully${result.skipped > 0 ? `, ${result.skipped} duplicate${result.skipped !== 1 ? 's' : ''} skipped` : ''}.`,
      });
    } catch (error: any) {
      console.error("Error bulk creating courses:", error);
      res.status(400).json({ message: error.message || "Failed to bulk create courses" });
    }
  });

  app.get("/api/quizzes", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const quizzes = await storage.getQuizzes();
      const quizzesWithCount = await Promise.all(
        quizzes.map(async (quiz) => {
          const questions = await storage.getQuizQuestions(quiz.id);
          return { ...quiz, questionsCount: questions.length };
        })
      );
      res.json(quizzesWithCount);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.get("/api/quizzes/upcoming", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const quizzes = await storage.getQuizzes();
      const quizzesWithCount = await Promise.all(
        quizzes.slice(0, 5).map(async (quiz) => {
          const questions = await storage.getQuizQuestions(quiz.id);
          return { ...quiz, questionsCount: questions.length };
        })
      );
      res.json(quizzesWithCount);
    } catch (error) {
      console.error("Error fetching upcoming quizzes:", error);
      res.status(500).json({ message: "Failed to fetch upcoming quizzes" });
    }
  });

  app.get("/api/quizzes/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  app.get("/api/quizzes/:id/questions", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const questions = await storage.getQuizQuestions(req.params.id);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({ message: "Failed to fetch quiz questions" });
    }
  });

  app.post("/api/quizzes", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const { questions, ...quizData } = req.body;
      
      const data = insertQuizSchema.parse({ ...quizData, createdById: req.user.id });
      const quiz = await storage.createQuiz(data);

      if (questions && Array.isArray(questions)) {
        for (let i = 0; i < questions.length; i++) {
          const questionData = insertQuizQuestionSchema.parse({
            ...questions[i],
            quizId: quiz.id,
            order: i + 1,
          });
          await storage.createQuizQuestion(questionData);
        }
      }

      res.json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(400).json({ message: "Failed to create quiz" });
    }
  });

  app.post("/api/quizzes/:id/submit", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const quizId = req.params.id;
      const { answers } = req.body;

      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const questions = await storage.getQuizQuestions(quizId);
      
      let correctCount = 0;
      questions.forEach((question) => {
        const userAnswer = answers[question.id];
        if (userAnswer && userAnswer.toLowerCase() === question.correctAnswer.toLowerCase()) {
          correctCount++;
        }
      });

      const totalQuestions = questions.length;
      const scorePercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
      const passed = scorePercentage >= (quiz.passingScore || 70);

      const attempt = await storage.createQuizAttempt({
        quizId,
        studentId: req.user.id,
        answers,
        score: correctCount,
        totalQuestions,
        passed,
      });

      // GAMIFICATION: Award XP and update stats
      try {
        // Base XP for completing a quiz
        let xpEarned = 20;
        
        // Bonus XP based on score
        if (scorePercentage >= 90) xpEarned += 30;
        else if (scorePercentage >= 70) xpEarned += 15;
        else if (scorePercentage >= 50) xpEarned += 5;
        
        // Award XP
        await storage.addXp(req.user.id, xpEarned, 'quiz_complete', quizId, `Completed quiz: ${quiz.title} (${Math.round(scorePercentage)}%)`);
        
        // Update streak
        const streakResult = await storage.updateStreak(req.user.id);
        
        // Update daily study log
        await storage.updateDailyStudyLog(req.user.id, { quizzesTaken: 1, xpEarned });
        
        // Update gamification stats
        const gamification = await storage.getOrCreateUserGamification(req.user.id);
        const updateData: any = {
          quizzesCompleted: gamification.quizzesCompleted + 1,
        };
        
        // Track perfect scores
        if (scorePercentage === 100) {
          updateData.perfectScores = gamification.perfectScores + 1;
          
          // Bonus XP for perfect score
          await storage.addXp(req.user.id, 25, 'perfect_score', quizId, `Perfect score on: ${quiz.title}`);
        }
        
        await storage.updateUserGamification(req.user.id, updateData);
        
        // Generate flashcards from wrong answers for spaced repetition
        const wrongQuestions = questions.filter(q => {
          const userAnswer = answers[q.id];
          return !userAnswer || userAnswer.toLowerCase() !== q.correctAnswer.toLowerCase();
        });
        
        for (const question of wrongQuestions) {
          await storage.createSpacedRepetitionCard({
            userId: req.user.id,
            question: question.question,
            answer: question.correctAnswer,
            sourceType: 'quiz',
            sourceId: question.id,
            courseId: quiz.courseId || null,
            topic: quiz.title,
            nextReviewDate: new Date(),
          });
        }
        
        // Check and award any earned badges
        await checkAndAwardBadges(req.user.id);
        
      } catch (gamificationError) {
        console.error("Error updating gamification:", gamificationError);
        // Don't fail the quiz submission if gamification fails
      }

      res.json({
        ...attempt,
        scorePercentage,
      });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      res.status(500).json({ message: "Failed to submit quiz" });
    }
  });

  app.get("/api/quiz-attempts", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const attempts = await storage.getQuizAttempts(req.user.id);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
      res.status(500).json({ message: "Failed to fetch quiz attempts" });
    }
  });

  app.get("/api/quiz-attempts/recent", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const attempts = await storage.getQuizAttempts(req.user.id);
      res.json(attempts.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recent quiz attempts:", error);
      res.status(500).json({ message: "Failed to fetch recent quiz attempts" });
    }
  });

  app.get("/api/bookmarks", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const bookmarks = await storage.getBookmarks(req.user.id);
      res.json(bookmarks);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  app.post("/api/bookmarks", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const data = insertBookmarkSchema.parse({ ...req.body, userId: req.user.id });
      const bookmark = await storage.createBookmark(data);
      res.json(bookmark);
    } catch (error) {
      console.error("Error creating bookmark:", error);
      res.status(400).json({ message: "Failed to create bookmark" });
    }
  });

  app.delete("/api/bookmarks/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      await storage.deleteBookmark(req.params.id);
      res.json({ message: "Bookmark deleted" });
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      res.status(500).json({ message: "Failed to delete bookmark" });
    }
  });

  app.delete("/api/bookmarks/by-material/:materialId", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      await storage.deleteBookmarkByMaterial(req.user.id, req.params.materialId);
      res.json({ message: "Bookmark removed" });
    } catch (error) {
      console.error("Error removing bookmark:", error);
      res.status(500).json({ message: "Failed to remove bookmark" });
    }
  });

  app.get("/api/bookmarks/check/:materialId", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const bookmark = await storage.getBookmarkByMaterial(req.user.id, req.params.materialId);
      res.json({ bookmarked: !!bookmark, bookmark });
    } catch (error) {
      console.error("Error checking bookmark:", error);
      res.status(500).json({ message: "Failed to check bookmark status" });
    }
  });

  // Material Reviews API
  app.get("/api/materials/:materialId/reviews", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const reviews = await storage.getReviewsByMaterial(req.params.materialId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/materials/:materialId/reviews", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const existingReview = await storage.getReviewByUserAndMaterial(req.user.id, req.params.materialId);
      if (existingReview) {
        return res.status(400).json({ message: "You have already reviewed this material" });
      }
      const data = insertMaterialReviewSchema.parse({
        materialId: req.params.materialId,
        userId: req.user.id,
        reviewText: req.body.reviewText,
      });
      const review = await storage.createReview(data);
      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(400).json({ message: "Failed to create review" });
    }
  });

  app.put("/api/reviews/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const review = await storage.updateReview(req.params.id, req.body.reviewText);
      res.json(review);
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(400).json({ message: "Failed to update review" });
    }
  });

  app.delete("/api/reviews/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      await storage.deleteReview(req.params.id);
      res.json({ message: "Review deleted" });
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ message: "Failed to delete review" });
    }
  });

  // Material Ratings API
  app.get("/api/materials/:materialId/ratings", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const ratings = await storage.getRatingsByMaterial(req.params.materialId);
      const average = await storage.getAverageRating(req.params.materialId);
      const userRating = await storage.getRatingByUserAndMaterial(req.user.id, req.params.materialId);
      res.json({ ratings, average, userRating, count: ratings.length });
    } catch (error) {
      console.error("Error fetching ratings:", error);
      res.status(500).json({ message: "Failed to fetch ratings" });
    }
  });

  app.post("/api/materials/:materialId/ratings", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const existingRating = await storage.getRatingByUserAndMaterial(req.user.id, req.params.materialId);
      
      if (existingRating) {
        const updated = await storage.updateRating(existingRating.id, req.body.rating);
        return res.json(updated);
      }

      const data = insertMaterialRatingSchema.parse({
        materialId: req.params.materialId,
        userId: req.user.id,
        rating: req.body.rating,
      });
      const rating = await storage.createRating(data);
      res.json(rating);
    } catch (error) {
      console.error("Error creating/updating rating:", error);
      res.status(400).json({ message: "Failed to create/update rating" });
    }
  });

  app.delete("/api/ratings/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      await storage.deleteRating(req.params.id);
      res.json({ message: "Rating deleted" });
    } catch (error) {
      console.error("Error deleting rating:", error);
      res.status(500).json({ message: "Failed to delete rating" });
    }
  });

  // Material Reports API
  app.post("/api/materials/:materialId/reports", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const data = insertMaterialReportSchema.parse({
        materialId: req.params.materialId,
        userId: req.user.id,
        reason: req.body.reason,
        description: req.body.description,
        status: "pending",
      });
      const report = await storage.createReport(data);
      res.json({ message: "Report submitted successfully", report });
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(400).json({ message: "Failed to submit report" });
    }
  });

  app.get("/api/admin/reports", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const status = req.query.status as string | undefined;
      const reports = await storage.getAllReports(status);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.put("/api/admin/reports/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const report = await storage.updateReportStatus(
        req.params.id,
        req.body.status,
        req.user.id,
        req.body.adminNotes
      );
      res.json(report);
    } catch (error) {
      console.error("Error updating report:", error);
      res.status(400).json({ message: "Failed to update report" });
    }
  });

  app.get("/api/student/stats", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const attempts = await storage.getQuizAttempts(req.user.id);
      const bookmarks = await storage.getBookmarks(req.user.id);
      const materials = await storage.getMaterials();
      
      const quizzesCompleted = attempts.length;
      const averageScore = attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0) / attempts.length)
        : 0;
      const achievementsCount = attempts.filter(a => a.passed).length;
      const completionRate = attempts.length > 0
        ? Math.round((attempts.filter(a => a.passed).length / attempts.length) * 100)
        : 0;

      const uniqueDates = new Set(attempts.map(a => 
        new Date(a.completedAt!).toDateString()
      ));
      const studyStreak = uniqueDates.size;

      res.json({
        materialsCount: bookmarks.length,
        quizzesCompleted,
        averageScore,
        achievementsCount,
        completionRate,
        studyStreak,
      });
    } catch (error) {
      console.error("Error fetching student stats:", error);
      res.status(500).json({ message: "Failed to fetch student stats" });
    }
  });

  app.get("/api/student/achievements", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const attempts = await storage.getQuizAttempts(req.user.id);
      const achievements = [];

      if (attempts.length >= 1) {
        achievements.push({ name: "First Steps", description: "Complete your first quiz", icon: "trophy" });
      }
      if (attempts.length >= 10) {
        achievements.push({ name: "Quiz Master", description: "Complete 10 quizzes", icon: "star" });
      }
      if (attempts.filter(a => a.passed).length >= 5) {
        achievements.push({ name: "High Achiever", description: "Pass 5 quizzes", icon: "award" });
      }

      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.get("/api/student/performance", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const attempts = await storage.getQuizAttempts(req.user.id);
      
      // Basic stats
      const averageScore = attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0) / attempts.length)
        : 0;
      const completionRate = attempts.length > 0
        ? Math.round((attempts.filter(a => a.passed).length / attempts.length) * 100)
        : 0;

      const uniqueDates = new Set(attempts.map(a => 
        new Date(a.completedAt!).toDateString()
      ));

      // Weekly performance trends (last 8 weeks)
      const weeklyData = [];
      const now = new Date();
      
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        const weekAttempts = attempts.filter(a => {
          const attemptDate = new Date(a.completedAt!);
          return attemptDate >= weekStart && attemptDate <= weekEnd;
        });
        
        const weekScore = weekAttempts.length > 0
          ? Math.round(weekAttempts.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0) / weekAttempts.length)
          : null;
        
        if (weekScore !== null || i >= 4) { // Show last 4 weeks even if no data
          weeklyData.push({
            name: `Week ${8 - i}`,
            score: weekScore || 0,
            attempts: weekAttempts.length,
          });
        }
      }

      // Course-based performance
      const coursePerformance: Record<string, { scores: number[], courseTitle: string }> = {};
      
      for (const attempt of attempts) {
        const quiz = await storage.getQuiz(attempt.quizId!);
        if (quiz && quiz.courseId) {
          const course = await storage.getCourse(quiz.courseId);
          if (course) {
            if (!coursePerformance[quiz.courseId]) {
              coursePerformance[quiz.courseId] = {
                scores: [],
                courseTitle: course.title,
              };
            }
            const percentage = (attempt.score / attempt.totalQuestions) * 100;
            coursePerformance[quiz.courseId].scores.push(percentage);
          }
        }
      }

      const courseData = Object.entries(coursePerformance).map(([courseId, data]) => ({
        course: data.courseTitle,
        score: Math.round(data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length),
        attempts: data.scores.length,
      })).sort((a, b) => b.score - a.score);

      // Identify strengths (>80%) and weaknesses (<75%)
      const strengths = courseData.filter(c => c.score >= 80).slice(0, 3);
      const weaknesses = courseData.filter(c => c.score < 75).slice(0, 3);

      res.json({
        averageScore,
        completionRate,
        studyStreak: uniqueDates.size,
        timeSpent: Math.round((attempts.length * 15) / 60), // Convert minutes to hours
        weeklyTrend: weeklyData.length > 0 ? weeklyData : [
          { name: "Week 1", score: 0, attempts: 0 },
          { name: "Week 2", score: 0, attempts: 0 },
          { name: "Week 3", score: 0, attempts: 0 },
          { name: "Week 4", score: 0, attempts: 0 },
        ],
        coursePerformance: courseData,
        strengths,
        weaknesses,
      });
    } catch (error) {
      console.error("Error fetching performance:", error);
      res.status(500).json({ message: "Failed to fetch performance" });
    }
  });

  app.get("/api/institution/stats", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const allUsers = await storage.getAllUsers();
      const students = allUsers.filter(u => u.role === "student" && u.institutionId === req.user.institutionId);
      const courses = await storage.getCourses();
      const institutionCourses = courses.filter(c => c.institutionId === req.user.institutionId);

      let totalScore = 0;
      let totalAttempts = 0;

      for (const student of students) {
        const attempts = await storage.getQuizAttempts(student.id);
        totalAttempts += attempts.length;
        totalScore += attempts.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0);
      }

      const avgPerformance = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;

      res.json({
        studentsCount: students.length,
        coursesCount: institutionCourses.length,
        avgPerformance,
      });
    } catch (error) {
      console.error("Error fetching institution stats:", error);
      res.status(500).json({ message: "Failed to fetch institution stats" });
    }
  });

  app.get("/api/admin/stats", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const allUsers = await storage.getAllUsers();
      const institutions = await storage.getInstitutions();
      const materials = await storage.getMaterials();
      const quizzes = await storage.getQuizzes();

      const activeUsers = allUsers.filter(u => u.onboardingCompleted).length;
      const totalUsers = allUsers.length;
      const activityRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

      res.json({
        totalUsers,
        institutionsCount: institutions.length,
        contentCount: materials.length + quizzes.length,
        activityRate,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/admin/users/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      
      // Prevent admin from modifying their own account
      if (id === req.user.id) {
        return res.status(400).json({ message: "You cannot modify your own account" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updateSchema = z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        email: z.string().email().optional(),
        role: z.enum(['student', 'institution', 'admin']).optional(),
        emailVerified: z.boolean().optional(),
        onboardingCompleted: z.boolean().optional(),
      });

      const data = updateSchema.parse(req.body);

      // If email is being changed, check if it's already in use
      if (data.email && data.email !== user.email) {
        const existingUser = await storage.getUserByEmail(data.email);
        if (existingUser) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }

      const updatedUser = await storage.updateUser(id, data);
      res.json({ message: "User updated successfully", user: updatedUser });
    } catch (error: any) {
      console.error("Error updating user:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;

      // Prevent admin from deleting their own account
      if (id === req.user.id) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Use a raw SQL delete as storage doesn't have deleteUser function
      await db.delete(users).where(eq(users.id, id));
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.post("/api/admin/users/:id/reset-password", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(id, { password: hashedPassword });

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.get("/api/admin/users/:id/statistics", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const statistics = await getUserStatistics(id);
      
      res.json(statistics || {
        userId: id,
        loginCount: 0,
        lastLoginAt: null,
        materialsUploaded: 0,
        materialsViewed: 0,
        materialsDownloaded: 0,
        quizzesTaken: 0,
        quizzesCreated: 0,
        bookmarksCreated: 0,
        averageQuizScore: null,
        totalTimeSpent: 0,
      });
    } catch (error) {
      console.error("Error getting user statistics:", error);
      res.status(500).json({ message: "Failed to get user statistics" });
    }
  });

  app.get("/api/admin/users/:id/activity", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const activityLogs = await getUserActivityLogs(id, limit, offset);
      
      res.json(activityLogs);
    } catch (error) {
      console.error("Error getting user activity logs:", error);
      res.status(500).json({ message: "Failed to get user activity logs" });
    }
  });

  app.post("/api/admin/users/bulk-delete", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { userIds } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "Invalid data. Expected an array of user IDs." });
      }

      if (userIds.includes(req.user.id)) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }

      let deletedCount = 0;
      const errors: string[] = [];

      for (const userId of userIds) {
        try {
          const user = await storage.getUser(userId);
          if (user) {
            await db.delete(users).where(eq(users.id, userId));
            deletedCount++;
          }
        } catch (error) {
          errors.push(`Failed to delete user ${userId}`);
        }
      }

      res.json({
        success: true,
        deletedCount,
        errors: errors.length > 0 ? errors : undefined,
        message: `${deletedCount} user${deletedCount !== 1 ? 's' : ''} deleted successfully${errors.length > 0 ? `, ${errors.length} error${errors.length !== 1 ? 's' : ''}` : ''}.`,
      });
    } catch (error) {
      console.error("Error bulk deleting users:", error);
      res.status(500).json({ message: "Failed to bulk delete users" });
    }
  });

  app.post("/api/admin/users/bulk-update", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { userIds, updates } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "Invalid data. Expected an array of user IDs." });
      }

      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ message: "Invalid updates data." });
      }

      const allowedUpdates = ['role', 'emailVerified', 'onboardingCompleted'];
      const updateData: any = {};
      
      for (const key of allowedUpdates) {
        if (key in updates) {
          updateData[key] = updates[key];
        }
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No valid updates provided. Allowed fields: role, emailVerified, onboardingCompleted" });
      }

      if (updateData.role === 'admin' && userIds.includes(req.user.id)) {
        return res.status(400).json({ message: "You cannot change your own role" });
      }

      let updatedCount = 0;
      const errors: string[] = [];

      for (const userId of userIds) {
        try {
          const user = await storage.getUser(userId);
          if (user) {
            await storage.updateUser(userId, updateData);
            updatedCount++;
          }
        } catch (error) {
          errors.push(`Failed to update user ${userId}`);
        }
      }

      res.json({
        success: true,
        updatedCount,
        errors: errors.length > 0 ? errors : undefined,
        message: `${updatedCount} user${updatedCount !== 1 ? 's' : ''} updated successfully${errors.length > 0 ? `, ${errors.length} error${errors.length !== 1 ? 's' : ''}` : ''}.`,
      });
    } catch (error) {
      console.error("Error bulk updating users:", error);
      res.status(500).json({ message: "Failed to bulk update users" });
    }
  });

  app.get("/api/admin/institutions", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      const institutions = await storage.getInstitutions();
      res.json(institutions);
    } catch (error) {
      console.error("Error fetching institutions:", error);
      res.status(500).json({ message: "Failed to fetch institutions" });
    }
  });

  app.post("/api/admin/institutions", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      const data = insertInstitutionSchema.parse(req.body);
      const institution = await storage.createInstitution(data);
      res.json(institution);
    } catch (error: any) {
      console.error("Error creating institution:", error);
      res.status(400).json({ message: error.message || "Failed to create institution" });
    }
  });

  app.post("/api/admin/institutions/bulk", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { institutions: institutionsData } = req.body;

      if (!Array.isArray(institutionsData) || institutionsData.length === 0) {
        return res.status(400).json({ message: "Invalid data format. Expected an array of institutions." });
      }

      const result = await storage.bulkCreateInstitutions(institutionsData);

      res.json({
        success: true,
        added: result.added,
        skipped: result.skipped,
        message: `${result.added} institution${result.added !== 1 ? 's' : ''} added successfully${result.skipped > 0 ? `, ${result.skipped} duplicate${result.skipped !== 1 ? 's' : ''} skipped` : ''}.`,
      });
    } catch (error: any) {
      console.error("Error bulk creating institutions:", error);
      res.status(400).json({ message: error.message || "Failed to bulk create institutions" });
    }
  });

  app.get("/api/institutions", isAuthenticated, async (req: any, res: Response) => {
    try {
      const institutions = await storage.getInstitutions();
      res.json(institutions);
    } catch (error) {
      console.error("Error fetching institutions:", error);
      res.status(500).json({ message: "Failed to fetch institutions" });
    }
  });

  app.get("/api/institutions/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const institution = await storage.getInstitution(id);
      if (!institution) {
        return res.status(404).json({ message: "Institution not found" });
      }
      res.json(institution);
    } catch (error) {
      console.error("Error fetching institution:", error);
      res.status(500).json({ message: "Failed to fetch institution" });
    }
  });

  app.get("/api/institutions/slug/:slug", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { slug } = req.params;
      const institution = await storage.getInstitutionBySlug(slug);
      if (!institution) {
        return res.status(404).json({ message: "Institution not found" });
      }
      res.json(institution);
    } catch (error) {
      console.error("Error fetching institution by slug:", error);
      res.status(500).json({ message: "Failed to fetch institution" });
    }
  });

  app.get("/api/institutions/:id/reviews", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const reviews = await storage.getInstitutionReviews(id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching institution reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/institutions/:id/reviews", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      
      const institution = await storage.getInstitution(id);
      if (!institution) {
        return res.status(404).json({ message: "Institution not found" });
      }

      const data = insertInstitutionReviewSchema.parse({
        ...req.body,
        institutionId: id,
        userId: req.user.id,
      });

      const review = await storage.createInstitutionReview(data);
      res.json(review);
    } catch (error: any) {
      console.error("Error creating institution review:", error);
      res.status(400).json({ message: error.message || "Failed to create review" });
    }
  });

  // Institution Management Routes (for institution role)
  app.get("/api/institution/management/stats", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!req.user.institutionId) {
        return res.status(400).json({ message: "Institution not linked to user" });
      }

      const students = await storage.getStudentsByInstitution(req.user.institutionId);
      const courses = await storage.getCoursesByInstitution(req.user.institutionId);
      const programmes = await storage.getProgrammesByInstitution(req.user.institutionId);

      res.json({
        studentsCount: students.length,
        coursesCount: courses.length,
        programmesCount: programmes.length,
        averagePerformance: 0,
      });
    } catch (error) {
      console.error("Error fetching institution stats:", error);
      res.status(500).json({ message: "Failed to fetch institution stats" });
    }
  });

  app.get("/api/institution/students", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!req.user.institutionId) {
        return res.status(400).json({ message: "Institution not linked to user" });
      }

      const students = await storage.getStudentsByInstitution(req.user.institutionId);
      
      // Sanitize to remove sensitive fields
      const sanitizedStudents = students.map(student => ({
        id: student.id,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        gender: student.gender,
        currentLevel: student.currentLevel,
        yearOfAdmission: student.yearOfAdmission,
        expectedGraduationYear: student.expectedGraduationYear,
        modeOfStudy: student.modeOfStudy,
        programmeId: student.programmeId,
        studyGoals: student.studyGoals,
        learningStyle: student.learningStyle,
        studySchedule: student.studySchedule,
        onboardingCompleted: student.onboardingCompleted,
        createdAt: student.createdAt,
      }));
      
      res.json(sanitizedStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/institution/programmes", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!req.user.institutionId) {
        return res.status(400).json({ message: "Institution not linked to user" });
      }

      const programmes = await storage.getProgrammesByInstitution(req.user.institutionId);
      res.json(programmes);
    } catch (error) {
      console.error("Error fetching programmes:", error);
      res.status(500).json({ message: "Failed to fetch programmes" });
    }
  });

  app.post("/api/institution/programmes", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!req.user.institutionId) {
        return res.status(400).json({ message: "Institution not linked to user" });
      }

      const data = insertProgrammeSchema.parse({
        ...req.body,
        institutionId: req.user.institutionId,
      });
      const programme = await storage.createProgramme(data);
      res.json(programme);
    } catch (error: any) {
      console.error("Error creating programme:", error);
      res.status(400).json({ message: error.message || "Failed to create programme" });
    }
  });

  // Public route to get programmes by institution (for onboarding)
  app.get("/api/programmes/:institutionId", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { institutionId } = req.params;
      const programmes = await storage.getProgrammesByInstitution(institutionId);
      res.json(programmes);
    } catch (error) {
      console.error("Error fetching programmes:", error);
      res.status(500).json({ message: "Failed to fetch programmes" });
    }
  });

  // Get single programme by ID
  app.get("/api/programmes/single/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const programme = await storage.getProgramme(id);
      if (!programme) {
        return res.status(404).json({ message: "Programme not found" });
      }
      res.json(programme);
    } catch (error) {
      console.error("Error fetching programme:", error);
      res.status(500).json({ message: "Failed to fetch programme" });
    }
  });

  // Programme Management Routes
  app.get("/api/admin/programmes/:institutionId", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      const { institutionId } = req.params;
      const programmes = await storage.getProgrammesByInstitution(institutionId);
      res.json(programmes);
    } catch (error) {
      console.error("Error fetching programmes:", error);
      res.status(500).json({ message: "Failed to fetch programmes" });
    }
  });

  app.post("/api/admin/programmes", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      const data = insertProgrammeSchema.parse(req.body);
      const programme = await storage.createProgramme(data);
      res.json(programme);
    } catch (error: any) {
      console.error("Error creating programme:", error);
      res.status(400).json({ message: error.message || "Failed to create programme" });
    }
  });

  app.post("/api/admin/programmes/bulk", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { institutionId, programmes: programmesData, format } = req.body;
      
      if (!institutionId) {
        return res.status(400).json({ message: "Institution ID is required" });
      }
      
      if (!programmesData || !Array.isArray(programmesData)) {
        return res.status(400).json({ message: "Programmes data must be an array" });
      }

      // Transform data and inject institutionId before validation
      const programmesWithInstitution = programmesData.map((prog: any) => {
        let transformedProg: any;
        
        // If CSV format, map CSV fields to schema fields
        if (format === 'csv') {
          transformedProg = {
            name: prog.name || prog.Name || prog.programme_name,
            code: prog.code || prog.Code || prog.programme_code,
            degree: prog.degree || prog.Degree,
            duration: prog.duration ? parseInt(prog.duration) : (prog.Duration ? parseInt(prog.Duration) : undefined),
            description: prog.description || prog.Description,
          };
        } else {
          // JSON format - use as-is but remove any existing institutionId
          const { institutionId: _, ...rest } = prog;
          transformedProg = rest;
        }
        
        // Always inject the institutionId from the top level to ensure it's correct
        return {
          ...transformedProg,
          institutionId: institutionId, // Explicitly set institutionId
        };
      });

      // Now validate all programmes
      const validatedProgrammes = programmesWithInstitution.map((prog: any) => {
        return insertProgrammeSchema.parse(prog);
      });

      const createdProgrammes = await storage.createProgrammes(validatedProgrammes);
      res.json({ 
        success: true, 
        count: createdProgrammes.length,
        programmes: createdProgrammes 
      });
    } catch (error: any) {
      console.error("Error creating programmes:", error);
      res.status(400).json({ message: error.message || "Failed to create programmes" });
    }
  });

  app.delete("/api/admin/programmes/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      const { id } = req.params;
      await storage.deleteProgramme(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting programme:", error);
      res.status(400).json({ message: error.message || "Failed to delete programme" });
    }
  });

  // Admin Content Moderation Endpoints
  app.get("/api/admin/content/materials", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { status } = req.query;
      const materials = await storage.getMaterialsForModeration(status as string);
      res.json(materials);
    } catch (error: any) {
      console.error("Error fetching materials for moderation:", error);
      res.status(500).json({ message: "Failed to fetch materials" });
    }
  });

  app.get("/api/admin/content/quizzes", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { status } = req.query;
      const quizzes = await storage.getQuizzesForModeration(status as string);
      res.json(quizzes);
    } catch (error: any) {
      console.error("Error fetching quizzes for moderation:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.patch("/api/admin/content/materials/:id/moderate", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const { status, reason } = req.body;

      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'approved' or 'rejected'" });
      }

      const material = await storage.moderateMaterial(id, status, req.user.id, reason);
      res.json({ message: "Material moderated successfully", material });
    } catch (error: any) {
      console.error("Error moderating material:", error);
      res.status(500).json({ message: "Failed to moderate material" });
    }
  });

  app.patch("/api/admin/content/quizzes/:id/moderate", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const { status, reason } = req.body;

      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'approved' or 'rejected'" });
      }

      const quiz = await storage.moderateQuiz(id, status, req.user.id, reason);
      res.json({ message: "Quiz moderated successfully", quiz });
    } catch (error: any) {
      console.error("Error moderating quiz:", error);
      res.status(500).json({ message: "Failed to moderate quiz" });
    }
  });

  app.delete("/api/admin/content/materials/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      await storage.deleteMaterial(id);
      res.json({ message: "Material deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting material:", error);
      res.status(500).json({ message: "Failed to delete material" });
    }
  });

  app.delete("/api/admin/content/quizzes/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      await storage.deleteQuiz(id);
      res.json({ message: "Quiz deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting quiz:", error);
      res.status(500).json({ message: "Failed to delete quiz" });
    }
  });

  // Notification routes
  app.get("/api/notifications", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const userNotifications = await storage.getUserNotifications(req.user.id, limit);
      res.json(userNotifications);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.user.id);
      res.json({ count });
    } catch (error: any) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const notification = await storage.markNotificationAsRead(id);
      res.json(notification);
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/mark-all-read", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      await storage.markAllNotificationsAsRead(req.user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error: any) {
      console.error("Error marking all as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteNotification(id);
      res.json({ message: "Notification deleted" });
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  app.delete("/api/notifications", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      await storage.deleteAllNotifications(req.user.id);
      res.json({ message: "All notifications deleted" });
    } catch (error: any) {
      console.error("Error deleting all notifications:", error);
      res.status(500).json({ message: "Failed to delete all notifications" });
    }
  });

  // ============================================
  // LEARNING ENHANCEMENT - GAMIFICATION
  // ============================================

  // Get user's gamification stats (XP, level, streak)
  app.get("/api/gamification/stats", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const stats = await storage.getOrCreateUserGamification(req.user.id);
      
      // Calculate XP needed for next level
      const xpPerLevel = 100;
      const levelMultiplier = 1.5;
      let xpForCurrentLevel = 0;
      let xpForNextLevel = xpPerLevel;
      
      for (let i = 1; i < stats.level; i++) {
        xpForCurrentLevel += Math.floor(xpPerLevel * Math.pow(levelMultiplier, i - 1));
      }
      xpForNextLevel = xpForCurrentLevel + Math.floor(xpPerLevel * Math.pow(levelMultiplier, stats.level - 1));
      
      const xpInCurrentLevel = stats.totalXp - xpForCurrentLevel;
      const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
      const progressPercentage = Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100);
      
      res.json({
        ...stats,
        xpInCurrentLevel,
        xpNeededForNextLevel,
        progressPercentage,
      });
    } catch (error: any) {
      console.error("Error fetching gamification stats:", error);
      res.status(500).json({ message: "Failed to fetch gamification stats" });
    }
  });

  // Get XP transaction history
  app.get("/api/gamification/xp-history", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const transactions = await storage.getXpTransactions(req.user.id, limit);
      res.json(transactions);
    } catch (error: any) {
      console.error("Error fetching XP history:", error);
      res.status(500).json({ message: "Failed to fetch XP history" });
    }
  });

  // Get leaderboard
  app.get("/api/gamification/leaderboard", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const type = (req.query.type as 'total' | 'weekly' | 'monthly') || 'weekly';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const leaderboard = await storage.getLeaderboard(limit, type);
      
      // Find current user's rank
      const allUsers = await storage.getLeaderboard(100, type);
      const userRank = allUsers.findIndex(u => u.userId === req.user.id) + 1;
      
      res.json({
        leaderboard: leaderboard.map((entry, index) => ({
          rank: index + 1,
          userId: entry.userId,
          firstName: entry.user.firstName,
          lastName: entry.user.lastName,
          profileImageUrl: entry.user.profileImageUrl,
          level: entry.level,
          xp: type === 'total' ? entry.totalXp : type === 'weekly' ? entry.weeklyXp : entry.monthlyXp,
          isCurrentUser: entry.userId === req.user.id,
        })),
        userRank: userRank > 0 ? userRank : null,
      });
    } catch (error: any) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Get study history (daily activity)
  app.get("/api/gamification/study-history", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const history = await storage.getStudyHistory(req.user.id, days);
      res.json(history);
    } catch (error: any) {
      console.error("Error fetching study history:", error);
      res.status(500).json({ message: "Failed to fetch study history" });
    }
  });

  // ============================================
  // LEARNING ENHANCEMENT - BADGES
  // ============================================

  // Get all available badges
  app.get("/api/badges", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const allBadges = await storage.getBadges();
      const userBadges = await storage.getUserBadges(req.user.id);
      const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));
      
      res.json(allBadges.map(badge => ({
        ...badge,
        earned: earnedBadgeIds.has(badge.id),
        earnedAt: userBadges.find(ub => ub.badgeId === badge.id)?.earnedAt,
      })));
    } catch (error: any) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  // Get user's earned badges
  app.get("/api/badges/earned", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const userBadges = await storage.getUserBadges(req.user.id);
      res.json(userBadges);
    } catch (error: any) {
      console.error("Error fetching earned badges:", error);
      res.status(500).json({ message: "Failed to fetch earned badges" });
    }
  });

  // Get unnotified badges (for showing toast notifications)
  app.get("/api/badges/unnotified", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const unnotified = await storage.getUnnotifiedBadges(req.user.id);
      res.json(unnotified);
    } catch (error: any) {
      console.error("Error fetching unnotified badges:", error);
      res.status(500).json({ message: "Failed to fetch unnotified badges" });
    }
  });

  // Mark badge as notified
  app.patch("/api/badges/:id/notified", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      await storage.markBadgeNotified(req.params.id);
      res.json({ message: "Badge marked as notified" });
    } catch (error: any) {
      console.error("Error marking badge notified:", error);
      res.status(500).json({ message: "Failed to mark badge as notified" });
    }
  });

  // ============================================
  // LEARNING ENHANCEMENT - SPACED REPETITION
  // ============================================

  // Get all cards for user
  app.get("/api/spaced-repetition/cards", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const cards = await storage.getSpacedRepetitionCards(req.user.id);
      res.json(cards);
    } catch (error: any) {
      console.error("Error fetching cards:", error);
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });

  // Get due cards for review
  app.get("/api/spaced-repetition/due", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const cards = await storage.getDueCards(req.user.id, limit);
      
      // Get total due count
      const allDue = await storage.getDueCards(req.user.id, 1000);
      
      res.json({
        cards,
        totalDue: allDue.length,
        reviewsCompleted: 0, // Will be updated from daily log
      });
    } catch (error: any) {
      console.error("Error fetching due cards:", error);
      res.status(500).json({ message: "Failed to fetch due cards" });
    }
  });

  // Create a new card manually
  app.post("/api/spaced-repetition/cards", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const { question, answer, courseId, topic } = req.body;
      
      if (!question || !answer) {
        return res.status(400).json({ message: "Question and answer are required" });
      }
      
      const card = await storage.createSpacedRepetitionCard({
        userId: req.user.id,
        question,
        answer,
        sourceType: 'manual',
        courseId: courseId || null,
        topic: topic || null,
        nextReviewDate: new Date(),
      });
      
      res.json(card);
    } catch (error: any) {
      console.error("Error creating card:", error);
      res.status(500).json({ message: "Failed to create card" });
    }
  });

  // Review a card (submit answer quality)
  app.post("/api/spaced-repetition/cards/:id/review", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const { quality } = req.body; // 0-5 scale (0=forgot, 3=hard, 4=good, 5=easy)
      
      if (quality === undefined || quality < 0 || quality > 5) {
        return res.status(400).json({ message: "Quality must be between 0 and 5" });
      }
      
      const card = await storage.reviewCard(req.params.id, quality);
      
      // Update daily study log and gamification
      await storage.updateDailyStudyLog(req.user.id, { reviewsCompleted: 1 });
      
      // Award XP for review
      const xpAmount = quality >= 3 ? 5 : 2;
      await storage.addXp(req.user.id, xpAmount, 'review_complete', card.id, 'Completed flashcard review');
      
      // Update streak
      await storage.updateStreak(req.user.id);
      
      // Update gamification stats
      const gamification = await storage.getOrCreateUserGamification(req.user.id);
      await storage.updateUserGamification(req.user.id, {
        reviewsCompleted: gamification.reviewsCompleted + 1,
      });
      
      // Check and award badges
      await checkAndAwardBadges(req.user.id);
      
      res.json(card);
    } catch (error: any) {
      console.error("Error reviewing card:", error);
      res.status(500).json({ message: "Failed to review card" });
    }
  });

  // Delete a card
  app.delete("/api/spaced-repetition/cards/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      await storage.deleteSpacedRepetitionCard(req.params.id);
      res.json({ message: "Card deleted" });
    } catch (error: any) {
      console.error("Error deleting card:", error);
      res.status(500).json({ message: "Failed to delete card" });
    }
  });

  // Generate cards from a quiz
  app.post("/api/spaced-repetition/generate-from-quiz/:quizId", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const quiz = await storage.getQuiz(req.params.quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      const questions = await storage.getQuizQuestions(req.params.quizId);
      const cards = [];
      
      for (const question of questions) {
        const card = await storage.createSpacedRepetitionCard({
          userId: req.user.id,
          question: question.question,
          answer: question.correctAnswer,
          sourceType: 'quiz',
          sourceId: question.id,
          courseId: quiz.courseId || null,
          topic: quiz.title,
          nextReviewDate: new Date(),
        });
        cards.push(card);
      }
      
      res.json({
        message: `Created ${cards.length} flashcards from quiz`,
        cards,
      });
    } catch (error: any) {
      console.error("Error generating cards from quiz:", error);
      res.status(500).json({ message: "Failed to generate cards" });
    }
  });

  // ============================================
  // LEARNING ENHANCEMENT - RECOMMENDATIONS
  // ============================================

  // Get personalized recommendations
  app.get("/api/recommendations", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const recommendations = await storage.getRecommendations(req.user.id, limit);
      res.json(recommendations);
    } catch (error: any) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  // Generate new recommendations based on performance
  app.post("/api/recommendations/generate", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      // Clear old recommendations
      await storage.clearUserRecommendations(req.user.id);
      
      // Get user's quiz attempts
      const attempts = await storage.getQuizAttempts(req.user.id);
      
      // Analyze performance by course
      const coursePerformance: Record<string, { scores: number[]; quizIds: string[] }> = {};
      
      for (const attempt of attempts) {
        const quiz = await storage.getQuiz(attempt.quizId!);
        if (quiz && quiz.courseId) {
          if (!coursePerformance[quiz.courseId]) {
            coursePerformance[quiz.courseId] = { scores: [], quizIds: [] };
          }
          const score = (attempt.score / attempt.totalQuestions) * 100;
          coursePerformance[quiz.courseId].scores.push(score);
          coursePerformance[quiz.courseId].quizIds.push(quiz.id);
        }
      }
      
      const recommendations = [];
      
      // Find weak areas (average score < 70%)
      for (const [courseId, data] of Object.entries(coursePerformance)) {
        const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
        
        if (avgScore < 70) {
          const course = await storage.getCourse(courseId);
          if (course) {
            // Recommend materials for this course
            const materials = await storage.getMaterials();
            const courseMaterials = materials.filter(m => m.courseId === courseId).slice(0, 3);
            
            for (const material of courseMaterials) {
              const rec = await storage.createRecommendation({
                userId: req.user.id,
                type: 'material',
                targetId: material.id,
                targetTitle: material.title,
                reason: `Your average score in ${course.title} is ${Math.round(avgScore)}%. Review this material to improve.`,
                priority: Math.round(100 - avgScore),
                courseId,
                relatedScore: Math.round(avgScore),
                status: 'active',
              });
              recommendations.push(rec);
            }
            
            // Recommend quizzes for practice
            const courseQuizzes = (await storage.getQuizzes()).filter(
              q => q.courseId === courseId && !data.quizIds.includes(q.id)
            ).slice(0, 2);
            
            for (const quiz of courseQuizzes) {
              const rec = await storage.createRecommendation({
                userId: req.user.id,
                type: 'quiz',
                targetId: quiz.id,
                targetTitle: quiz.title,
                reason: `Practice more quizzes in ${course.title} to improve your ${Math.round(avgScore)}% average.`,
                priority: Math.round(90 - avgScore),
                courseId,
                relatedScore: Math.round(avgScore),
                status: 'active',
              });
              recommendations.push(rec);
            }
          }
        }
      }
      
      // If user has due flashcards, recommend reviewing them
      const dueCards = await storage.getDueCards(req.user.id, 1);
      if (dueCards.length > 0) {
        const allDue = await storage.getDueCards(req.user.id, 1000);
        const rec = await storage.createRecommendation({
          userId: req.user.id,
          type: 'review',
          targetId: 'spaced-repetition',
          targetTitle: 'Review Flashcards',
          reason: `You have ${allDue.length} flashcard${allDue.length > 1 ? 's' : ''} due for review.`,
          priority: 95,
          status: 'active',
        });
        recommendations.push(rec);
      }
      
      // If user has no or few quiz attempts, recommend popular courses/quizzes
      if (attempts.length < 3) {
        const allQuizzes = await storage.getQuizzes();
        const takenQuizIds = new Set(attempts.map(a => a.quizId));
        const untakenQuizzes = allQuizzes.filter(q => !takenQuizIds.has(q.id)).slice(0, 3);
        
        for (const quiz of untakenQuizzes) {
          const rec = await storage.createRecommendation({
            userId: req.user.id,
            type: 'quiz',
            targetId: quiz.id,
            targetTitle: quiz.title,
            reason: 'Start your learning journey by taking quizzes to build knowledge and earn XP!',
            priority: 80,
            courseId: quiz.courseId || undefined,
            status: 'active',
          });
          recommendations.push(rec);
        }
      }
      
      // Check streak status and encourage maintaining it
      const gamification = await storage.getOrCreateUserGamification(req.user.id);
      if (gamification.currentStreak > 0 && gamification.currentStreak < 7) {
        const rec = await storage.createRecommendation({
          userId: req.user.id,
          type: 'streak',
          targetId: 'maintain-streak',
          targetTitle: 'Keep Your Streak Going!',
          reason: `You're on a ${gamification.currentStreak}-day streak! Complete any activity today to keep it going.`,
          priority: 90,
          status: 'active',
        });
        recommendations.push(rec);
      }
      
      // Sort by priority and return
      recommendations.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      
      res.json({
        message: `Generated ${recommendations.length} recommendations`,
        recommendations,
      });
    } catch (error: any) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Update recommendation status
  app.patch("/api/recommendations/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const { status } = req.body;
      
      if (!['viewed', 'completed', 'dismissed'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const rec = await storage.updateRecommendationStatus(req.params.id, status);
      res.json(rec);
    } catch (error: any) {
      console.error("Error updating recommendation:", error);
      res.status(500).json({ message: "Failed to update recommendation" });
    }
  });

  // ============================================
  // LEARNING ENHANCEMENT - BADGE CHECKING
  // ============================================

  // Check and award badges based on current progress
  app.post("/api/gamification/check-badges", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const gamification = await storage.getOrCreateUserGamification(req.user.id);
      const allBadges = await storage.getBadges();
      const earnedBadgeIds = (await storage.getUserBadges(req.user.id)).map(ub => ub.badgeId);
      
      const newBadges = [];
      
      for (const badge of allBadges) {
        if (earnedBadgeIds.includes(badge.id)) continue;
        
        const condition = badge.unlockCondition as any;
        let shouldAward = false;
        
        switch (condition.type) {
          case 'quiz_count':
            shouldAward = gamification.quizzesCompleted >= condition.value;
            break;
          case 'perfect_score':
            shouldAward = gamification.perfectScores >= condition.value;
            break;
          case 'streak_days':
            shouldAward = gamification.currentStreak >= condition.value;
            break;
          case 'materials_viewed':
            shouldAward = gamification.materialsViewed >= condition.value;
            break;
          case 'reviews_completed':
            shouldAward = gamification.reviewsCompleted >= condition.value;
            break;
          case 'level':
            shouldAward = gamification.level >= condition.value;
            break;
          case 'total_xp':
            shouldAward = gamification.totalXp >= condition.value;
            break;
        }
        
        if (shouldAward) {
          await storage.awardBadge(req.user.id, badge.id);
          
          // Award XP for earning badge
          if (badge.xpReward > 0) {
            await storage.addXp(req.user.id, badge.xpReward, 'badge_earned', badge.id, `Earned badge: ${badge.name}`);
          }
          
          newBadges.push(badge);
        }
      }
      
      res.json({
        newBadges,
        message: newBadges.length > 0 ? `Earned ${newBadges.length} new badge(s)!` : 'No new badges earned',
      });
    } catch (error: any) {
      console.error("Error checking badges:", error);
      res.status(500).json({ message: "Failed to check badges" });
    }
  });

  // ============================================
  // STUDY GROUPS - Peer Collaboration
  // ============================================

  // Get all public study groups or user's groups
  app.get("/api/study-groups", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const { courseId, onlyMine } = req.query;
      
      if (onlyMine === 'true') {
        const groups = await storage.getUserStudyGroups(req.user.id);
        const groupsWithCount = await Promise.all(groups.map(async (g) => ({
          ...g,
          memberCount: await storage.getStudyGroupMemberCount(g.id)
        })));
        return res.json(groupsWithCount);
      }
      
      const groups = await storage.getStudyGroups({ 
        courseId: courseId as string,
        isPublic: true,
        limit: 50
      });
      
      const groupsWithDetails = await Promise.all(groups.map(async (g) => ({
        ...g,
        memberCount: await storage.getStudyGroupMemberCount(g.id),
        isMember: !!(await storage.getStudyGroupMember(g.id, req.user.id))
      })));
      
      res.json(groupsWithDetails);
    } catch (error: any) {
      console.error("Error fetching study groups:", error);
      res.status(500).json({ message: "Failed to fetch study groups" });
    }
  });

  // Get single study group with details
  app.get("/api/study-groups/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const group = await storage.getStudyGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Study group not found" });
      }
      
      const membership = await storage.getStudyGroupMember(group.id, req.user.id);
      const members = await storage.getStudyGroupMembers(group.id);
      
      res.json({
        ...group,
        isMember: !!membership,
        memberRole: membership?.role,
        members,
        memberCount: members.length
      });
    } catch (error: any) {
      console.error("Error fetching study group:", error);
      res.status(500).json({ message: "Failed to fetch study group" });
    }
  });

  // Create a new study group
  app.post("/api/study-groups", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const { name, description, courseId, isPublic, maxMembers } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Group name is required" });
      }
      
      const group = await storage.createStudyGroup({
        name,
        description,
        courseId,
        isPublic: isPublic !== false,
        maxMembers: maxMembers || 10,
        createdById: req.user.id
      });
      
      // Award XP for creating a study group
      await storage.addXp(req.user.id, 15, 'study_group_created', group.id, `Created study group: ${name}`);
      
      res.status(201).json(group);
    } catch (error: any) {
      console.error("Error creating study group:", error);
      res.status(500).json({ message: "Failed to create study group" });
    }
  });

  // Update a study group
  app.patch("/api/study-groups/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const group = await storage.getStudyGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Study group not found" });
      }
      
      const membership = await storage.getStudyGroupMember(group.id, req.user.id);
      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return res.status(403).json({ message: "Only group owners and admins can update the group" });
      }
      
      const { name, description, isPublic, maxMembers } = req.body;
      const updated = await storage.updateStudyGroup(group.id, {
        name,
        description,
        isPublic,
        maxMembers
      });
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating study group:", error);
      res.status(500).json({ message: "Failed to update study group" });
    }
  });

  // Delete a study group
  app.delete("/api/study-groups/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const group = await storage.getStudyGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Study group not found" });
      }
      
      if (group.createdById !== req.user.id) {
        return res.status(403).json({ message: "Only the group owner can delete the group" });
      }
      
      await storage.deleteStudyGroup(group.id);
      res.json({ message: "Study group deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting study group:", error);
      res.status(500).json({ message: "Failed to delete study group" });
    }
  });

  // Join a study group
  app.post("/api/study-groups/:id/join", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const group = await storage.getStudyGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Study group not found" });
      }
      
      const existingMember = await storage.getStudyGroupMember(group.id, req.user.id);
      if (existingMember) {
        return res.status(400).json({ message: "You are already a member of this group" });
      }
      
      const memberCount = await storage.getStudyGroupMemberCount(group.id);
      if (group.maxMembers && memberCount >= group.maxMembers) {
        return res.status(400).json({ message: "Group is full" });
      }
      
      if (!group.isPublic) {
        return res.status(403).json({ message: "This is a private group. You need an invite to join." });
      }
      
      const member = await storage.joinStudyGroup(group.id, req.user.id);
      
      // Award XP for joining a study group
      await storage.addXp(req.user.id, 5, 'study_group_joined', group.id, `Joined study group: ${group.name}`);
      
      res.status(201).json(member);
    } catch (error: any) {
      console.error("Error joining study group:", error);
      res.status(500).json({ message: "Failed to join study group" });
    }
  });

  // Leave a study group
  app.post("/api/study-groups/:id/leave", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const group = await storage.getStudyGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Study group not found" });
      }
      
      const membership = await storage.getStudyGroupMember(group.id, req.user.id);
      if (!membership) {
        return res.status(400).json({ message: "You are not a member of this group" });
      }
      
      if (membership.role === 'owner') {
        return res.status(400).json({ message: "The group owner cannot leave. Delete the group instead." });
      }
      
      await storage.leaveStudyGroup(group.id, req.user.id);
      res.json({ message: "Left the study group successfully" });
    } catch (error: any) {
      console.error("Error leaving study group:", error);
      res.status(500).json({ message: "Failed to leave study group" });
    }
  });

  // Get study group messages
  app.get("/api/study-groups/:id/messages", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const group = await storage.getStudyGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Study group not found" });
      }
      
      const membership = await storage.getStudyGroupMember(group.id, req.user.id);
      if (!membership) {
        return res.status(403).json({ message: "You must be a member to view messages" });
      }
      
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await storage.getStudyGroupMessages(group.id, limit);
      res.json(messages);
    } catch (error: any) {
      console.error("Error fetching study group messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send a message to a study group
  app.post("/api/study-groups/:id/messages", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const group = await storage.getStudyGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Study group not found" });
      }
      
      const membership = await storage.getStudyGroupMember(group.id, req.user.id);
      if (!membership) {
        return res.status(403).json({ message: "You must be a member to send messages" });
      }
      
      const { content, attachmentType, attachmentId } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      const message = await storage.createStudyGroupMessage({
        groupId: group.id,
        userId: req.user.id,
        content,
        attachmentType,
        attachmentId
      });
      
      // Award small XP for engagement
      await storage.addXp(req.user.id, 1, 'study_group_message', message.id, 'Sent a study group message');
      
      res.status(201).json(message);
    } catch (error: any) {
      console.error("Error sending study group message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Get study group members
  app.get("/api/study-groups/:id/members", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const group = await storage.getStudyGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Study group not found" });
      }
      
      const members = await storage.getStudyGroupMembers(group.id);
      res.json(members);
    } catch (error: any) {
      console.error("Error fetching study group members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  // ============================================
  // INSTITUTION USER - SCHOOL MANAGEMENT
  // ============================================
  
  // Get schools owned by the current institution user
  app.get("/api/institution/my-schools", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: "Only institution users can access this endpoint" });
      }
      
      const schools = await storage.getSchoolsByOwner(req.user.id);
      res.json(schools);
    } catch (error: any) {
      console.error("Error fetching user's schools:", error);
      res.status(500).json({ message: "Failed to fetch schools" });
    }
  });
  
  // Get the current active school for the institution user
  app.get("/api/institution/current-school", isAuthenticated, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: "Only institution users can access this endpoint" });
      }
      
      const schools = await storage.getSchoolsByOwner(req.user.id);
      if (schools.length === 0) {
        return res.json(null);
      }
      
      // Return the first active school (or most recently created one)
      const activeSchool = schools.find(s => s.isActive) || schools[0];
      res.json({
        id: activeSchool.id,
        name: activeSchool.name,
        subdomain: activeSchool.subdomain,
        slug: activeSchool.slug,
        logoUrl: activeSchool.logoUrl,
        subscriptionStatus: activeSchool.subscriptionStatus,
        trialEndDate: activeSchool.trialEndDate,
      });
    } catch (error: any) {
      console.error("Error fetching current school:", error);
      res.status(500).json({ message: "Failed to fetch current school" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
