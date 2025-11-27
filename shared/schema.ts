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
  date: timestamp("date").notNull(),
  status: varchar("status", { length: 20 }).notNull(), // present, absent, late, excused
  markedById: varchar("marked_by_id").references(() => schoolUsers.id),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueAttendance: index("unique_student_attendance").on(table.studentId, table.classId, table.date),
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
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(), // cash, bank_transfer, card, online
  paymentReference: varchar("payment_reference", { length: 100 }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  stripeSessionId: varchar("stripe_session_id"),
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
