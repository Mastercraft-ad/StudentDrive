import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Email/Password Auth with verification
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  gender: varchar("gender", { length: 20 }), // male, female, other, prefer_not_to_say
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 20 }), // student, institution, admin - null until onboarding
  institutionId: varchar("institution_id").references(() => institutions.id),
  bio: text("bio"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  verificationToken: varchar("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  currentLevel: integer("current_level"),
  yearOfAdmission: integer("year_of_admission"),
  expectedGraduationYear: integer("expected_graduation_year"),
  modeOfStudy: varchar("mode_of_study", { length: 50 }),
  programme: varchar("programme"),
  programmeId: varchar("programme_id").references(() => programmes.id),
  studyGoals: text("study_goals").array(),
  learningStyle: text("learning_style").array(),
  studySchedule: text("study_schedule").array(),
  
  // Institution-specific fields
  institutionName: varchar("institution_name"),
  institutionType: varchar("institution_type"),
  numberOfStudents: integer("number_of_students"),
  departments: text("departments").array(),
  institutionAddress: text("institution_address"),
  institutionPhone: varchar("institution_phone"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [users.institutionId],
    references: [institutions.id],
  }),
  programme: one(programmes, {
    fields: [users.programmeId],
    references: [programmes.id],
  }),
  materials: many(materials),
  quizzes: many(quizzes),
  quizAttempts: many(quizAttempts),
  bookmarks: many(bookmarks),
}));

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Institutions table
export const institutions = pgTable("institutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  profileSlug: varchar("profile_slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  logoUrl: varchar("logo_url"),
  website: varchar("website"),
  
  // Location fields
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
  address: text("address"),
  postalCode: varchar("postal_code", { length: 20 }),
  
  // Contact information
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  
  // Additional metadata
  type: varchar("type", { length: 100 }), // University, College, Institute, etc.
  founded: integer("founded"), // Year founded
  studentCount: integer("student_count"),
  
  // Review stats (automatically calculated)
  averageRating: real("average_rating").default(0),
  totalReviews: integer("total_reviews").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const institutionsRelations = relations(institutions, ({ many }) => ({
  users: many(users),
  courses: many(courses),
  programmes: many(programmes),
  reviews: many(institutionReviews),
}));

export const insertInstitutionSchema = createInsertSchema(institutions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  averageRating: true,
  totalReviews: true,
});

export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;
export type Institution = typeof institutions.$inferSelect;

// Institution Reviews table
export const institutionReviews = pgTable("institution_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").references(() => institutions.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  title: varchar("title", { length: 255 }),
  comment: text("comment"),
  verified: boolean("verified").default(false), // For verified students/alumni
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const institutionReviewsRelations = relations(institutionReviews, ({ one }) => ({
  institution: one(institutions, {
    fields: [institutionReviews.institutionId],
    references: [institutions.id],
  }),
  user: one(users, {
    fields: [institutionReviews.userId],
    references: [users.id],
  }),
}));

export const insertInstitutionReviewSchema = createInsertSchema(institutionReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verified: true,
});

export type InsertInstitutionReview = z.infer<typeof insertInstitutionReviewSchema>;
export type InstitutionReview = typeof institutionReviews.$inferSelect;

// Programmes table
export const programmes = pgTable("programmes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").references(() => institutions.id, { onDelete: 'cascade' }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }),
  degree: varchar("degree", { length: 100 }), // Bachelor, Master, Doctorate, Diploma, etc.
  duration: integer("duration"), // duration in years
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const programmesRelations = relations(programmes, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [programmes.institutionId],
    references: [institutions.id],
  }),
  users: many(users),
}));

export const insertProgrammeSchema = createInsertSchema(programmes).omit({
  id: true,
  createdAt: true,
});

export type InsertProgramme = z.infer<typeof insertProgrammeSchema>;
export type Programme = typeof programmes.$inferSelect;

// Courses table
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  code: varchar("code", { length: 50 }),
  institutionId: varchar("institution_id").references(() => institutions.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const coursesRelations = relations(courses, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [courses.institutionId],
    references: [institutions.id],
  }),
  materials: many(materials),
  quizzes: many(quizzes),
}));

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
});

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

// Materials table
export const materials = pgTable("materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  fileUrl: varchar("file_url"),
  fileType: varchar("file_type", { length: 50 }), // pdf, doc, video, etc.
  materialType: varchar("material_type", { length: 50 }).notNull(), // lecture_notes, textbook, study_guide, past_questions
  courseId: varchar("course_id").references(() => courses.id),
  uploadedById: varchar("uploaded_by_id").references(() => users.id),
  institutionId: varchar("institution_id").references(() => institutions.id),
  programmeId: varchar("programme_id").references(() => programmes.id),
  level: integer("level"), // 100, 200, 300, 400, etc.
  semester: integer("semester"), // 1, 2
  topic: varchar("topic", { length: 255 }),
  tags: text("tags").array(),
  fileSize: integer("file_size"), // file size in bytes
  originalFilename: varchar("original_filename", { length: 255 }), // original uploaded filename
  viewCount: integer("view_count").default(0), // track how many times material has been viewed
  downloadCount: integer("download_count").default(0), // track how many times material has been downloaded
  moderationStatus: varchar("moderation_status", { length: 20 }).default("pending"), // pending, approved, rejected
  moderatedById: varchar("moderated_by_id").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  moderationNotes: text("moderation_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const materialsRelations = relations(materials, ({ one, many }) => ({
  course: one(courses, {
    fields: [materials.courseId],
    references: [courses.id],
  }),
  uploadedBy: one(users, {
    fields: [materials.uploadedById],
    references: [users.id],
  }),
  bookmarks: many(bookmarks),
  reviews: many(materialReviews),
  ratings: many(materialRatings),
  reports: many(materialReports),
}));

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  createdAt: true,
});

export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materials.$inferSelect;

// Quizzes table
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  courseId: varchar("course_id").references(() => courses.id),
  createdById: varchar("created_by_id").references(() => users.id),
  timeLimit: integer("time_limit"), // in minutes, null = no limit
  passingScore: integer("passing_score").default(70),
  moderationStatus: varchar("moderation_status", { length: 20 }).default("pending"), // pending, approved, rejected
  moderatedById: varchar("moderated_by_id").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  moderationNotes: text("moderation_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  course: one(courses, {
    fields: [quizzes.courseId],
    references: [courses.id],
  }),
  createdBy: one(users, {
    fields: [quizzes.createdById],
    references: [users.id],
  }),
  questions: many(quizQuestions),
  attempts: many(quizAttempts),
}));

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

// Quiz Questions table
export const quizQuestions = pgTable("quiz_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").references(() => quizzes.id, { onDelete: 'cascade' }),
  question: text("question").notNull(),
  questionType: varchar("question_type", { length: 20 }).notNull(), // mcq, true_false
  options: jsonb("options").notNull(), // Array of options for MCQ
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  order: integer("order").notNull(),
});

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizQuestions.quizId],
    references: [quizzes.id],
  }),
}));

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({
  id: true,
});

export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;

// Quiz Attempts table
export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").references(() => quizzes.id),
  studentId: varchar("student_id").references(() => users.id),
  answers: jsonb("answers").notNull(), // Object mapping question IDs to answers
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  passed: boolean("passed").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id],
  }),
  student: one(users, {
    fields: [quizAttempts.studentId],
    references: [users.id],
  }),
}));

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  completedAt: true,
});

export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;

// Bookmarks table
export const bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  materialId: varchar("material_id").references(() => materials.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  material: one(materials, {
    fields: [bookmarks.materialId],
    references: [materials.id],
  }),
}));

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
});

export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;

// Material Reviews table
export const materialReviews = pgTable("material_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  materialId: varchar("material_id").references(() => materials.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  reviewText: text("review_text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const materialReviewsRelations = relations(materialReviews, ({ one }) => ({
  material: one(materials, {
    fields: [materialReviews.materialId],
    references: [materials.id],
  }),
  user: one(users, {
    fields: [materialReviews.userId],
    references: [users.id],
  }),
}));

export const insertMaterialReviewSchema = createInsertSchema(materialReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMaterialReview = z.infer<typeof insertMaterialReviewSchema>;
export type MaterialReview = typeof materialReviews.$inferSelect;

// Material Ratings table
export const materialRatings = pgTable("material_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  materialId: varchar("material_id").references(() => materials.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const materialRatingsRelations = relations(materialRatings, ({ one }) => ({
  material: one(materials, {
    fields: [materialRatings.materialId],
    references: [materials.id],
  }),
  user: one(users, {
    fields: [materialRatings.userId],
    references: [users.id],
  }),
}));

export const insertMaterialRatingSchema = createInsertSchema(materialRatings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMaterialRating = z.infer<typeof insertMaterialRatingSchema>;
export type MaterialRating = typeof materialRatings.$inferSelect;

// Material Reports table
export const materialReports = pgTable("material_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  materialId: varchar("material_id").references(() => materials.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  reason: varchar("reason", { length: 50 }).notNull(), // inappropriate, spam, copyright, inaccurate, other
  description: text("description"),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, reviewed, resolved, dismissed
  reviewedById: varchar("reviewed_by_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const materialReportsRelations = relations(materialReports, ({ one }) => ({
  material: one(materials, {
    fields: [materialReports.materialId],
    references: [materials.id],
  }),
  user: one(users, {
    fields: [materialReports.userId],
    references: [users.id],
  }),
  reviewedBy: one(users, {
    fields: [materialReports.reviewedById],
    references: [users.id],
  }),
}));

export const insertMaterialReportSchema = createInsertSchema(materialReports).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
});

export type InsertMaterialReport = z.infer<typeof insertMaterialReportSchema>;
export type MaterialReport = typeof materialReports.$inferSelect;

// User Activity Logs table - For tracking user actions
export const userActivityLogs = pgTable("user_activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  activityType: varchar("activity_type", { length: 50 }).notNull(), // login, logout, material_upload, material_view, material_download, quiz_taken, etc.
  description: text("description"), // human-readable description
  metadata: jsonb("metadata"), // additional data (e.g., materialId, quizId, score, etc.)
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  userAgent: text("user_agent"), // browser info
  createdAt: timestamp("created_at").defaultNow(),
});

export const userActivityLogsRelations = relations(userActivityLogs, ({ one }) => ({
  user: one(users, {
    fields: [userActivityLogs.userId],
    references: [users.id],
  }),
}));

export const insertUserActivityLogSchema = createInsertSchema(userActivityLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertUserActivityLog = z.infer<typeof insertUserActivityLogSchema>;
export type UserActivityLog = typeof userActivityLogs.$inferSelect;

// User Statistics table - For tracking aggregate user statistics
export const userStatistics = pgTable("user_statistics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").unique().references(() => users.id, { onDelete: 'cascade' }).notNull(),
  loginCount: integer("login_count").default(0).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  materialsUploaded: integer("materials_uploaded").default(0).notNull(),
  materialsViewed: integer("materials_viewed").default(0).notNull(),
  materialsDownloaded: integer("materials_downloaded").default(0).notNull(),
  quizzesTaken: integer("quizzes_taken").default(0).notNull(),
  quizzesCreated: integer("quizzes_created").default(0).notNull(),
  bookmarksCreated: integer("bookmarks_created").default(0).notNull(),
  averageQuizScore: integer("average_quiz_score"), // percentage (0-100)
  totalTimeSpent: integer("total_time_spent").default(0), // in minutes
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userStatisticsRelations = relations(userStatistics, ({ one }) => ({
  user: one(users, {
    fields: [userStatistics.userId],
    references: [users.id],
  }),
}));

export const insertUserStatisticsSchema = createInsertSchema(userStatistics).omit({
  id: true,
  updatedAt: true,
});

export type InsertUserStatistics = z.infer<typeof insertUserStatisticsSchema>;
export type UserStatistics = typeof userStatistics.$inferSelect;

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // material_approved, material_rejected, quiz_graded, comment_reply, new_material, system_announcement, etc.
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  link: varchar("link"), // URL to navigate to when clicked
  read: boolean("read").default(false).notNull(),
  metadata: jsonb("metadata"), // additional data (e.g., materialId, quizId, etc.)
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  read: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// ============================================
// SCHOOL MANAGEMENT SYSTEM (SMS) TABLES
// Multi-tenant school portal tables
// ============================================

// Subscription Plans table - Available plans for schools
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(), // Free Trial, Basic, Premium, Enterprise
  code: varchar("code", { length: 50 }).unique().notNull(), // free_trial, basic, premium, enterprise
  description: text("description"),
  price: integer("price").default(0).notNull(), // Price in kobo (Paystack uses lowest currency unit)
  billingPeriod: varchar("billing_period", { length: 20 }).default("monthly").notNull(), // monthly, yearly
  trialDays: integer("trial_days").default(14), // Number of days for free trial
  features: jsonb("features"), // Array of feature strings
  maxStudents: integer("max_students"), // null = unlimited
  maxTeachers: integer("max_teachers"), // null = unlimited
  maxClasses: integer("max_classes"), // null = unlimited
  isActive: boolean("is_active").default(true).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// Schools table - Multi-tenant schools with subdomains
export const schools = pgTable("schools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  subdomain: varchar("subdomain", { length: 100 }).unique().notNull(), // abc.studentdrive.com
  slug: varchar("slug", { length: 255 }).unique().notNull(), // URL-friendly identifier
  
  // School details
  description: text("description"),
  logoUrl: varchar("logo_url"),
  bannerUrl: varchar("banner_url"),
  website: varchar("website"),
  motto: varchar("motto", { length: 255 }),
  
  // Location
  country: varchar("country", { length: 100 }),
  state: varchar("state", { length: 100 }),
  city: varchar("city", { length: 100 }),
  address: text("address"),
  postalCode: varchar("postal_code", { length: 20 }),
  
  // Contact
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  alternatePhone: varchar("alternate_phone", { length: 50 }),
  
  // School type and level
  schoolType: varchar("school_type", { length: 50 }), // primary, secondary, tertiary, mixed
  ownershipType: varchar("ownership_type", { length: 50 }), // government, private, mission
  
  // Admin user (owner who registered the school - links to public users table)
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  
  // Subscription
  subscriptionPlanId: varchar("subscription_plan_id").references(() => subscriptionPlans.id),
  subscriptionStatus: varchar("subscription_status", { length: 20 }).default("trial").notNull(), // trial, active, expired, cancelled
  trialStartDate: timestamp("trial_start_date"),
  trialEndDate: timestamp("trial_end_date"),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  
  // Paystack customer
  paystackCustomerCode: varchar("paystack_customer_code"),
  paystackSubscriptionCode: varchar("paystack_subscription_code"),
  
  // Branding/Theme
  primaryColor: varchar("primary_color", { length: 7 }).default("#3b82f6"), // Hex color
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#1e40af"),
  
  // Settings
  currentTermId: varchar("current_term_id"), // Reference to current academic term
  currentSessionYear: varchar("current_session_year", { length: 20 }), // e.g., "2024/2025"
  timezone: varchar("timezone", { length: 50 }).default("Africa/Lagos"),
  currency: varchar("currency", { length: 3 }).default("NGN"),
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  
  // Public Platform Integration
  allowPublicPlatformAccess: boolean("allow_public_platform_access").default(false).notNull(), // Allow school students to access public platform features
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const schoolsRelations = relations(schools, ({ one, many }) => ({
  owner: one(users, {
    fields: [schools.ownerId],
    references: [users.id],
  }),
  subscriptionPlan: one(subscriptionPlans, {
    fields: [schools.subscriptionPlanId],
    references: [subscriptionPlans.id],
  }),
  schoolUsers: many(schoolUsers),
}));

export const insertSchoolSchema = createInsertSchema(schools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  subscriptionStatus: true,
  trialStartDate: true,
  trialEndDate: true,
  subscriptionStartDate: true,
  subscriptionEndDate: true,
  paystackCustomerCode: true,
  paystackSubscriptionCode: true,
  isVerified: true,
}).extend({
  name: z.string().min(1, "School name is required").max(255, "School name must be less than 255 characters"),
  subdomain: z.string().min(3, "Subdomain must be at least 3 characters").max(100, "Subdomain must be less than 100 characters").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Subdomain must be lowercase, numbers, and hyphens only"),
  email: z.string().email("Invalid email address"),
});

export const updateSchoolSchema = insertSchoolSchema.partial();

export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type UpdateSchool = z.infer<typeof updateSchoolSchema>;
export type School = typeof schools.$inferSelect;

// School Users table - Students, Teachers, Parents within a school (separate from public users)
export const schoolUsers = pgTable("school_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  
  // Authentication
  email: varchar("email", { length: 255 }).notNull(),
  password: varchar("password").notNull(),
  username: varchar("username", { length: 100 }),
  
  // Profile
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  gender: varchar("gender", { length: 20 }), // male, female
  dateOfBirth: timestamp("date_of_birth"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  
  // Role within school
  role: varchar("role", { length: 20 }).notNull(), // student, teacher, parent, school_admin
  
  // Student-specific fields
  admissionNumber: varchar("admission_number", { length: 50 }),
  admissionDate: timestamp("admission_date"),
  classId: varchar("class_id"), // Reference to school_classes
  
  // Teacher-specific fields
  employeeId: varchar("employee_id", { length: 50 }),
  qualification: varchar("qualification", { length: 255 }),
  specialization: varchar("specialization", { length: 255 }),
  dateOfEmployment: timestamp("date_of_employment"),
  
  // Parent-specific fields (linked students stored in separate junction table)
  occupation: varchar("occupation", { length: 100 }),
  relationship: varchar("relationship", { length: 50 }), // father, mother, guardian
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  
  // Session
  lastLoginAt: timestamp("last_login_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueSchoolEmail: index("unique_school_email").on(table.schoolId, table.email),
}));

export const schoolUsersRelations = relations(schoolUsers, ({ one }) => ({
  school: one(schools, {
    fields: [schoolUsers.schoolId],
    references: [schools.id],
  }),
}));

export const insertSchoolUserSchema = createInsertSchema(schoolUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  emailVerified: true,
}).extend({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "teacher", "parent", "school_admin"]),
});

export const updateSchoolUserSchema = insertSchoolUserSchema.partial().omit({ password: true });

export type InsertSchoolUser = z.infer<typeof insertSchoolUserSchema>;
export type UpdateSchoolUser = z.infer<typeof updateSchoolUserSchema>;
export type SchoolUser = typeof schoolUsers.$inferSelect;

// Parent-Student Relationship table (junction table)
export const parentStudentLinks = pgTable("parent_student_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").references(() => schoolUsers.id, { onDelete: 'cascade' }).notNull(),
  studentId: varchar("student_id").references(() => schoolUsers.id, { onDelete: 'cascade' }).notNull(),
  relationship: varchar("relationship", { length: 50 }).notNull(), // father, mother, guardian
  isPrimary: boolean("is_primary").default(false).notNull(), // Primary guardian
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueParentStudent: index("unique_parent_student").on(table.parentId, table.studentId),
}));

export const parentStudentLinksRelations = relations(parentStudentLinks, ({ one }) => ({
  parent: one(schoolUsers, {
    fields: [parentStudentLinks.parentId],
    references: [schoolUsers.id],
    relationName: "parentLinks",
  }),
  student: one(schoolUsers, {
    fields: [parentStudentLinks.studentId],
    references: [schoolUsers.id],
    relationName: "studentLinks",
  }),
}));

export const insertParentStudentLinkSchema = createInsertSchema(parentStudentLinks).omit({
  id: true,
  createdAt: true,
});

export type InsertParentStudentLink = z.infer<typeof insertParentStudentLinkSchema>;
export type ParentStudentLink = typeof parentStudentLinks.$inferSelect;

// School Sessions table (for session management within schools)
export const schoolSessions = pgTable("school_sessions", {
  sid: varchar("sid").primaryKey(),
  schoolId: varchar("school_id").references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
}, (table) => [
  index("IDX_school_session_expire").on(table.expire),
  index("IDX_school_session_school").on(table.schoolId),
]);

// ============================================
// ACADEMIC STRUCTURE TABLES
// ============================================

// Academic Terms table - Define academic terms and dates
export const academicTerms = pgTable("academic_terms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  name: varchar("name", { length: 100 }).notNull(), // First Term, Second Term, Third Term
  sessionYear: varchar("session_year", { length: 20 }).notNull(), // 2024/2025
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isCurrent: boolean("is_current").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueSchoolTerm: index("unique_school_term").on(table.schoolId, table.name, table.sessionYear),
}));

export const academicTermsRelations = relations(academicTerms, ({ one }) => ({
  school: one(schools, {
    fields: [academicTerms.schoolId],
    references: [schools.id],
  }),
}));

export const insertAcademicTermSchema = createInsertSchema(academicTerms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAcademicTerm = z.infer<typeof insertAcademicTermSchema>;
export type AcademicTerm = typeof academicTerms.$inferSelect;

// School Classes table - Create school class lists
export const schoolClasses = pgTable("school_classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  name: varchar("name", { length: 100 }).notNull(), // JSS 1, SS 2, Grade 5
  level: integer("level"), // Numeric level for ordering (1, 2, 3, etc.)
  section: varchar("section", { length: 20 }), // A, B, C or Science, Arts
  capacity: integer("capacity"), // Maximum students
  classTeacherId: varchar("class_teacher_id").references(() => schoolUsers.id),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueClassName: index("unique_class_name").on(table.schoolId, table.name, table.section),
}));

export const schoolClassesRelations = relations(schoolClasses, ({ one, many }) => ({
  school: one(schools, {
    fields: [schoolClasses.schoolId],
    references: [schools.id],
  }),
  classTeacher: one(schoolUsers, {
    fields: [schoolClasses.classTeacherId],
    references: [schoolUsers.id],
  }),
  subjects: many(schoolSubjects),
  students: many(classEnrollments),
}));

export const insertSchoolClassSchema = createInsertSchema(schoolClasses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSchoolClass = z.infer<typeof insertSchoolClassSchema>;
export type SchoolClass = typeof schoolClasses.$inferSelect;

// School Subjects table - Set up subjects for classes
export const schoolSubjects = pgTable("school_subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  name: varchar("name", { length: 100 }).notNull(), // Mathematics, English, Physics
  code: varchar("code", { length: 20 }), // MTH, ENG, PHY
  description: text("description"),
  creditUnits: integer("credit_units").default(1),
  isCompulsory: boolean("is_compulsory").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueSubjectCode: index("unique_subject_code").on(table.schoolId, table.code),
}));

export const schoolSubjectsRelations = relations(schoolSubjects, ({ one }) => ({
  school: one(schools, {
    fields: [schoolSubjects.schoolId],
    references: [schools.id],
  }),
}));

export const insertSchoolSubjectSchema = createInsertSchema(schoolSubjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSchoolSubject = z.infer<typeof insertSchoolSubjectSchema>;
export type SchoolSubject = typeof schoolSubjects.$inferSelect;

// Class Subjects table - Link subjects to specific classes
export const classSubjects = pgTable("class_subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").references(() => schoolClasses.id, { onDelete: 'cascade' }).notNull(),
  subjectId: varchar("subject_id").references(() => schoolSubjects.id, { onDelete: 'cascade' }).notNull(),
  isCompulsory: boolean("is_compulsory").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueClassSubject: index("unique_class_subject").on(table.classId, table.subjectId),
}));

export const classSubjectsRelations = relations(classSubjects, ({ one }) => ({
  class: one(schoolClasses, {
    fields: [classSubjects.classId],
    references: [schoolClasses.id],
  }),
  subject: one(schoolSubjects, {
    fields: [classSubjects.subjectId],
    references: [schoolSubjects.id],
  }),
}));

export const insertClassSubjectSchema = createInsertSchema(classSubjects).omit({
  id: true,
  createdAt: true,
});

export type InsertClassSubject = z.infer<typeof insertClassSubjectSchema>;
export type ClassSubject = typeof classSubjects.$inferSelect;

// Teacher Assignments table - Assign teachers to subjects/classes
export const teacherAssignments = pgTable("teacher_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  teacherId: varchar("teacher_id").references(() => schoolUsers.id, { onDelete: 'cascade' }).notNull(),
  classId: varchar("class_id").references(() => schoolClasses.id, { onDelete: 'cascade' }).notNull(),
  subjectId: varchar("subject_id").references(() => schoolSubjects.id, { onDelete: 'cascade' }).notNull(),
  termId: varchar("term_id").references(() => academicTerms.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueAssignment: index("unique_teacher_assignment").on(table.teacherId, table.classId, table.subjectId, table.termId),
}));

export const teacherAssignmentsRelations = relations(teacherAssignments, ({ one }) => ({
  school: one(schools, {
    fields: [teacherAssignments.schoolId],
    references: [schools.id],
  }),
  teacher: one(schoolUsers, {
    fields: [teacherAssignments.teacherId],
    references: [schoolUsers.id],
  }),
  class: one(schoolClasses, {
    fields: [teacherAssignments.classId],
    references: [schoolClasses.id],
  }),
  subject: one(schoolSubjects, {
    fields: [teacherAssignments.subjectId],
    references: [schoolSubjects.id],
  }),
  term: one(academicTerms, {
    fields: [teacherAssignments.termId],
    references: [academicTerms.id],
  }),
}));

export const insertTeacherAssignmentSchema = createInsertSchema(teacherAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTeacherAssignment = z.infer<typeof insertTeacherAssignmentSchema>;
export type TeacherAssignment = typeof teacherAssignments.$inferSelect;

// Class Enrollments table - Link students to classes
export const classEnrollments = pgTable("class_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => schoolUsers.id, { onDelete: 'cascade' }).notNull(),
  classId: varchar("class_id").references(() => schoolClasses.id, { onDelete: 'cascade' }).notNull(),
  termId: varchar("term_id").references(() => academicTerms.id),
  enrollmentDate: timestamp("enrollment_date").defaultNow(),
  status: varchar("status", { length: 20 }).default("active").notNull(), // active, transferred, graduated, withdrawn
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueEnrollment: index("unique_student_class_term").on(table.studentId, table.classId, table.termId),
}));

export const classEnrollmentsRelations = relations(classEnrollments, ({ one }) => ({
  student: one(schoolUsers, {
    fields: [classEnrollments.studentId],
    references: [schoolUsers.id],
  }),
  class: one(schoolClasses, {
    fields: [classEnrollments.classId],
    references: [schoolClasses.id],
  }),
  term: one(academicTerms, {
    fields: [classEnrollments.termId],
    references: [academicTerms.id],
  }),
}));

export const insertClassEnrollmentSchema = createInsertSchema(classEnrollments).omit({
  id: true,
  createdAt: true,
  enrollmentDate: true,
});

export type InsertClassEnrollment = z.infer<typeof insertClassEnrollmentSchema>;
export type ClassEnrollment = typeof classEnrollments.$inferSelect;

// ============================================
// ATTENDANCE SYSTEM TABLES
// ============================================

// Attendance Records table - Create school attendance records
export const attendanceRecords = pgTable("attendance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  classId: varchar("class_id").references(() => schoolClasses.id, { onDelete: 'cascade' }).notNull(),
  studentId: varchar("student_id").references(() => schoolUsers.id, { onDelete: 'cascade' }).notNull(),
  termId: varchar("term_id").references(() => academicTerms.id).notNull(),
  subjectId: varchar("subject_id").references(() => schoolSubjects.id, { onDelete: 'cascade' }), // Optional - null for daily class attendance
  date: timestamp("date").notNull(),
  status: varchar("status", { length: 20 }).notNull(), // present, absent, late, excused
  markedById: varchar("marked_by_id").references(() => schoolUsers.id),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueAttendance: index("unique_student_attendance").on(table.studentId, table.classId, table.date, table.subjectId),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  school: one(schools, {
    fields: [attendanceRecords.schoolId],
    references: [schools.id],
  }),
  class: one(schoolClasses, {
    fields: [attendanceRecords.classId],
    references: [schoolClasses.id],
  }),
  student: one(schoolUsers, {
    fields: [attendanceRecords.studentId],
    references: [schoolUsers.id],
    relationName: "studentAttendance",
  }),
  term: one(academicTerms, {
    fields: [attendanceRecords.termId],
    references: [academicTerms.id],
  }),
  subject: one(schoolSubjects, {
    fields: [attendanceRecords.subjectId],
    references: [schoolSubjects.id],
  }),
  markedBy: one(schoolUsers, {
    fields: [attendanceRecords.markedById],
    references: [schoolUsers.id],
    relationName: "markedAttendance",
  }),
}));

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;

// ============================================
// GRADES & ASSESSMENTS TABLES
// ============================================

// Assessment Types table - Define assessment categories
export const assessmentTypes = pgTable("assessment_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  name: varchar("name", { length: 100 }).notNull(), // First CA, Second CA, Exam, Assignment
  code: varchar("code", { length: 20 }),
  weight: integer("weight").notNull(), // Percentage weight (e.g., 30 for 30%)
  maxScore: integer("max_score").default(100).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assessmentTypesRelations = relations(assessmentTypes, ({ one }) => ({
  school: one(schools, {
    fields: [assessmentTypes.schoolId],
    references: [schools.id],
  }),
}));

export const insertAssessmentTypeSchema = createInsertSchema(assessmentTypes).omit({
  id: true,
  createdAt: true,
});

export type InsertAssessmentType = z.infer<typeof insertAssessmentTypeSchema>;
export type AssessmentType = typeof assessmentTypes.$inferSelect;

// Student Grades table - Enter and manage student grades
export const studentGrades = pgTable("student_grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  studentId: varchar("student_id").references(() => schoolUsers.id, { onDelete: 'cascade' }).notNull(),
  classId: varchar("class_id").references(() => schoolClasses.id, { onDelete: 'cascade' }).notNull(),
  subjectId: varchar("subject_id").references(() => schoolSubjects.id, { onDelete: 'cascade' }).notNull(),
  termId: varchar("term_id").references(() => academicTerms.id, { onDelete: 'cascade' }).notNull(),
  assessmentTypeId: varchar("assessment_type_id").references(() => assessmentTypes.id, { onDelete: 'cascade' }).notNull(),
  score: integer("score").notNull(),
  maxScore: integer("max_score").notNull(),
  remarks: text("remarks"),
  gradedById: varchar("graded_by_id").references(() => schoolUsers.id),
  gradedAt: timestamp("graded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueGrade: index("unique_student_grade").on(table.studentId, table.subjectId, table.termId, table.assessmentTypeId),
}));

export const studentGradesRelations = relations(studentGrades, ({ one }) => ({
  school: one(schools, {
    fields: [studentGrades.schoolId],
    references: [schools.id],
  }),
  student: one(schoolUsers, {
    fields: [studentGrades.studentId],
    references: [schoolUsers.id],
  }),
  class: one(schoolClasses, {
    fields: [studentGrades.classId],
    references: [schoolClasses.id],
  }),
  subject: one(schoolSubjects, {
    fields: [studentGrades.subjectId],
    references: [schoolSubjects.id],
  }),
  term: one(academicTerms, {
    fields: [studentGrades.termId],
    references: [academicTerms.id],
  }),
  assessmentType: one(assessmentTypes, {
    fields: [studentGrades.assessmentTypeId],
    references: [assessmentTypes.id],
  }),
  gradedBy: one(schoolUsers, {
    fields: [studentGrades.gradedById],
    references: [schoolUsers.id],
  }),
}));

export const insertStudentGradeSchema = createInsertSchema(studentGrades).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  gradedAt: true,
});

export type InsertStudentGrade = z.infer<typeof insertStudentGradeSchema>;
export type StudentGrade = typeof studentGrades.$inferSelect;

// Term Results table - Calculate student term and final scores
export const termResults = pgTable("term_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  studentId: varchar("student_id").references(() => schoolUsers.id, { onDelete: 'cascade' }).notNull(),
  classId: varchar("class_id").references(() => schoolClasses.id, { onDelete: 'cascade' }).notNull(),
  subjectId: varchar("subject_id").references(() => schoolSubjects.id, { onDelete: 'cascade' }).notNull(),
  termId: varchar("term_id").references(() => academicTerms.id, { onDelete: 'cascade' }).notNull(),
  totalScore: integer("total_score").notNull(),
  grade: varchar("grade", { length: 5 }), // A, B, C, D, E, F
  gradePoint: real("grade_point"), // 4.0, 3.5, etc.
  remarks: text("remarks"),
  position: integer("position"), // Class position for subject
  classAverage: real("class_average"),
  highestScore: integer("highest_score"),
  lowestScore: integer("lowest_score"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueTermResult: index("unique_term_result").on(table.studentId, table.subjectId, table.termId),
}));

export const termResultsRelations = relations(termResults, ({ one }) => ({
  school: one(schools, {
    fields: [termResults.schoolId],
    references: [schools.id],
  }),
  student: one(schoolUsers, {
    fields: [termResults.studentId],
    references: [schoolUsers.id],
  }),
  class: one(schoolClasses, {
    fields: [termResults.classId],
    references: [schoolClasses.id],
  }),
  subject: one(schoolSubjects, {
    fields: [termResults.subjectId],
    references: [schoolSubjects.id],
  }),
  term: one(academicTerms, {
    fields: [termResults.termId],
    references: [academicTerms.id],
  }),
}));

export const insertTermResultSchema = createInsertSchema(termResults).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTermResult = z.infer<typeof insertTermResultSchema>;
export type TermResult = typeof termResults.$inferSelect;

// ============================================
// FEES & PAYMENTS TABLES
// ============================================

// Fee Types table - Define school fee types
export const feeTypes = pgTable("fee_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  name: varchar("name", { length: 100 }).notNull(), // Tuition Fee, Exam Fee, Lab Fee
  code: varchar("code", { length: 20 }),
  amount: integer("amount").notNull(), // Amount in kobo/cents
  description: text("description"),
  isRecurring: boolean("is_recurring").default(true).notNull(),
  frequency: varchar("frequency", { length: 20 }), // termly, yearly, one-time
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const feeTypesRelations = relations(feeTypes, ({ one }) => ({
  school: one(schools, {
    fields: [feeTypes.schoolId],
    references: [schools.id],
  }),
}));

export const insertFeeTypeSchema = createInsertSchema(feeTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFeeType = z.infer<typeof insertFeeTypeSchema>;
export type FeeType = typeof feeTypes.$inferSelect;

// Class Fees table - Assign fees to specific classes
export const classFees = pgTable("class_fees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").references(() => schoolClasses.id, { onDelete: 'cascade' }).notNull(),
  feeTypeId: varchar("fee_type_id").references(() => feeTypes.id, { onDelete: 'cascade' }).notNull(),
  termId: varchar("term_id").references(() => academicTerms.id),
  amount: integer("amount").notNull(), // Can override default fee amount
  dueDate: timestamp("due_date"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueClassFee: index("unique_class_fee").on(table.classId, table.feeTypeId, table.termId),
}));

export const classFeesRelations = relations(classFees, ({ one }) => ({
  class: one(schoolClasses, {
    fields: [classFees.classId],
    references: [schoolClasses.id],
  }),
  feeType: one(feeTypes, {
    fields: [classFees.feeTypeId],
    references: [feeTypes.id],
  }),
  term: one(academicTerms, {
    fields: [classFees.termId],
    references: [academicTerms.id],
  }),
}));

export const insertClassFeeSchema = createInsertSchema(classFees).omit({
  id: true,
  createdAt: true,
});

export type InsertClassFee = z.infer<typeof insertClassFeeSchema>;
export type ClassFee = typeof classFees.$inferSelect;

// Fee Payments table - Record school fee payments
export const feePayments = pgTable("fee_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  studentId: varchar("student_id").references(() => schoolUsers.id, { onDelete: 'cascade' }).notNull(),
  feeTypeId: varchar("fee_type_id").references(() => feeTypes.id).notNull(),
  termId: varchar("term_id").references(() => academicTerms.id),
  amount: integer("amount").notNull(), // Amount paid in kobo/cents
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(), // cash, bank_transfer, card, online, paystack
  paymentReference: varchar("payment_reference", { length: 100 }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  stripeSessionId: varchar("stripe_session_id"),
  paystackReference: varchar("paystack_reference", { length: 100 }),
  paystackAccessCode: varchar("paystack_access_code", { length: 100 }),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, completed, failed, refunded
  paidById: varchar("paid_by_id").references(() => schoolUsers.id), // Parent or student who paid
  receiptNumber: varchar("receipt_number", { length: 50 }),
  notes: text("notes"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const feePaymentsRelations = relations(feePayments, ({ one }) => ({
  school: one(schools, {
    fields: [feePayments.schoolId],
    references: [schools.id],
  }),
  student: one(schoolUsers, {
    fields: [feePayments.studentId],
    references: [schoolUsers.id],
    relationName: "studentPayments",
  }),
  feeType: one(feeTypes, {
    fields: [feePayments.feeTypeId],
    references: [feeTypes.id],
  }),
  term: one(academicTerms, {
    fields: [feePayments.termId],
    references: [academicTerms.id],
  }),
  paidBy: one(schoolUsers, {
    fields: [feePayments.paidById],
    references: [schoolUsers.id],
    relationName: "madePayments",
  }),
}));

export const insertFeePaymentSchema = createInsertSchema(feePayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  paidAt: true,
});

export type InsertFeePayment = z.infer<typeof insertFeePaymentSchema>;
export type FeePayment = typeof feePayments.$inferSelect;

// ============================================
// TIMETABLE TABLES
// ============================================

// Timetable Periods table - Define time slots
export const timetablePeriods = pgTable("timetable_periods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  name: varchar("name", { length: 50 }).notNull(), // Period 1, Break, Lunch
  startTime: varchar("start_time", { length: 10 }).notNull(), // HH:MM format
  endTime: varchar("end_time", { length: 10 }).notNull(),
  orderIndex: integer("order_index").notNull(),
  isBreak: boolean("is_break").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const timetablePeriodsRelations = relations(timetablePeriods, ({ one }) => ({
  school: one(schools, {
    fields: [timetablePeriods.schoolId],
    references: [schools.id],
  }),
}));

export const insertTimetablePeriodSchema = createInsertSchema(timetablePeriods).omit({
  id: true,
  createdAt: true,
});

export type InsertTimetablePeriod = z.infer<typeof insertTimetablePeriodSchema>;
export type TimetablePeriod = typeof timetablePeriods.$inferSelect;

// Timetable Entries table - Weekly schedule
export const timetableEntries = pgTable("timetable_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  classId: varchar("class_id").references(() => schoolClasses.id, { onDelete: 'cascade' }).notNull(),
  subjectId: varchar("subject_id").references(() => schoolSubjects.id, { onDelete: 'cascade' }),
  teacherId: varchar("teacher_id").references(() => schoolUsers.id),
  periodId: varchar("period_id").references(() => timetablePeriods.id, { onDelete: 'cascade' }).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  termId: varchar("term_id").references(() => academicTerms.id),
  room: varchar("room", { length: 50 }), // Room/Lab name
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueTimetableEntry: index("unique_timetable_entry").on(table.classId, table.periodId, table.dayOfWeek, table.termId),
}));

export const timetableEntriesRelations = relations(timetableEntries, ({ one }) => ({
  school: one(schools, {
    fields: [timetableEntries.schoolId],
    references: [schools.id],
  }),
  class: one(schoolClasses, {
    fields: [timetableEntries.classId],
    references: [schoolClasses.id],
  }),
  subject: one(schoolSubjects, {
    fields: [timetableEntries.subjectId],
    references: [schoolSubjects.id],
  }),
  teacher: one(schoolUsers, {
    fields: [timetableEntries.teacherId],
    references: [schoolUsers.id],
  }),
  period: one(timetablePeriods, {
    fields: [timetableEntries.periodId],
    references: [timetablePeriods.id],
  }),
  term: one(academicTerms, {
    fields: [timetableEntries.termId],
    references: [academicTerms.id],
  }),
}));

export const insertTimetableEntrySchema = createInsertSchema(timetableEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTimetableEntry = z.infer<typeof insertTimetableEntrySchema>;
export type TimetableEntry = typeof timetableEntries.$inferSelect;

// ============================================
// COMMUNICATION TABLES
// ============================================

// School Announcements table
export const schoolAnnouncements = pgTable("school_announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).default("general").notNull(), // general, urgent, event, holiday
  targetAudience: varchar("target_audience", { length: 50 }).default("all").notNull(), // all, students, teachers, parents
  targetClassIds: text("target_class_ids").array(), // Specific classes
  authorId: varchar("author_id").references(() => schoolUsers.id).notNull(),
  attachmentUrl: varchar("attachment_url"),
  isPublished: boolean("is_published").default(false).notNull(),
  publishedAt: timestamp("published_at"),
  expiresAt: timestamp("expires_at"),
  isPinned: boolean("is_pinned").default(false).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const schoolAnnouncementsRelations = relations(schoolAnnouncements, ({ one }) => ({
  school: one(schools, {
    fields: [schoolAnnouncements.schoolId],
    references: [schools.id],
  }),
  author: one(schoolUsers, {
    fields: [schoolAnnouncements.authorId],
    references: [schoolUsers.id],
  }),
}));

export const insertSchoolAnnouncementSchema = createInsertSchema(schoolAnnouncements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  publishedAt: true,
});

export type InsertSchoolAnnouncement = z.infer<typeof insertSchoolAnnouncementSchema>;
export type SchoolAnnouncement = typeof schoolAnnouncements.$inferSelect;

// School Notifications table - User-specific notifications within school
export const schoolNotifications = pgTable("school_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => schoolUsers.id, { onDelete: 'cascade' }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // fee_reminder, attendance, grade_update, announcement, etc.
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  link: varchar("link"),
  isRead: boolean("is_read").default(false).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const schoolNotificationsRelations = relations(schoolNotifications, ({ one }) => ({
  school: one(schools, {
    fields: [schoolNotifications.schoolId],
    references: [schools.id],
  }),
  user: one(schoolUsers, {
    fields: [schoolNotifications.userId],
    references: [schoolUsers.id],
  }),
}));

export const insertSchoolNotificationSchema = createInsertSchema(schoolNotifications).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

export type InsertSchoolNotification = z.infer<typeof insertSchoolNotificationSchema>;
export type SchoolNotification = typeof schoolNotifications.$inferSelect;

// ============================================
// SCHOOL RESOURCES TABLES
// ============================================

// School Materials table - Private school resource library
export const schoolMaterials = pgTable("school_materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  fileUrl: varchar("file_url").notNull(),
  fileType: varchar("file_type", { length: 50 }), // pdf, doc, video, etc.
  fileSize: integer("file_size"), // Size in bytes
  originalFilename: varchar("original_filename", { length: 255 }),
  subjectId: varchar("subject_id").references(() => schoolSubjects.id),
  classId: varchar("class_id").references(() => schoolClasses.id),
  uploadedById: varchar("uploaded_by_id").references(() => schoolUsers.id).notNull(),
  isPublic: boolean("is_public").default(false).notNull(), // Visible to all in school
  viewCount: integer("view_count").default(0).notNull(),
  downloadCount: integer("download_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const schoolMaterialsRelations = relations(schoolMaterials, ({ one }) => ({
  school: one(schools, {
    fields: [schoolMaterials.schoolId],
    references: [schools.id],
  }),
  subject: one(schoolSubjects, {
    fields: [schoolMaterials.subjectId],
    references: [schoolSubjects.id],
  }),
  class: one(schoolClasses, {
    fields: [schoolMaterials.classId],
    references: [schoolClasses.id],
  }),
  uploadedBy: one(schoolUsers, {
    fields: [schoolMaterials.uploadedById],
    references: [schoolUsers.id],
  }),
}));

export const insertSchoolMaterialSchema = createInsertSchema(schoolMaterials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  downloadCount: true,
});

export type InsertSchoolMaterial = z.infer<typeof insertSchoolMaterialSchema>;
export type SchoolMaterial = typeof schoolMaterials.$inferSelect;

// ============================================
// SUBSCRIPTION PAYMENTS TABLE
// Track school subscription payments
// ============================================

export const subscriptionPayments = pgTable("subscription_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  planId: varchar("plan_id").references(() => subscriptionPlans.id).notNull(),
  
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 3 }).default("NGN").notNull(),
  
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  
  paystackReference: varchar("paystack_reference").unique(),
  paystackAccessCode: varchar("paystack_access_code"),
  paystackTransactionId: varchar("paystack_transaction_id"),
  
  billingPeriod: varchar("billing_period", { length: 20 }).notNull(),
  periodStartDate: timestamp("period_start_date"),
  periodEndDate: timestamp("period_end_date"),
  
  paidById: varchar("paid_by_id").references(() => schoolUsers.id),
  paidAt: timestamp("paid_at"),
  
  invoiceNumber: varchar("invoice_number", { length: 50 }),
  
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptionPaymentsRelations = relations(subscriptionPayments, ({ one }) => ({
  school: one(schools, {
    fields: [subscriptionPayments.schoolId],
    references: [schools.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptionPayments.planId],
    references: [subscriptionPlans.id],
  }),
  paidBy: one(schoolUsers, {
    fields: [subscriptionPayments.paidById],
    references: [schoolUsers.id],
  }),
}));

export const insertSubscriptionPaymentSchema = createInsertSchema(subscriptionPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  paidAt: true,
});

export type InsertSubscriptionPayment = z.infer<typeof insertSubscriptionPaymentSchema>;
export type SubscriptionPayment = typeof subscriptionPayments.$inferSelect;

// ============================================
// PARENT-TEACHER MESSAGING SYSTEM
// Enables communication between parents and teachers
// ============================================

export const schoolConversations = pgTable("school_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  
  parentId: varchar("parent_id").references(() => schoolUsers.id, { onDelete: 'cascade' }).notNull(),
  teacherId: varchar("teacher_id").references(() => schoolUsers.id, { onDelete: 'cascade' }).notNull(),
  studentId: varchar("student_id").references(() => schoolUsers.id, { onDelete: 'cascade' }),
  
  subject: varchar("subject", { length: 255 }),
  
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  parentUnreadCount: integer("parent_unread_count").default(0).notNull(),
  teacherUnreadCount: integer("teacher_unread_count").default(0).notNull(),
  
  status: varchar("status", { length: 20 }).default("active").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const schoolConversationsRelations = relations(schoolConversations, ({ one, many }) => ({
  school: one(schools, {
    fields: [schoolConversations.schoolId],
    references: [schools.id],
  }),
  parent: one(schoolUsers, {
    fields: [schoolConversations.parentId],
    references: [schoolUsers.id],
    relationName: "parentConversations",
  }),
  teacher: one(schoolUsers, {
    fields: [schoolConversations.teacherId],
    references: [schoolUsers.id],
    relationName: "teacherConversations",
  }),
  student: one(schoolUsers, {
    fields: [schoolConversations.studentId],
    references: [schoolUsers.id],
    relationName: "studentConversations",
  }),
  messages: many(schoolMessages),
}));

export const insertSchoolConversationSchema = createInsertSchema(schoolConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastMessageAt: true,
  parentUnreadCount: true,
  teacherUnreadCount: true,
});

export type InsertSchoolConversation = z.infer<typeof insertSchoolConversationSchema>;
export type SchoolConversation = typeof schoolConversations.$inferSelect;

export const schoolMessages = pgTable("school_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => schoolConversations.id, { onDelete: 'cascade' }).notNull(),
  
  senderId: varchar("sender_id").references(() => schoolUsers.id, { onDelete: 'cascade' }).notNull(),
  senderType: varchar("sender_type", { length: 20 }).notNull(),
  
  content: text("content").notNull(),
  
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  
  attachmentUrl: varchar("attachment_url"),
  attachmentType: varchar("attachment_type", { length: 50 }),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const schoolMessagesRelations = relations(schoolMessages, ({ one }) => ({
  conversation: one(schoolConversations, {
    fields: [schoolMessages.conversationId],
    references: [schoolConversations.id],
  }),
  sender: one(schoolUsers, {
    fields: [schoolMessages.senderId],
    references: [schoolUsers.id],
  }),
}));

export const insertSchoolMessageSchema = createInsertSchema(schoolMessages).omit({
  id: true,
  createdAt: true,
  isRead: true,
  readAt: true,
});

export type InsertSchoolMessage = z.infer<typeof insertSchoolMessageSchema>;
export type SchoolMessage = typeof schoolMessages.$inferSelect;

// ============================================
// SUPER ADMIN ACTIVITY FEED
// Tracks platform-wide activities for real-time monitoring
// ============================================

export const platformActivityFeed = pgTable("platform_activity_feed", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  activityType: varchar("activity_type", { length: 50 }).notNull(),
  
  platform: varchar("platform", { length: 10 }).notNull(),
  
  entityType: varchar("entity_type", { length: 50 }),
  entityId: varchar("entity_id"),
  entityName: varchar("entity_name"),
  
  actorId: varchar("actor_id").references(() => users.id, { onDelete: 'set null' }),
  actorType: varchar("actor_type", { length: 20 }),
  actorName: varchar("actor_name"),
  actorEmail: varchar("actor_email"),
  
  schoolId: varchar("school_id").references(() => schools.id, { onDelete: 'set null' }),
  schoolName: varchar("school_name"),
  
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  
  severity: varchar("severity", { length: 20 }).default("info").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_activity_feed_created").on(table.createdAt),
  index("IDX_activity_feed_platform").on(table.platform),
  index("IDX_activity_feed_school").on(table.schoolId),
  index("IDX_activity_feed_type").on(table.activityType),
  index("IDX_activity_feed_actor").on(table.actorId),
]);

export const platformActivityFeedRelations = relations(platformActivityFeed, ({ one }) => ({
  school: one(schools, {
    fields: [platformActivityFeed.schoolId],
    references: [schools.id],
  }),
  actor: one(users, {
    fields: [platformActivityFeed.actorId],
    references: [users.id],
  }),
}));

export const insertPlatformActivityFeedSchema = createInsertSchema(platformActivityFeed).omit({
  id: true,
  createdAt: true,
});

export type InsertPlatformActivityFeed = z.infer<typeof insertPlatformActivityFeedSchema>;
export type PlatformActivityFeed = typeof platformActivityFeed.$inferSelect;
export type SelectPlatformActivityFeed = typeof platformActivityFeed.$inferSelect;

// ============================================
// SUPER ADMIN IMPERSONATION LOGS
// Tracks when super admin impersonates school admins
// ============================================

export const impersonationLogs = pgTable("impersonation_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  superAdminId: varchar("super_admin_id").references(() => users.id, { onDelete: 'set null' }).notNull(),
  superAdminEmail: varchar("super_admin_email").notNull(),
  
  targetSchoolId: varchar("target_school_id").references(() => schools.id, { onDelete: 'set null' }).notNull(),
  targetSchoolName: varchar("target_school_name").notNull(),
  targetUserId: varchar("target_user_id").references(() => schoolUsers.id, { onDelete: 'set null' }),
  targetUserEmail: varchar("target_user_email"),
  targetUserRole: varchar("target_user_role", { length: 20 }),
  
  action: varchar("action", { length: 20 }).notNull(),
  
  reason: text("reason"),
  
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  
  sessionToken: varchar("session_token"),
  
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_impersonation_super_admin").on(table.superAdminId),
  index("IDX_impersonation_school").on(table.targetSchoolId),
  index("IDX_impersonation_created").on(table.createdAt),
]);

export const impersonationLogsRelations = relations(impersonationLogs, ({ one }) => ({
  superAdmin: one(users, {
    fields: [impersonationLogs.superAdminId],
    references: [users.id],
  }),
  targetSchool: one(schools, {
    fields: [impersonationLogs.targetSchoolId],
    references: [schools.id],
  }),
  targetUser: one(schoolUsers, {
    fields: [impersonationLogs.targetUserId],
    references: [schoolUsers.id],
  }),
}));

export const insertImpersonationLogSchema = createInsertSchema(impersonationLogs).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  endedAt: true,
});

export type InsertImpersonationLog = z.infer<typeof insertImpersonationLogSchema>;
export type ImpersonationLog = typeof impersonationLogs.$inferSelect;
export type SelectImpersonationLog = typeof impersonationLogs.$inferSelect;

// Active User Sessions - for tracking and managing live sessions
export const userActiveSessions = pgTable("user_active_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // User info (supports both LMS users and SMS school users)
  userId: varchar("user_id"),
  userEmail: varchar("user_email").notNull(),
  userRole: varchar("user_role", { length: 50 }),
  userName: varchar("user_name"),
  
  // Platform info
  platform: varchar("platform", { length: 10 }).notNull(), // 'lms' or 'sms'
  schoolId: varchar("school_id").references(() => schools.id, { onDelete: 'cascade' }),
  schoolName: varchar("school_name"),
  
  // Session details
  sessionId: varchar("session_id").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  deviceType: varchar("device_type", { length: 20 }), // 'desktop', 'mobile', 'tablet'
  browser: varchar("browser", { length: 50 }),
  os: varchar("os", { length: 50 }),
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  terminatedAt: timestamp("terminated_at"),
  terminatedBy: varchar("terminated_by"), // super admin who terminated
  terminationReason: text("termination_reason"),
}, (table) => [
  index("IDX_active_sessions_user").on(table.userId),
  index("IDX_active_sessions_school").on(table.schoolId),
  index("IDX_active_sessions_platform").on(table.platform),
  index("IDX_active_sessions_active").on(table.isActive),
  index("IDX_active_sessions_session").on(table.sessionId),
  index("IDX_active_sessions_created").on(table.createdAt),
]);

export const userActiveSessionsRelations = relations(userActiveSessions, ({ one }) => ({
  school: one(schools, {
    fields: [userActiveSessions.schoolId],
    references: [schools.id],
  }),
}));

export const insertUserActiveSessionSchema = createInsertSchema(userActiveSessions).omit({
  id: true,
  createdAt: true,
  lastActivityAt: true,
});

export type InsertUserActiveSession = z.infer<typeof insertUserActiveSessionSchema>;
export type UserActiveSession = typeof userActiveSessions.$inferSelect;

// Security Events - for logging security-related events
export const securityEvents = pgTable("security_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Event type
  eventType: varchar("event_type", { length: 50 }).notNull(),
  // Types: login_failed, login_success, password_reset_requested, password_changed,
  // account_locked, account_unlocked, suspicious_activity, session_hijack_attempt,
  // brute_force_detected, ip_blocked, mfa_failed, permission_denied
  
  // Severity level
  severity: varchar("severity", { length: 20 }).default("info").notNull(),
  // info, warning, error, critical
  
  // Platform info
  platform: varchar("platform", { length: 10 }).notNull(), // 'lms' or 'sms'
  schoolId: varchar("school_id").references(() => schools.id, { onDelete: 'set null' }),
  schoolName: varchar("school_name"),
  
  // Target user info
  targetUserId: varchar("target_user_id"),
  targetUserEmail: varchar("target_user_email"),
  targetUserRole: varchar("target_user_role", { length: 50 }),
  
  // Actor info (who performed the action - could be same as target or admin)
  actorId: varchar("actor_id"),
  actorEmail: varchar("actor_email"),
  actorRole: varchar("actor_role", { length: 50 }),
  
  // Event details
  description: text("description").notNull(),
  metadata: jsonb("metadata"), // Additional context (attempt count, blocked duration, etc.)
  
  // Request info
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  requestPath: varchar("request_path"),
  requestMethod: varchar("request_method", { length: 10 }),
  
  // Resolution
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by"),
  resolutionNotes: text("resolution_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_security_events_type").on(table.eventType),
  index("IDX_security_events_severity").on(table.severity),
  index("IDX_security_events_platform").on(table.platform),
  index("IDX_security_events_school").on(table.schoolId),
  index("IDX_security_events_target").on(table.targetUserId),
  index("IDX_security_events_ip").on(table.ipAddress),
  index("IDX_security_events_created").on(table.createdAt),
  index("IDX_security_events_resolved").on(table.isResolved),
]);

export const securityEventsRelations = relations(securityEvents, ({ one }) => ({
  school: one(schools, {
    fields: [securityEvents.schoolId],
    references: [schools.id],
  }),
}));

export const insertSecurityEventSchema = createInsertSchema(securityEvents).omit({
  id: true,
  createdAt: true,
  isResolved: true,
  resolvedAt: true,
  resolvedBy: true,
  resolutionNotes: true,
});

export type InsertSecurityEvent = z.infer<typeof insertSecurityEventSchema>;
export type SecurityEvent = typeof securityEvents.$inferSelect;

// ============================================
// LEARNING ENHANCEMENT FEATURES
// ============================================

// Badges - Achievement definitions
export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(), // lucide icon name
  category: varchar("category", { length: 50 }).notNull(), // quiz, streak, learning, social, milestone
  xpReward: integer("xp_reward").default(0).notNull(),
  
  // Unlock conditions (stored as JSON for flexibility)
  unlockCondition: jsonb("unlock_condition").notNull(),
  // Example conditions:
  // { type: "quiz_count", value: 1 } - Complete 1 quiz
  // { type: "streak_days", value: 7 } - 7-day streak
  // { type: "quiz_score", value: 100, count: 5 } - 5 perfect scores
  // { type: "materials_viewed", value: 50 } - View 50 materials
  
  rarity: varchar("rarity", { length: 20 }).default("common").notNull(), // common, uncommon, rare, epic, legendary
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
});

export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

// User Badges - Earned achievements
export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  badgeId: varchar("badge_id").references(() => badges.id, { onDelete: 'cascade' }).notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  notified: boolean("notified").default(false), // Whether user was notified
}, (table) => [
  index("IDX_user_badges_user").on(table.userId),
  index("IDX_user_badges_badge").on(table.badgeId),
]);

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
});

export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;

// User Gamification - XP, levels, and points
export const userGamification = pgTable("user_gamification", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").unique().references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Experience points
  totalXp: integer("total_xp").default(0).notNull(),
  weeklyXp: integer("weekly_xp").default(0).notNull(),
  monthlyXp: integer("monthly_xp").default(0).notNull(),
  
  // Level system (calculated from totalXp)
  level: integer("level").default(1).notNull(),
  
  // Streak tracking
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastActivityDate: timestamp("last_activity_date"),
  
  // Activity counts for badge checking
  quizzesCompleted: integer("quizzes_completed").default(0).notNull(),
  perfectScores: integer("perfect_scores").default(0).notNull(),
  materialsViewed: integer("materials_viewed").default(0).notNull(),
  reviewsCompleted: integer("reviews_completed").default(0).notNull(),
  
  // Weekly reset tracking
  weekStartDate: timestamp("week_start_date"),
  monthStartDate: timestamp("month_start_date"),
  
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_user_gamification_user").on(table.userId),
  index("IDX_user_gamification_xp").on(table.totalXp),
  index("IDX_user_gamification_level").on(table.level),
  index("IDX_user_gamification_weekly_xp").on(table.weeklyXp),
]);

export const userGamificationRelations = relations(userGamification, ({ one }) => ({
  user: one(users, {
    fields: [userGamification.userId],
    references: [users.id],
  }),
}));

export const insertUserGamificationSchema = createInsertSchema(userGamification).omit({
  id: true,
  updatedAt: true,
});

export type InsertUserGamification = z.infer<typeof insertUserGamificationSchema>;
export type UserGamification = typeof userGamification.$inferSelect;

// XP Transactions - Log of all XP earned
export const xpTransactions = pgTable("xp_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  amount: integer("amount").notNull(),
  source: varchar("source", { length: 50 }).notNull(), // quiz_complete, perfect_score, streak_bonus, badge_earned, material_view, review_complete
  sourceId: varchar("source_id"), // Related entity ID (quizId, badgeId, etc.)
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_xp_transactions_user").on(table.userId),
  index("IDX_xp_transactions_source").on(table.source),
  index("IDX_xp_transactions_created").on(table.createdAt),
]);

export const xpTransactionsRelations = relations(xpTransactions, ({ one }) => ({
  user: one(users, {
    fields: [xpTransactions.userId],
    references: [users.id],
  }),
}));

export const insertXpTransactionSchema = createInsertSchema(xpTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertXpTransaction = z.infer<typeof insertXpTransactionSchema>;
export type XpTransaction = typeof xpTransactions.$inferSelect;

// Spaced Repetition Cards - For memory retention
export const spacedRepetitionCards = pgTable("spaced_repetition_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Card content
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  
  // Source tracking
  sourceType: varchar("source_type", { length: 20 }).notNull(), // quiz, material, manual
  sourceId: varchar("source_id"), // quizQuestionId, materialId, etc.
  courseId: varchar("course_id").references(() => courses.id, { onDelete: 'set null' }),
  topic: varchar("topic", { length: 255 }),
  
  // SM-2 Algorithm fields
  easeFactor: real("ease_factor").default(2.5).notNull(), // Initial ease factor
  interval: integer("interval").default(1).notNull(), // Days until next review
  repetitions: integer("repetitions").default(0).notNull(), // Successful reviews in a row
  
  // Scheduling
  nextReviewDate: timestamp("next_review_date").defaultNow().notNull(),
  lastReviewDate: timestamp("last_review_date"),
  
  // Stats
  totalReviews: integer("total_reviews").default(0).notNull(),
  correctReviews: integer("correct_reviews").default(0).notNull(),
  
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_sr_cards_user").on(table.userId),
  index("IDX_sr_cards_next_review").on(table.nextReviewDate),
  index("IDX_sr_cards_course").on(table.courseId),
  index("IDX_sr_cards_source").on(table.sourceType, table.sourceId),
]);

export const spacedRepetitionCardsRelations = relations(spacedRepetitionCards, ({ one }) => ({
  user: one(users, {
    fields: [spacedRepetitionCards.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [spacedRepetitionCards.courseId],
    references: [courses.id],
  }),
}));

export const insertSpacedRepetitionCardSchema = createInsertSchema(spacedRepetitionCards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSpacedRepetitionCard = z.infer<typeof insertSpacedRepetitionCardSchema>;
export type SpacedRepetitionCard = typeof spacedRepetitionCards.$inferSelect;

// Learning Recommendations - Personalized suggestions
export const learningRecommendations = pgTable("learning_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Recommendation type and target
  type: varchar("type", { length: 30 }).notNull(), // material, quiz, course, review
  targetId: varchar("target_id").notNull(), // ID of the recommended item
  targetTitle: varchar("target_title", { length: 255 }).notNull(),
  
  // Context
  reason: text("reason").notNull(), // Why this was recommended
  priority: integer("priority").default(50).notNull(), // 1-100, higher = more important
  courseId: varchar("course_id").references(() => courses.id, { onDelete: 'set null' }),
  
  // Performance context
  relatedScore: integer("related_score"), // Quiz score that triggered this
  weakTopics: text("weak_topics").array(), // Topics user struggled with
  
  // Status
  status: varchar("status", { length: 20 }).default("active").notNull(), // active, viewed, completed, dismissed
  viewedAt: timestamp("viewed_at"),
  completedAt: timestamp("completed_at"),
  dismissedAt: timestamp("dismissed_at"),
  
  expiresAt: timestamp("expires_at"), // Recommendations can expire
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_recommendations_user").on(table.userId),
  index("IDX_recommendations_status").on(table.status),
  index("IDX_recommendations_type").on(table.type),
  index("IDX_recommendations_priority").on(table.priority),
]);

export const learningRecommendationsRelations = relations(learningRecommendations, ({ one }) => ({
  user: one(users, {
    fields: [learningRecommendations.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [learningRecommendations.courseId],
    references: [courses.id],
  }),
}));

export const insertLearningRecommendationSchema = createInsertSchema(learningRecommendations).omit({
  id: true,
  createdAt: true,
  viewedAt: true,
  completedAt: true,
  dismissedAt: true,
});

export type InsertLearningRecommendation = z.infer<typeof insertLearningRecommendationSchema>;
export type LearningRecommendation = typeof learningRecommendations.$inferSelect;

// Daily Study Logs - Track daily activity for streak calculation
export const dailyStudyLogs = pgTable("daily_study_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: timestamp("date").notNull(), // The calendar date (normalized to midnight UTC)
  
  // Activity counts for the day
  quizzesTaken: integer("quizzes_taken").default(0).notNull(),
  materialsViewed: integer("materials_viewed").default(0).notNull(),
  reviewsCompleted: integer("reviews_completed").default(0).notNull(),
  xpEarned: integer("xp_earned").default(0).notNull(),
  
  // Time tracking
  studyMinutes: integer("study_minutes").default(0).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_daily_study_user").on(table.userId),
  index("IDX_daily_study_date").on(table.date),
]);

export const dailyStudyLogsRelations = relations(dailyStudyLogs, ({ one }) => ({
  user: one(users, {
    fields: [dailyStudyLogs.userId],
    references: [users.id],
  }),
}));

export const insertDailyStudyLogSchema = createInsertSchema(dailyStudyLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDailyStudyLog = z.infer<typeof insertDailyStudyLogSchema>;
export type DailyStudyLog = typeof dailyStudyLogs.$inferSelect;

// ============================================
// STUDY GROUPS - Peer Collaboration
// ============================================

// Study Groups - For collaborative learning
export const studyGroups = pgTable("study_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  courseId: varchar("course_id").references(() => courses.id, { onDelete: 'set null' }),
  
  // Group settings
  isPublic: boolean("is_public").default(true).notNull(), // Can others join without invite
  maxMembers: integer("max_members").default(10),
  
  // Creator/owner
  createdById: varchar("created_by_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Activity tracking
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  totalXpEarned: integer("total_xp_earned").default(0).notNull(),
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_study_groups_course").on(table.courseId),
  index("IDX_study_groups_creator").on(table.createdById),
  index("IDX_study_groups_public").on(table.isPublic),
]);

export const studyGroupsRelations = relations(studyGroups, ({ one, many }) => ({
  course: one(courses, {
    fields: [studyGroups.courseId],
    references: [courses.id],
  }),
  createdBy: one(users, {
    fields: [studyGroups.createdById],
    references: [users.id],
  }),
  members: many(studyGroupMembers),
  messages: many(studyGroupMessages),
}));

export const insertStudyGroupSchema = createInsertSchema(studyGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastActivityAt: true,
  totalXpEarned: true,
});

export type InsertStudyGroup = z.infer<typeof insertStudyGroupSchema>;
export type StudyGroup = typeof studyGroups.$inferSelect;

// Study Group Members - Track membership and roles
export const studyGroupMembers = pgTable("study_group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").references(() => studyGroups.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Role in group
  role: varchar("role", { length: 20 }).default("member").notNull(), // owner, admin, member
  
  // Contribution tracking
  xpContributed: integer("xp_contributed").default(0).notNull(),
  messagesCount: integer("messages_count").default(0).notNull(),
  
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
}, (table) => [
  index("IDX_study_group_members_group").on(table.groupId),
  index("IDX_study_group_members_user").on(table.userId),
]);

export const studyGroupMembersRelations = relations(studyGroupMembers, ({ one }) => ({
  group: one(studyGroups, {
    fields: [studyGroupMembers.groupId],
    references: [studyGroups.id],
  }),
  user: one(users, {
    fields: [studyGroupMembers.userId],
    references: [users.id],
  }),
}));

export const insertStudyGroupMemberSchema = createInsertSchema(studyGroupMembers).omit({
  id: true,
  joinedAt: true,
  lastActiveAt: true,
  xpContributed: true,
  messagesCount: true,
});

export type InsertStudyGroupMember = z.infer<typeof insertStudyGroupMemberSchema>;
export type StudyGroupMember = typeof studyGroupMembers.$inferSelect;

// Study Group Messages - Chat/discussion within groups
export const studyGroupMessages = pgTable("study_group_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").references(() => studyGroups.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  content: text("content").notNull(),
  
  // Optional attachment (for sharing materials)
  attachmentType: varchar("attachment_type", { length: 20 }), // material, quiz, link
  attachmentId: varchar("attachment_id"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_study_group_messages_group").on(table.groupId),
  index("IDX_study_group_messages_user").on(table.userId),
  index("IDX_study_group_messages_created").on(table.createdAt),
]);

export const studyGroupMessagesRelations = relations(studyGroupMessages, ({ one }) => ({
  group: one(studyGroups, {
    fields: [studyGroupMessages.groupId],
    references: [studyGroups.id],
  }),
  user: one(users, {
    fields: [studyGroupMessages.userId],
    references: [users.id],
  }),
}));

export const insertStudyGroupMessageSchema = createInsertSchema(studyGroupMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertStudyGroupMessage = z.infer<typeof insertStudyGroupMessageSchema>;
export type StudyGroupMessage = typeof studyGroupMessages.$inferSelect;
