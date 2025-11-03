// Referenced from javascript_database and javascript_log_in_with_replit blueprints
import {
  users,
  institutions,
  institutionReviews,
  programmes,
  courses,
  materials,
  quizzes,
  quizQuestions,
  quizAttempts,
  bookmarks,
  materialReviews,
  materialRatings,
  materialReports,
  blogPosts,
  blogComments,
  blogPostLikes,
  blogPostBookmarks,
  blogCategories,
  blogTags,
  type User,
  type UpsertUser,
  type Institution,
  type InsertInstitution,
  type InstitutionReview,
  type InsertInstitutionReview,
  type Programme,
  type InsertProgramme,
  type Course,
  type InsertCourse,
  type Material,
  type InsertMaterial,
  type Quiz,
  type InsertQuiz,
  type QuizQuestion,
  type InsertQuizQuestion,
  type QuizAttempt,
  type InsertQuizAttempt,
  type Bookmark,
  type InsertBookmark,
  type MaterialReview,
  type InsertMaterialReview,
  type MaterialRating,
  type InsertMaterialRating,
  type MaterialReport,
  type InsertMaterialReport,
  type BlogPost,
  type InsertBlogPost,
  type UpdateBlogPost,
  type BlogComment,
  type InsertBlogComment,
  type BlogPostLike,
  type InsertBlogPostLike,
  type BlogPostBookmark,
  type InsertBlogPostBookmark,
  type BlogCategory,
  type InsertBlogCategory,
  type UpdateBlogCategory,
  type BlogTag,
  type InsertBlogTag,
  type UpdateBlogTag,
  notifications,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  
  // Institution operations
  getInstitutions(): Promise<Institution[]>;
  getInstitution(id: string): Promise<Institution | undefined>;
  getInstitutionBySlug(slug: string): Promise<Institution | undefined>;
  createInstitution(institution: InsertInstitution): Promise<Institution>;
  updateInstitution(id: string, institution: Partial<InsertInstitution>): Promise<Institution | undefined>;
  bulkCreateInstitutions(institutionsData: InsertInstitution[]): Promise<{ added: number; skipped: number; errors: string[] }>;
  createInstitutionWithOwner(institutionData: InsertInstitution, userId: string, onboardingData: Partial<UpsertUser>): Promise<{ institution: Institution; user: User }>;
  getUsersByInstitution(institutionId: string): Promise<User[]>;
  getInstructorsByInstitution(institutionId: string): Promise<User[]>;
  getStudentsByInstitution(institutionId: string): Promise<User[]>;
  
  // Institution Review operations
  getInstitutionReviews(institutionId: string): Promise<InstitutionReview[]>;
  createInstitutionReview(review: InsertInstitutionReview): Promise<InstitutionReview>;
  updateInstitutionRatingStats(institutionId: string): Promise<void>;
  
  // Programme operations
  getProgrammes(): Promise<Programme[]>;
  getProgrammesByInstitution(institutionId: string): Promise<Programme[]>;
  getProgramme(id: string): Promise<Programme | undefined>;
  createProgramme(programme: InsertProgramme): Promise<Programme>;
  createProgrammes(programmes: InsertProgramme[]): Promise<Programme[]>;
  deleteProgramme(id: string): Promise<void>;
  
  // Course operations
  getCourses(): Promise<Course[]>;
  getCoursesByInstitution(institutionId: string): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  bulkCreateCourses(coursesData: InsertCourse[]): Promise<{ added: number; skipped: number }>;
  
  // Material operations
  getMaterials(): Promise<Material[]>;
  getMaterialsByCourse(courseId: string): Promise<Material[]>;
  getMaterialsByInstructor(instructorId: string): Promise<Material[]>;
  getMaterialsByUser(userId: string): Promise<Material[]>;
  getMaterial(id: string): Promise<Material | undefined>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: string, material: Partial<InsertMaterial>): Promise<Material>;
  deleteMaterial(id: string): Promise<void>;
  getMaterialsForModeration(status?: string): Promise<Material[]>;
  moderateMaterial(id: string, status: string, moderatorId: string, reason?: string): Promise<Material>;
  
  // Quiz operations
  getQuizzes(): Promise<Quiz[]>;
  getQuizzesByCourse(courseId: string): Promise<Quiz[]>;
  getQuizzesByInstructor(instructorId: string): Promise<Quiz[]>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuizzesForModeration(status?: string): Promise<Quiz[]>;
  moderateQuiz(id: string, status: string, moderatorId: string, reason?: string): Promise<Quiz>;
  deleteQuiz(id: string): Promise<void>;
  
  // Quiz Question operations
  getQuizQuestions(quizId: string): Promise<QuizQuestion[]>;
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  
  // Quiz Attempt operations
  getQuizAttempts(userId: string): Promise<QuizAttempt[]>;
  getQuizAttemptsByQuiz(quizId: string): Promise<QuizAttempt[]>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  
  // Bookmark operations
  getBookmarks(userId: string): Promise<Bookmark[]>;
  getBookmarkByMaterial(userId: string, materialId: string): Promise<Bookmark | undefined>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(id: string): Promise<void>;
  deleteBookmarkByMaterial(userId: string, materialId: string): Promise<void>;
  
  // Material Review operations
  getReviewsByMaterial(materialId: string): Promise<MaterialReview[]>;
  getReviewByUserAndMaterial(userId: string, materialId: string): Promise<MaterialReview | undefined>;
  createReview(review: InsertMaterialReview): Promise<MaterialReview>;
  updateReview(id: string, reviewText: string): Promise<MaterialReview>;
  deleteReview(id: string): Promise<void>;
  
  // Material Rating operations
  getRatingsByMaterial(materialId: string): Promise<MaterialRating[]>;
  getRatingByUserAndMaterial(userId: string, materialId: string): Promise<MaterialRating | undefined>;
  getAverageRating(materialId: string): Promise<number>;
  createRating(rating: InsertMaterialRating): Promise<MaterialRating>;
  updateRating(id: string, rating: number): Promise<MaterialRating>;
  deleteRating(id: string): Promise<void>;
  
  // Material Report operations
  getReportsByMaterial(materialId: string): Promise<MaterialReport[]>;
  getAllReports(status?: string): Promise<MaterialReport[]>;
  createReport(report: InsertMaterialReport): Promise<MaterialReport>;
  updateReportStatus(id: string, status: string, reviewerId: string, notes?: string): Promise<MaterialReport>;
  
  // Blog Post operations
  getAllBlogPosts(): Promise<BlogPost[]>;
  getPublishedBlogPosts(): Promise<BlogPost[]>;
  getFeaturedBlogPosts(): Promise<BlogPost[]>;
  getBlogPostById(id: string): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, post: Partial<UpdateBlogPost>): Promise<BlogPost>;
  publishBlogPost(id: string, published: boolean): Promise<BlogPost>;
  toggleFeaturedBlogPost(id: string, featured: boolean): Promise<BlogPost>;
  deleteBlogPost(id: string): Promise<void>;
  incrementBlogPostViews(id: string): Promise<void>;
  
  // Blog Category operations
  getAllBlogCategories(): Promise<BlogCategory[]>;
  getAllBlogCategoriesWithStats(): Promise<(BlogCategory & { postCount: number })[]>;
  getBlogCategoryById(id: string): Promise<BlogCategory | undefined>;
  getBlogCategoryBySlug(slug: string): Promise<BlogCategory | undefined>;
  createBlogCategory(category: InsertBlogCategory): Promise<BlogCategory>;
  updateBlogCategory(id: string, category: Partial<UpdateBlogCategory>): Promise<BlogCategory>;
  deleteBlogCategory(id: string): Promise<void>;
  bulkDeleteBlogCategories(ids: string[]): Promise<void>;
  
  // Blog Tag operations
  getAllBlogTags(): Promise<BlogTag[]>;
  getBlogTagById(id: string): Promise<BlogTag | undefined>;
  getBlogTagBySlug(slug: string): Promise<BlogTag | undefined>;
  createBlogTag(tag: InsertBlogTag): Promise<BlogTag>;
  updateBlogTag(id: string, tag: Partial<UpdateBlogTag>): Promise<BlogTag>;
  deleteBlogTag(id: string): Promise<void>;
  incrementBlogTagUsage(slug: string): Promise<void>;
  decrementBlogTagUsage(slug: string): Promise<void>;
  mergeBlogTags(sourceTagId: string, targetTagId: string): Promise<void>;
  bulkDeleteBlogTags(ids: string[]): Promise<void>;
  
  // Notification operations
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  deleteAllNotifications(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Institution operations
  async getInstitutions(): Promise<Institution[]> {
    return await db.select().from(institutions).orderBy(desc(institutions.createdAt));
  }

  async getInstitution(id: string): Promise<Institution | undefined> {
    const [institution] = await db.select().from(institutions).where(eq(institutions.id, id));
    return institution;
  }

  async getInstitutionBySlug(slug: string): Promise<Institution | undefined> {
    const [institution] = await db.select().from(institutions).where(eq(institutions.profileSlug, slug));
    return institution;
  }

  async createInstitution(institutionData: InsertInstitution): Promise<Institution> {
    const [institution] = await db.insert(institutions).values(institutionData).returning();
    return institution;
  }

  async updateInstitution(id: string, institutionData: Partial<InsertInstitution>): Promise<Institution | undefined> {
    const [institution] = await db
      .update(institutions)
      .set({ ...institutionData, updatedAt: new Date() })
      .where(eq(institutions.id, id))
      .returning();
    return institution;
  }

  async bulkCreateInstitutions(institutionsData: InsertInstitution[]): Promise<{ added: number; skipped: number; errors: string[] }> {
    let added = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const institutionData of institutionsData) {
      try {
        // Auto-generate profileSlug from name if not provided
        if (!institutionData.profileSlug) {
          institutionData.profileSlug = institutionData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        }

        // Check for existing institution by name or slug
        const existingInstitution = await db
          .select()
          .from(institutions)
          .where(
            sql`${institutions.name} = ${institutionData.name} OR ${institutions.profileSlug} = ${institutionData.profileSlug}`
          )
          .limit(1);

        if (existingInstitution.length > 0) {
          skipped++;
          errors.push(`Institution "${institutionData.name}" already exists`);
          continue;
        }

        await db.insert(institutions).values(institutionData);
        added++;
      } catch (error: any) {
        console.error(`Error creating institution ${institutionData.name}:`, error);
        skipped++;
        errors.push(`Error creating "${institutionData.name}": ${error.message}`);
      }
    }

    return { added, skipped, errors };
  }

  async createInstitutionWithOwner(
    institutionData: InsertInstitution, 
    userId: string, 
    onboardingData: Partial<UpsertUser>
  ): Promise<{ institution: Institution; user: User }> {
    const [institution] = await db.insert(institutions).values(institutionData).returning();
    
    const [user] = await db
      .update(users)
      .set({ 
        ...onboardingData, 
        institutionId: institution.id,
        onboardingCompleted: true,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    
    return { institution, user };
  }

  async getUsersByInstitution(institutionId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.institutionId, institutionId));
  }

  async getInstructorsByInstitution(institutionId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.institutionId, institutionId), eq(users.role, 'instructor')));
  }

  async getStudentsByInstitution(institutionId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.institutionId, institutionId), eq(users.role, 'student')));
  }

  // Institution Review operations
  async getInstitutionReviews(institutionId: string): Promise<InstitutionReview[]> {
    return await db
      .select()
      .from(institutionReviews)
      .where(eq(institutionReviews.institutionId, institutionId))
      .orderBy(desc(institutionReviews.createdAt));
  }

  async createInstitutionReview(reviewData: InsertInstitutionReview): Promise<InstitutionReview> {
    const [review] = await db.insert(institutionReviews).values(reviewData).returning();
    
    // Update institution rating stats
    await this.updateInstitutionRatingStats(reviewData.institutionId);
    
    return review;
  }

  async updateInstitutionRatingStats(institutionId: string): Promise<void> {
    // Calculate average rating and total reviews
    const stats = await db
      .select({
        avgRating: sql<number>`AVG(${institutionReviews.rating})::FLOAT`,
        totalReviews: sql<number>`COUNT(*)::INT`,
      })
      .from(institutionReviews)
      .where(eq(institutionReviews.institutionId, institutionId));

    if (stats.length > 0 && stats[0]) {
      await db
        .update(institutions)
        .set({
          averageRating: stats[0].avgRating || 0,
          totalReviews: stats[0].totalReviews || 0,
          updatedAt: new Date(),
        })
        .where(eq(institutions.id, institutionId));
    }
  }

  // Programme operations
  async getProgrammes(): Promise<Programme[]> {
    return await db.select().from(programmes).orderBy(desc(programmes.createdAt));
  }

  async getProgrammesByInstitution(institutionId: string): Promise<Programme[]> {
    return await db.select().from(programmes).where(eq(programmes.institutionId, institutionId));
  }

  async getProgramme(id: string): Promise<Programme | undefined> {
    const [programme] = await db.select().from(programmes).where(eq(programmes.id, id));
    return programme;
  }

  async createProgramme(programmeData: InsertProgramme): Promise<Programme> {
    const [programme] = await db.insert(programmes).values(programmeData).returning();
    return programme;
  }

  async createProgrammes(programmesData: InsertProgramme[]): Promise<Programme[]> {
    const createdProgrammes = await db.insert(programmes).values(programmesData).returning();
    return createdProgrammes;
  }

  async deleteProgramme(id: string): Promise<void> {
    await db.delete(programmes).where(eq(programmes.id, id));
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(desc(courses.createdAt));
  }

  async getCoursesByInstitution(institutionId: string): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.institutionId, institutionId));
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(courseData: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(courseData).returning();
    return course;
  }

  async bulkCreateCourses(coursesData: InsertCourse[]): Promise<{ added: number; skipped: number }> {
    let added = 0;
    let skipped = 0;

    for (const courseData of coursesData) {
      try {
        const existingCourse = await db
          .select()
          .from(courses)
          .where(
            and(
              eq(courses.title, courseData.title),
              courseData.institutionId ? eq(courses.institutionId, courseData.institutionId) : sql`true`
            )
          )
          .limit(1);

        if (existingCourse.length > 0) {
          skipped++;
          continue;
        }

        await db.insert(courses).values(courseData);
        added++;
      } catch (error) {
        console.error(`Error creating course ${courseData.title}:`, error);
        skipped++;
      }
    }

    return { added, skipped };
  }

  // Material operations
  async getMaterials(): Promise<Material[]> {
    return await db.select().from(materials).orderBy(desc(materials.createdAt));
  }

  async getMaterialsWithStats(): Promise<any[]> {
    const result = await db
      .select({
        material: materials,
        avgRating: sql<number>`COALESCE(AVG(${materialRatings.rating}), 0)`.as('avg_rating'),
        ratingCount: sql<number>`COUNT(DISTINCT ${materialRatings.id})`.as('rating_count'),
        reviewCount: sql<number>`COUNT(DISTINCT ${materialReviews.id})`.as('review_count'),
      })
      .from(materials)
      .leftJoin(materialRatings, eq(materials.id, materialRatings.materialId))
      .leftJoin(materialReviews, eq(materials.id, materialReviews.materialId))
      .groupBy(materials.id)
      .orderBy(desc(materials.createdAt));

    return result.map(row => ({
      ...row.material,
      stats: {
        averageRating: parseFloat(String(row.avgRating)),
        ratingCount: parseInt(String(row.ratingCount)),
        reviewCount: parseInt(String(row.reviewCount)),
      }
    }));
  }

  async getMaterialsByCourse(courseId: string): Promise<Material[]> {
    return await db.select().from(materials).where(eq(materials.courseId, courseId));
  }

  async getMaterialsByInstructor(instructorId: string): Promise<Material[]> {
    return await db.select().from(materials).where(eq(materials.uploadedById, instructorId));
  }

  async getMaterial(id: string): Promise<Material | undefined> {
    const [material] = await db.select().from(materials).where(eq(materials.id, id));
    return material;
  }

  async createMaterial(materialData: InsertMaterial): Promise<Material> {
    const [material] = await db.insert(materials).values(materialData as any).returning();
    return material;
  }

  async getMaterialsByUser(userId: string): Promise<Material[]> {
    return await db
      .select()
      .from(materials)
      .where(eq(materials.uploadedById, userId))
      .orderBy(desc(materials.createdAt));
  }

  async updateMaterial(id: string, materialData: Partial<InsertMaterial>): Promise<Material> {
    const [material] = await db
      .update(materials)
      .set({ ...materialData, updatedAt: new Date() } as any)
      .where(eq(materials.id, id))
      .returning();
    return material;
  }

  async deleteMaterial(id: string): Promise<void> {
    await db.delete(materials).where(eq(materials.id, id));
  }

  async getMaterialsForModeration(status?: string): Promise<Material[]> {
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      return await db
        .select()
        .from(materials)
        .where(eq(materials.moderationStatus, status))
        .orderBy(desc(materials.createdAt));
    }
    return await db.select().from(materials).orderBy(desc(materials.createdAt));
  }

  async moderateMaterial(id: string, status: string, moderatorId: string, reason?: string): Promise<Material> {
    const [material] = await db
      .update(materials)
      .set({
        moderationStatus: status,
        moderatedById: moderatorId,
        moderatedAt: new Date(),
        moderationNotes: reason || null,
        updatedAt: new Date(),
      })
      .where(eq(materials.id, id))
      .returning();
    return material;
  }

  // Quiz operations
  async getQuizzes(): Promise<Quiz[]> {
    return await db.select().from(quizzes).orderBy(desc(quizzes.createdAt));
  }

  async getQuizzesByCourse(courseId: string): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.courseId, courseId));
  }

  async getQuizzesByInstructor(instructorId: string): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.createdById, instructorId));
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async createQuiz(quizData: InsertQuiz): Promise<Quiz> {
    const [quiz] = await db.insert(quizzes).values(quizData).returning();
    return quiz;
  }

  async getQuizzesForModeration(status?: string): Promise<Quiz[]> {
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      return await db
        .select()
        .from(quizzes)
        .where(eq(quizzes.moderationStatus, status))
        .orderBy(desc(quizzes.createdAt));
    }
    return await db.select().from(quizzes).orderBy(desc(quizzes.createdAt));
  }

  async moderateQuiz(id: string, status: string, moderatorId: string, reason?: string): Promise<Quiz> {
    const [quiz] = await db
      .update(quizzes)
      .set({
        moderationStatus: status,
        moderatedById: moderatorId,
        moderatedAt: new Date(),
        moderationNotes: reason || null,
      })
      .where(eq(quizzes.id, id))
      .returning();
    return quiz;
  }

  async deleteQuiz(id: string): Promise<void> {
    await db.delete(quizzes).where(eq(quizzes.id, id));
  }

  // Quiz Question operations
  async getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
    return await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(quizQuestions.order);
  }

  async createQuizQuestion(questionData: InsertQuizQuestion): Promise<QuizQuestion> {
    const [question] = await db.insert(quizQuestions).values(questionData).returning();
    return question;
  }

  // Quiz Attempt operations
  async getQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    return await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.studentId, userId))
      .orderBy(desc(quizAttempts.completedAt));
  }

  async getQuizAttemptsByQuiz(quizId: string): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts).where(eq(quizAttempts.quizId, quizId));
  }

  async createQuizAttempt(attemptData: InsertQuizAttempt): Promise<QuizAttempt> {
    const [attempt] = await db.insert(quizAttempts).values(attemptData).returning();
    return attempt;
  }

  // Bookmark operations
  async getBookmarks(userId: string): Promise<Bookmark[]> {
    return await db.select().from(bookmarks).where(eq(bookmarks.userId, userId));
  }

  async createBookmark(bookmarkData: InsertBookmark): Promise<Bookmark> {
    const [bookmark] = await db.insert(bookmarks).values(bookmarkData).returning();
    return bookmark;
  }

  async deleteBookmark(id: string): Promise<void> {
    await db.delete(bookmarks).where(eq(bookmarks.id, id));
  }

  async getBookmarkByMaterial(userId: string, materialId: string): Promise<Bookmark | undefined> {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.materialId, materialId)));
    return bookmark;
  }

  async deleteBookmarkByMaterial(userId: string, materialId: string): Promise<void> {
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.materialId, materialId)));
  }

  // Material Review operations
  async getReviewsByMaterial(materialId: string): Promise<MaterialReview[]> {
    return await db
      .select()
      .from(materialReviews)
      .where(eq(materialReviews.materialId, materialId))
      .orderBy(desc(materialReviews.createdAt));
  }

  async getReviewByUserAndMaterial(userId: string, materialId: string): Promise<MaterialReview | undefined> {
    const [review] = await db
      .select()
      .from(materialReviews)
      .where(and(eq(materialReviews.userId, userId), eq(materialReviews.materialId, materialId)));
    return review;
  }

  async createReview(reviewData: InsertMaterialReview): Promise<MaterialReview> {
    const [review] = await db.insert(materialReviews).values(reviewData).returning();
    return review;
  }

  async updateReview(id: string, reviewText: string): Promise<MaterialReview> {
    const [review] = await db
      .update(materialReviews)
      .set({ reviewText, updatedAt: new Date() })
      .where(eq(materialReviews.id, id))
      .returning();
    return review;
  }

  async deleteReview(id: string): Promise<void> {
    await db.delete(materialReviews).where(eq(materialReviews.id, id));
  }

  // Material Rating operations
  async getRatingsByMaterial(materialId: string): Promise<MaterialRating[]> {
    return await db
      .select()
      .from(materialRatings)
      .where(eq(materialRatings.materialId, materialId));
  }

  async getRatingByUserAndMaterial(userId: string, materialId: string): Promise<MaterialRating | undefined> {
    const [rating] = await db
      .select()
      .from(materialRatings)
      .where(and(eq(materialRatings.userId, userId), eq(materialRatings.materialId, materialId)));
    return rating;
  }

  async getAverageRating(materialId: string): Promise<number> {
    const result = await db
      .select({ avg: sql<number>`COALESCE(AVG(${materialRatings.rating}), 0)` })
      .from(materialRatings)
      .where(eq(materialRatings.materialId, materialId));
    return result[0]?.avg || 0;
  }

  async createRating(ratingData: InsertMaterialRating): Promise<MaterialRating> {
    const [rating] = await db.insert(materialRatings).values(ratingData).returning();
    return rating;
  }

  async updateRating(id: string, ratingValue: number): Promise<MaterialRating> {
    const [rating] = await db
      .update(materialRatings)
      .set({ rating: ratingValue, updatedAt: new Date() })
      .where(eq(materialRatings.id, id))
      .returning();
    return rating;
  }

  async deleteRating(id: string): Promise<void> {
    await db.delete(materialRatings).where(eq(materialRatings.id, id));
  }

  // Material Report operations
  async getReportsByMaterial(materialId: string): Promise<MaterialReport[]> {
    return await db
      .select()
      .from(materialReports)
      .where(eq(materialReports.materialId, materialId))
      .orderBy(desc(materialReports.createdAt));
  }

  async getAllReports(status?: string): Promise<MaterialReport[]> {
    if (status) {
      return await db
        .select()
        .from(materialReports)
        .where(eq(materialReports.status, status))
        .orderBy(desc(materialReports.createdAt));
    }
    return await db.select().from(materialReports).orderBy(desc(materialReports.createdAt));
  }

  async createReport(reportData: InsertMaterialReport): Promise<MaterialReport> {
    const [report] = await db.insert(materialReports).values(reportData).returning();
    return report;
  }

  async updateReportStatus(id: string, status: string, reviewerId: string, notes?: string): Promise<MaterialReport> {
    const [report] = await db
      .update(materialReports)
      .set({
        status,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        adminNotes: notes,
      })
      .where(eq(materialReports.id, id))
      .returning();
    return report;
  }

  // Blog Post operations
  async getAllBlogPosts(): Promise<BlogPost[]> {
    return await db
      .select()
      .from(blogPosts)
      .orderBy(desc(blogPosts.createdAt));
  }

  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    return await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(desc(blogPosts.publishedAt));
  }

  async getFeaturedBlogPosts(): Promise<BlogPost[]> {
    return await db
      .select()
      .from(blogPosts)
      .where(and(
        eq(blogPosts.published, true),
        eq(blogPosts.featured, true)
      ))
      .orderBy(desc(blogPosts.publishedAt));
  }

  async getBlogPostById(id: string): Promise<BlogPost | undefined> {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id));
    return post;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        content: blogPosts.content,
        coverImageUrl: blogPosts.coverImageUrl,
        authorId: blogPosts.authorId,
        published: blogPosts.published,
        publishedAt: blogPosts.publishedAt,
        tags: blogPosts.tags,
        category: blogPosts.category,
        featured: blogPosts.featured,
        commentsEnabled: blogPosts.commentsEnabled,
        readTime: blogPosts.readTime,
        viewCount: blogPosts.viewCount,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          bio: users.bio,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(and(
        eq(blogPosts.slug, slug),
        eq(blogPosts.published, true)
      ));
    return post as any;
  }

  async createBlogPost(postData: InsertBlogPost): Promise<BlogPost> {
    const [post] = await db.insert(blogPosts).values(postData as any).returning();
    return post;
  }

  async updateBlogPost(id: string, postData: Partial<UpdateBlogPost>): Promise<BlogPost> {
    const [post] = await db
      .update(blogPosts)
      .set({ ...postData, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return post;
  }

  async publishBlogPost(id: string, published: boolean): Promise<BlogPost> {
    const [post] = await db
      .update(blogPosts)
      .set({
        published,
        publishedAt: published ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(blogPosts.id, id))
      .returning();
    return post;
  }

  async toggleFeaturedBlogPost(id: string, featured: boolean): Promise<BlogPost> {
    const [post] = await db
      .update(blogPosts)
      .set({
        featured,
        updatedAt: new Date(),
      })
      .where(eq(blogPosts.id, id))
      .returning();
    return post;
  }

  async deleteBlogPost(id: string): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  async incrementBlogPostViews(id: string): Promise<void> {
    await db
      .update(blogPosts)
      .set({ viewCount: sql`${blogPosts.viewCount} + 1` })
      .where(eq(blogPosts.id, id));
  }

  async createBlogComment(data: {
    postId: string;
    userId: string;
    content: string;
    parentId?: string | null;
    approved?: boolean;
  }): Promise<BlogComment> {
    const [comment] = await db.insert(blogComments).values(data).returning();
    return comment;
  }

  async getBlogComments(postId: string): Promise<BlogComment[]> {
    return await db
      .select()
      .from(blogComments)
      .where(and(
        eq(blogComments.postId, postId),
        eq(blogComments.approved, true)
      ))
      .orderBy(blogComments.createdAt);
  }

  async getAllBlogComments(): Promise<BlogComment[]> {
    return await db
      .select()
      .from(blogComments)
      .orderBy(desc(blogComments.createdAt));
  }

  async getPendingBlogComments(): Promise<BlogComment[]> {
    return await db
      .select()
      .from(blogComments)
      .where(eq(blogComments.approved, false))
      .orderBy(desc(blogComments.createdAt));
  }

  async approveBlogComment(id: string): Promise<BlogComment> {
    const [comment] = await db
      .update(blogComments)
      .set({ approved: true, updatedAt: new Date() })
      .where(eq(blogComments.id, id))
      .returning();
    return comment;
  }

  async deleteBlogComment(id: string): Promise<void> {
    await db.delete(blogComments).where(eq(blogComments.id, id));
  }

  // Blog Post Like operations
  async likeBlogPost(postId: string, userId: string): Promise<BlogPostLike> {
    const [like] = await db.insert(blogPostLikes).values({ postId, userId }).returning();
    return like;
  }

  async unlikeBlogPost(postId: string, userId: string): Promise<void> {
    await db.delete(blogPostLikes).where(
      and(
        eq(blogPostLikes.postId, postId),
        eq(blogPostLikes.userId, userId)
      )
    );
  }

  async getBlogPostLikes(postId: string): Promise<BlogPostLike[]> {
    return await db
      .select()
      .from(blogPostLikes)
      .where(eq(blogPostLikes.postId, postId));
  }

  async getBlogPostLikeCount(postId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(blogPostLikes)
      .where(eq(blogPostLikes.postId, postId));
    return Number(result[0]?.count || 0);
  }

  async hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
    const [like] = await db
      .select()
      .from(blogPostLikes)
      .where(
        and(
          eq(blogPostLikes.postId, postId),
          eq(blogPostLikes.userId, userId)
        )
      );
    return !!like;
  }

  async getPostsByAuthor(authorId: string, limit: number = 5): Promise<BlogPost[]> {
    return await db
      .select()
      .from(blogPosts)
      .where(and(
        eq(blogPosts.authorId, authorId),
        eq(blogPosts.published, true)
      ))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit);
  }

  async bookmarkBlogPost(postId: string, userId: string): Promise<BlogPostBookmark> {
    const [bookmark] = await db.insert(blogPostBookmarks).values({ postId, userId }).returning();
    return bookmark;
  }

  async unbookmarkBlogPost(postId: string, userId: string): Promise<void> {
    await db.delete(blogPostBookmarks).where(
      and(
        eq(blogPostBookmarks.postId, postId),
        eq(blogPostBookmarks.userId, userId)
      )
    );
  }

  async getUserBookmarkedPosts(userId: string): Promise<BlogPost[]> {
    const bookmarkedPosts = await db
      .select({
        post: blogPosts,
      })
      .from(blogPostBookmarks)
      .innerJoin(blogPosts, eq(blogPostBookmarks.postId, blogPosts.id))
      .where(and(
        eq(blogPostBookmarks.userId, userId),
        eq(blogPosts.published, true)
      ))
      .orderBy(desc(blogPostBookmarks.createdAt));
    
    return bookmarkedPosts.map(bp => bp.post);
  }

  async hasUserBookmarkedPost(postId: string, userId: string): Promise<boolean> {
    const [bookmark] = await db
      .select()
      .from(blogPostBookmarks)
      .where(
        and(
          eq(blogPostBookmarks.postId, postId),
          eq(blogPostBookmarks.userId, userId)
        )
      );
    return !!bookmark;
  }

  async getBlogPostBookmarkCount(postId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(blogPostBookmarks)
      .where(eq(blogPostBookmarks.postId, postId));
    return Number(result[0]?.count || 0);
  }

  // Blog Category operations
  async getAllBlogCategories(): Promise<BlogCategory[]> {
    return await db.select().from(blogCategories).orderBy(blogCategories.displayOrder, blogCategories.name);
  }

  async getAllBlogCategoriesWithStats(): Promise<(BlogCategory & { postCount: number })[]> {
    const categories = await db.select().from(blogCategories).orderBy(blogCategories.displayOrder, blogCategories.name);
    const categoriesWithStats = await Promise.all(
      categories.map(async (category) => {
        const result = await db
          .select({ count: sql<number>`count(*)` })
          .from(blogPosts)
          .where(eq(blogPosts.category, category.slug));
        return {
          ...category,
          postCount: Number(result[0]?.count || 0),
        };
      })
    );
    return categoriesWithStats;
  }

  async getBlogCategoryById(id: string): Promise<BlogCategory | undefined> {
    const [category] = await db.select().from(blogCategories).where(eq(blogCategories.id, id));
    return category;
  }

  async getBlogCategoryBySlug(slug: string): Promise<BlogCategory | undefined> {
    const [category] = await db.select().from(blogCategories).where(eq(blogCategories.slug, slug));
    return category;
  }

  async createBlogCategory(categoryData: InsertBlogCategory): Promise<BlogCategory> {
    const [category] = await db.insert(blogCategories).values(categoryData).returning();
    return category;
  }

  async updateBlogCategory(id: string, categoryData: Partial<UpdateBlogCategory>): Promise<BlogCategory> {
    const [category] = await db
      .update(blogCategories)
      .set({ ...categoryData, updatedAt: new Date() })
      .where(eq(blogCategories.id, id))
      .returning();
    return category;
  }

  async deleteBlogCategory(id: string): Promise<void> {
    await db.delete(blogCategories).where(eq(blogCategories.id, id));
  }

  async bulkDeleteBlogCategories(ids: string[]): Promise<void> {
    await db.delete(blogCategories).where(
      sql`${blogCategories.id} = ANY(${ids})`
    );
  }

  // Blog Tag operations
  async getAllBlogTags(): Promise<BlogTag[]> {
    return await db.select().from(blogTags).orderBy(desc(blogTags.usageCount), blogTags.name);
  }

  async getBlogTagById(id: string): Promise<BlogTag | undefined> {
    const [tag] = await db.select().from(blogTags).where(eq(blogTags.id, id));
    return tag;
  }

  async getBlogTagBySlug(slug: string): Promise<BlogTag | undefined> {
    const [tag] = await db.select().from(blogTags).where(eq(blogTags.slug, slug));
    return tag;
  }

  async createBlogTag(tagData: InsertBlogTag): Promise<BlogTag> {
    const [tag] = await db.insert(blogTags).values(tagData).returning();
    return tag;
  }

  async updateBlogTag(id: string, tagData: Partial<UpdateBlogTag>): Promise<BlogTag> {
    const [tag] = await db
      .update(blogTags)
      .set({ ...tagData, updatedAt: new Date() })
      .where(eq(blogTags.id, id))
      .returning();
    return tag;
  }

  async deleteBlogTag(id: string): Promise<void> {
    await db.delete(blogTags).where(eq(blogTags.id, id));
  }

  async incrementBlogTagUsage(slug: string): Promise<void> {
    await db
      .update(blogTags)
      .set({ usageCount: sql`${blogTags.usageCount} + 1` })
      .where(eq(blogTags.slug, slug));
  }

  async decrementBlogTagUsage(slug: string): Promise<void> {
    await db
      .update(blogTags)
      .set({ usageCount: sql`${blogTags.usageCount} - 1` })
      .where(eq(blogTags.slug, slug));
  }

  async mergeBlogTags(sourceTagId: string, targetTagId: string): Promise<void> {
    const sourceTag = await this.getBlogTagById(sourceTagId);
    const targetTag = await this.getBlogTagById(targetTagId);
    
    if (!sourceTag || !targetTag) {
      throw new Error("Source or target tag not found");
    }

    const postsWithSourceTag = await db
      .select()
      .from(blogPosts)
      .where(sql`${sourceTag.slug} = ANY(${blogPosts.tags})`);

    for (const post of postsWithSourceTag) {
      const currentTags = post.tags || [];
      const tagsWithoutSource = currentTags.filter(tag => tag !== sourceTag.slug);
      
      if (!tagsWithoutSource.includes(targetTag.slug)) {
        tagsWithoutSource.push(targetTag.slug);
      }

      await db
        .update(blogPosts)
        .set({ tags: tagsWithoutSource })
        .where(eq(blogPosts.id, post.id));
    }

    const mergedCount = postsWithSourceTag.length;
    if (mergedCount > 0) {
      await db
        .update(blogTags)
        .set({ usageCount: sql`${blogTags.usageCount} + ${mergedCount}` })
        .where(eq(blogTags.id, targetTagId));
    }

    await this.deleteBlogTag(sourceTagId);
  }

  async bulkDeleteBlogTags(ids: string[]): Promise<void> {
    const tags = await Promise.all(ids.map(id => this.getBlogTagById(id)));
    
    for (const tag of tags) {
      if (tag && tag.usageCount > 0) {
        const postsWithTag = await db
          .select()
          .from(blogPosts)
          .where(sql`${tag.slug} = ANY(${blogPosts.tags})`);
        
        for (const post of postsWithTag) {
          const currentTags = (post.tags || []).filter(t => t !== tag.slug);
          await db
            .update(blogPosts)
            .set({ tags: currentTags })
            .where(eq(blogPosts.id, post.id));
        }
      }
    }
    
    await db.delete(blogTags).where(
      sql`${blogTags.id} = ANY(${ids})`
    );
  }

  // Notification operations
  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    return userNotifications;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return result[0]?.count || 0;
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async deleteAllNotifications(userId: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.userId, userId));
  }
}

export const storage = new DatabaseStorage();
