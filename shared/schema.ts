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
  role: varchar("role", { length: 20 }), // student, instructor, institution, admin - null until onboarding
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
  
  // Instructor-specific fields
  specialization: text("specialization").array(),
  yearsOfExperience: integer("years_of_experience"),
  teachingSubjects: text("teaching_subjects").array(),
  qualifications: text("qualifications").array(),
  teachingMethods: text("teaching_methods").array(),
  
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
  description: text("description"),
  logoUrl: varchar("logo_url"),
  website: varchar("website"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const institutionsRelations = relations(institutions, ({ many }) => ({
  users: many(users),
  courses: many(courses),
  programmes: many(programmes),
}));

export const insertInstitutionSchema = createInsertSchema(institutions).omit({
  id: true,
  createdAt: true,
});

export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;
export type Institution = typeof institutions.$inferSelect;

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
  instructorId: varchar("instructor_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const coursesRelations = relations(courses, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [courses.institutionId],
    references: [institutions.id],
  }),
  instructor: one(users, {
    fields: [courses.instructorId],
    references: [users.id],
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

// Blog Posts table
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImageUrl: varchar("cover_image_url"),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  published: boolean("published").default(false).notNull(),
  publishedAt: timestamp("published_at"),
  tags: text("tags").array(),
  category: varchar("category", { length: 100 }), // Study Tips, Success Stories, Platform Updates, Academic Resources, etc.
  featured: boolean("featured").default(false).notNull(), // Featured posts for homepage
  commentsEnabled: boolean("comments_enabled").default(true).notNull(), // Allow admin to turn comments on/off
  readTime: integer("read_time"), // in minutes
  viewCount: integer("view_count").default(0).notNull(),
  // SEO Metadata fields
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords").array(),
  ogTitle: varchar("og_title", { length: 255 }),
  ogDescription: text("og_description"),
  ogImage: varchar("og_image"),
  twitterCard: varchar("twitter_card", { length: 50 }),
  // Scheduling
  scheduledPublishAt: timestamp("scheduled_publish_at"),
  // Author info
  authorName: varchar("author_name", { length: 255 }),
  authorBio: text("author_bio"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
  comments: many(blogComments),
  likes: many(blogPostLikes),
  bookmarks: many(blogPostBookmarks),
}));

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  featured: true,
  commentsEnabled: true,
  publishedAt: true,
  scheduledPublishAt: true,
}).extend({
  title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters"),
  slug: z.string().min(1, "Slug is required").max(255, "Slug must be less than 255 characters").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL-friendly (lowercase, numbers, hyphens)"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  commentsEnabled: z.boolean().optional(),
  published: z.boolean().optional(),
  metaDescription: z.string().max(160, "Meta description should be under 160 characters").optional(),
  metaKeywords: z.array(z.string()).optional(),
  ogTitle: z.string().max(255).optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  twitterCard: z.enum(["summary", "summary_large_image", "app", "player"]).optional(),
  authorName: z.string().max(255).optional(),
  authorBio: z.string().optional(),
});

export const updateBlogPostSchema = insertBlogPostSchema.partial();

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type UpdateBlogPost = z.infer<typeof updateBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

// Blog Comments table
export const blogComments = pgTable("blog_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => blogPosts.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  parentId: varchar("parent_id").references((): any => blogComments.id, { onDelete: 'cascade' }),
  approved: boolean("approved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const blogCommentsRelations = relations(blogComments, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogComments.postId],
    references: [blogPosts.id],
  }),
  user: one(users, {
    fields: [blogComments.userId],
    references: [users.id],
  }),
}));

export const insertBlogCommentSchema = createInsertSchema(blogComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment must be less than 1000 characters"),
});

export type InsertBlogComment = z.infer<typeof insertBlogCommentSchema>;
export type BlogComment = typeof blogComments.$inferSelect;

// Blog Post Likes table
export const blogPostLikes = pgTable("blog_post_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => blogPosts.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserPost: index("unique_user_post_like").on(table.userId, table.postId),
}));

export const blogPostLikesRelations = relations(blogPostLikes, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogPostLikes.postId],
    references: [blogPosts.id],
  }),
  user: one(users, {
    fields: [blogPostLikes.userId],
    references: [users.id],
  }),
}));

export const insertBlogPostLikeSchema = createInsertSchema(blogPostLikes).omit({
  id: true,
  createdAt: true,
});

export type InsertBlogPostLike = z.infer<typeof insertBlogPostLikeSchema>;
export type BlogPostLike = typeof blogPostLikes.$inferSelect;

// Blog Post Bookmarks/Saved Posts table
export const blogPostBookmarks = pgTable("blog_post_bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => blogPosts.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserPostBookmark: index("unique_user_post_bookmark").on(table.userId, table.postId),
}));

export const blogPostBookmarksRelations = relations(blogPostBookmarks, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogPostBookmarks.postId],
    references: [blogPosts.id],
  }),
  user: one(users, {
    fields: [blogPostBookmarks.userId],
    references: [users.id],
  }),
}));

export const insertBlogPostBookmarkSchema = createInsertSchema(blogPostBookmarks).omit({
  id: true,
  createdAt: true,
});

export type InsertBlogPostBookmark = z.infer<typeof insertBlogPostBookmarkSchema>;
export type BlogPostBookmark = typeof blogPostBookmarks.$inferSelect;

// Blog Categories table - For managing available categories
export const blogCategories = pgTable("blog_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).unique().notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }), // Hex color code
  parentId: varchar("parent_id"), // For hierarchical categories
  displayOrder: integer("display_order").default(0).notNull(), // For drag-and-drop ordering
  isDefault: boolean("is_default").default(false).notNull(), // Predefined categories
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBlogCategorySchema = createInsertSchema(blogCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Category name is required").max(100, "Category name must be less than 100 characters"),
  slug: z.string().min(1, "Slug is required").max(100, "Slug must be less than 100 characters").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL-friendly (lowercase, numbers, hyphens)"),
});

export const updateBlogCategorySchema = insertBlogCategorySchema.partial();

export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;
export type UpdateBlogCategory = z.infer<typeof updateBlogCategorySchema>;
export type BlogCategory = typeof blogCategories.$inferSelect;

// Blog Tags table - For managing available tags
export const blogTags = pgTable("blog_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 50 }).unique().notNull(),
  slug: varchar("slug", { length: 50 }).unique().notNull(),
  color: varchar("color", { length: 7 }), // Hex color code
  usageCount: integer("usage_count").default(0).notNull(), // Track how many posts use this tag
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBlogTagSchema = createInsertSchema(blogTags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
}).extend({
  name: z.string().min(1, "Tag name is required").max(50, "Tag name must be less than 50 characters"),
  slug: z.string().min(1, "Slug is required").max(50, "Slug must be less than 50 characters").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL-friendly (lowercase, numbers, hyphens)"),
});

export const updateBlogTagSchema = insertBlogTagSchema.partial();

export type InsertBlogTag = z.infer<typeof insertBlogTagSchema>;
export type UpdateBlogTag = z.infer<typeof updateBlogTagSchema>;
export type BlogTag = typeof blogTags.$inferSelect;

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
  blogPostsCreated: integer("blog_posts_created").default(0).notNull(),
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
