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
  notifications,
  schools,
  subscriptionPlans,
  schoolUsers,
  parentStudentLinks,
  academicTerms,
  schoolClasses,
  schoolSubjects,
  classSubjects,
  teacherAssignments,
  classEnrollments,
  attendanceRecords,
  assessmentTypes,
  studentGrades,
  termResults,
  feeTypes,
  classFees,
  feePayments,
  timetablePeriods,
  timetableEntries,
  schoolAnnouncements,
  schoolNotifications,
  schoolMaterials,
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
  type Notification,
  type InsertNotification,
  type School,
  type InsertSchool,
  type UpdateSchool,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type SchoolUser,
  type InsertSchoolUser,
  type UpdateSchoolUser,
  type ParentStudentLink,
  type InsertParentStudentLink,
  type AcademicTerm,
  type InsertAcademicTerm,
  type SchoolClass,
  type InsertSchoolClass,
  type SchoolSubject,
  type InsertSchoolSubject,
  type ClassSubject,
  type InsertClassSubject,
  type TeacherAssignment,
  type InsertTeacherAssignment,
  type ClassEnrollment,
  type InsertClassEnrollment,
  type AttendanceRecord,
  type InsertAttendanceRecord,
  type AssessmentType,
  type InsertAssessmentType,
  type StudentGrade,
  type InsertStudentGrade,
  type TermResult,
  type InsertTermResult,
  type FeeType,
  type InsertFeeType,
  type ClassFee,
  type InsertClassFee,
  type FeePayment,
  type InsertFeePayment,
  type TimetablePeriod,
  type InsertTimetablePeriod,
  type TimetableEntry,
  type InsertTimetableEntry,
  type SchoolAnnouncement,
  type InsertSchoolAnnouncement,
  type SchoolNotification,
  type InsertSchoolNotification,
  type SchoolMaterial,
  type InsertSchoolMaterial,
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
  
  // ============================================
  // SCHOOL MANAGEMENT SYSTEM (SMS) OPERATIONS
  // ============================================
  
  // Subscription Plan operations
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
  getSubscriptionPlanByCode(code: string): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  
  // School operations
  getSchools(): Promise<School[]>;
  getSchool(id: string): Promise<School | undefined>;
  getSchoolBySubdomain(subdomain: string): Promise<School | undefined>;
  getSchoolBySlug(slug: string): Promise<School | undefined>;
  getSchoolsByOwner(ownerId: string): Promise<School[]>;
  createSchool(school: InsertSchool): Promise<School>;
  updateSchool(id: string, school: Partial<UpdateSchool>): Promise<School>;
  checkSubdomainAvailability(subdomain: string): Promise<boolean>;
  activateSchoolTrial(schoolId: string, trialDays?: number): Promise<School>;
  updateSchoolSubscription(schoolId: string, planId: string, status: string, endDate?: Date): Promise<School>;
  
  // School User operations
  getSchoolUsers(schoolId: string): Promise<SchoolUser[]>;
  getSchoolUsersByRole(schoolId: string, role: string): Promise<SchoolUser[]>;
  getSchoolUser(id: string): Promise<SchoolUser | undefined>;
  getSchoolUserByEmail(schoolId: string, email: string): Promise<SchoolUser | undefined>;
  createSchoolUser(user: InsertSchoolUser): Promise<SchoolUser>;
  updateSchoolUser(id: string, user: Partial<UpdateSchoolUser>): Promise<SchoolUser>;
  deleteSchoolUser(id: string): Promise<void>;
  
  // Parent-Student Link operations
  getParentStudentLinks(parentId: string): Promise<ParentStudentLink[]>;
  getStudentParentLinks(studentId: string): Promise<ParentStudentLink[]>;
  createParentStudentLink(link: InsertParentStudentLink): Promise<ParentStudentLink>;
  deleteParentStudentLink(parentId: string, studentId: string): Promise<void>;
  
  // ============================================
  // ACADEMIC STRUCTURE OPERATIONS
  // ============================================
  
  // Academic Term operations
  getAcademicTerms(schoolId: string): Promise<AcademicTerm[]>;
  getCurrentAcademicTerm(schoolId: string): Promise<AcademicTerm | undefined>;
  getAcademicTerm(id: string): Promise<AcademicTerm | undefined>;
  createAcademicTerm(term: InsertAcademicTerm): Promise<AcademicTerm>;
  updateAcademicTerm(id: string, term: Partial<InsertAcademicTerm>): Promise<AcademicTerm>;
  setCurrentAcademicTerm(schoolId: string, termId: string): Promise<void>;
  deleteAcademicTerm(id: string): Promise<void>;
  
  // School Class operations
  getSchoolClasses(schoolId: string): Promise<SchoolClass[]>;
  getSchoolClass(id: string): Promise<SchoolClass | undefined>;
  createSchoolClass(classData: InsertSchoolClass): Promise<SchoolClass>;
  updateSchoolClass(id: string, classData: Partial<InsertSchoolClass>): Promise<SchoolClass>;
  deleteSchoolClass(id: string): Promise<void>;
  
  // School Subject operations
  getSchoolSubjects(schoolId: string): Promise<SchoolSubject[]>;
  getSchoolSubject(id: string): Promise<SchoolSubject | undefined>;
  createSchoolSubject(subject: InsertSchoolSubject): Promise<SchoolSubject>;
  updateSchoolSubject(id: string, subject: Partial<InsertSchoolSubject>): Promise<SchoolSubject>;
  deleteSchoolSubject(id: string): Promise<void>;
  
  // Class Subject operations
  getClassSubjects(classId: string): Promise<ClassSubject[]>;
  addSubjectToClass(data: InsertClassSubject): Promise<ClassSubject>;
  removeSubjectFromClass(classId: string, subjectId: string): Promise<void>;
  
  // Teacher Assignment operations
  getTeacherAssignments(schoolId: string, termId?: string): Promise<TeacherAssignment[]>;
  getTeacherAssignmentsByTeacher(teacherId: string): Promise<TeacherAssignment[]>;
  getTeacherAssignmentsByClass(classId: string): Promise<TeacherAssignment[]>;
  createTeacherAssignment(assignment: InsertTeacherAssignment): Promise<TeacherAssignment>;
  updateTeacherAssignment(id: string, assignment: Partial<InsertTeacherAssignment>): Promise<TeacherAssignment>;
  deleteTeacherAssignment(id: string): Promise<void>;
  
  // Class Enrollment operations
  getClassEnrollments(classId: string, termId?: string): Promise<ClassEnrollment[]>;
  getStudentEnrollments(studentId: string): Promise<ClassEnrollment[]>;
  enrollStudent(enrollment: InsertClassEnrollment): Promise<ClassEnrollment>;
  updateEnrollment(id: string, enrollment: Partial<InsertClassEnrollment>): Promise<ClassEnrollment>;
  deleteEnrollment(id: string): Promise<void>;
  
  // ============================================
  // ATTENDANCE OPERATIONS
  // ============================================
  
  getAttendanceRecords(classId: string, date: Date, subjectId?: string): Promise<AttendanceRecord[]>;
  getStudentAttendance(studentId: string, termId: string): Promise<AttendanceRecord[]>;
  getSubjectAttendance(classId: string, subjectId: string, termId: string): Promise<AttendanceRecord[]>;
  markAttendance(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  bulkMarkAttendance(records: InsertAttendanceRecord[]): Promise<AttendanceRecord[]>;
  updateAttendance(id: string, record: Partial<InsertAttendanceRecord>): Promise<AttendanceRecord>;
  getAttendanceSummary(classId: string, termId: string): Promise<{ studentId: string; present: number; absent: number; late: number; excused: number }[]>;
  getStudentAttendanceSummary(studentId: string, termId: string): Promise<{ present: number; absent: number; late: number; excused: number; totalDays: number; rate: number }>;
  getAttendanceReport(classId: string, termId: string, startDate: Date, endDate: Date): Promise<AttendanceRecord[]>;
  
  // ============================================
  // GRADES & ASSESSMENTS OPERATIONS
  // ============================================
  
  // Assessment Type operations
  getAssessmentTypes(schoolId: string): Promise<AssessmentType[]>;
  getAssessmentType(id: string): Promise<AssessmentType | undefined>;
  createAssessmentType(type: InsertAssessmentType): Promise<AssessmentType>;
  updateAssessmentType(id: string, type: Partial<InsertAssessmentType>): Promise<AssessmentType>;
  deleteAssessmentType(id: string): Promise<void>;
  
  // Student Grade operations
  getStudentGrades(studentId: string, termId: string): Promise<StudentGrade[]>;
  getClassGrades(classId: string, subjectId: string, termId: string): Promise<StudentGrade[]>;
  createStudentGrade(grade: InsertStudentGrade): Promise<StudentGrade>;
  bulkCreateStudentGrades(grades: InsertStudentGrade[]): Promise<StudentGrade[]>;
  updateStudentGrade(id: string, grade: Partial<InsertStudentGrade>): Promise<StudentGrade>;
  deleteStudentGrade(id: string): Promise<void>;
  getStudentGradesSummary(studentId: string, termId: string): Promise<{ subjectId: string; subjectName: string; averageScore: number; grade: string }[]>;
  
  // Term Result operations
  getTermResults(studentId: string, termId: string): Promise<TermResult[]>;
  getClassTermResults(classId: string, termId: string): Promise<TermResult[]>;
  createTermResult(result: InsertTermResult): Promise<TermResult>;
  updateTermResult(id: string, result: Partial<InsertTermResult>): Promise<TermResult>;
  calculateTermResults(schoolId: string, classId: string, termId: string): Promise<TermResult[]>;
  
  // Student Fee Summary
  getStudentFeeSummary(studentId: string): Promise<{ totalDue: number; totalPaid: number; balance: number }>;
  
  // ============================================
  // FEES & PAYMENTS OPERATIONS
  // ============================================
  
  // Fee Type operations
  getFeeTypes(schoolId: string): Promise<FeeType[]>;
  getFeeType(id: string): Promise<FeeType | undefined>;
  createFeeType(fee: InsertFeeType): Promise<FeeType>;
  updateFeeType(id: string, fee: Partial<InsertFeeType>): Promise<FeeType>;
  deleteFeeType(id: string): Promise<void>;
  
  // Class Fee operations
  getClassFees(classId: string, termId?: string): Promise<ClassFee[]>;
  createClassFee(fee: InsertClassFee): Promise<ClassFee>;
  updateClassFee(id: string, fee: Partial<InsertClassFee>): Promise<ClassFee>;
  deleteClassFee(id: string): Promise<void>;
  
  // Fee Payment operations
  getFeePayments(studentId: string, termId?: string): Promise<FeePayment[]>;
  getSchoolFeePayments(schoolId: string, termId?: string): Promise<FeePayment[]>;
  createFeePayment(payment: InsertFeePayment): Promise<FeePayment>;
  updateFeePayment(id: string, payment: Partial<InsertFeePayment>): Promise<FeePayment>;
  getStudentFeeBalance(studentId: string, termId: string): Promise<{ total: number; paid: number; balance: number }>;
  
  // ============================================
  // TIMETABLE OPERATIONS
  // ============================================
  
  getTimetablePeriods(schoolId: string): Promise<TimetablePeriod[]>;
  createTimetablePeriod(period: InsertTimetablePeriod): Promise<TimetablePeriod>;
  updateTimetablePeriod(id: string, period: Partial<InsertTimetablePeriod>): Promise<TimetablePeriod>;
  deleteTimetablePeriod(id: string): Promise<void>;
  
  getTimetableEntries(classId: string, termId?: string): Promise<TimetableEntry[]>;
  getTeacherTimetable(teacherId: string, termId?: string): Promise<TimetableEntry[]>;
  createTimetableEntry(entry: InsertTimetableEntry): Promise<TimetableEntry>;
  updateTimetableEntry(id: string, entry: Partial<InsertTimetableEntry>): Promise<TimetableEntry>;
  deleteTimetableEntry(id: string): Promise<void>;
  
  // ============================================
  // COMMUNICATION OPERATIONS
  // ============================================
  
  getSchoolAnnouncements(schoolId: string, published?: boolean): Promise<SchoolAnnouncement[]>;
  getSchoolAnnouncement(id: string): Promise<SchoolAnnouncement | undefined>;
  createSchoolAnnouncement(announcement: InsertSchoolAnnouncement): Promise<SchoolAnnouncement>;
  updateSchoolAnnouncement(id: string, announcement: Partial<InsertSchoolAnnouncement>): Promise<SchoolAnnouncement>;
  deleteSchoolAnnouncement(id: string): Promise<void>;
  
  getSchoolUserNotifications(userId: string, limit?: number): Promise<SchoolNotification[]>;
  createSchoolNotification(notification: InsertSchoolNotification): Promise<SchoolNotification>;
  markSchoolNotificationAsRead(id: string): Promise<void>;
  deleteSchoolNotification(id: string): Promise<void>;
  
  // ============================================
  // SCHOOL RESOURCES OPERATIONS
  // ============================================
  
  getSchoolMaterials(schoolId: string, classId?: string, subjectId?: string): Promise<SchoolMaterial[]>;
  getSchoolMaterial(id: string): Promise<SchoolMaterial | undefined>;
  createSchoolMaterial(material: InsertSchoolMaterial): Promise<SchoolMaterial>;
  updateSchoolMaterial(id: string, material: Partial<InsertSchoolMaterial>): Promise<SchoolMaterial>;
  deleteSchoolMaterial(id: string): Promise<void>;
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

  // ============================================
  // SCHOOL MANAGEMENT SYSTEM (SMS) OPERATIONS
  // ============================================

  // Subscription Plan operations
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db
      .select()
      .from(subscriptionPlans)
      .orderBy(subscriptionPlans.displayOrder);
  }

  async getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.displayOrder);
  }

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async getSubscriptionPlanByCode(code: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.code, code));
    return plan;
  }

  async createSubscriptionPlan(planData: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [plan] = await db
      .insert(subscriptionPlans)
      .values(planData)
      .returning();
    return plan;
  }

  // School operations
  async getSchools(): Promise<School[]> {
    return await db
      .select()
      .from(schools)
      .orderBy(desc(schools.createdAt));
  }

  async getSchool(id: string): Promise<School | undefined> {
    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.id, id));
    return school;
  }

  async getSchoolBySubdomain(subdomain: string): Promise<School | undefined> {
    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.subdomain, subdomain.toLowerCase()));
    return school;
  }

  async getSchoolBySlug(slug: string): Promise<School | undefined> {
    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.slug, slug));
    return school;
  }

  async getSchoolsByOwner(ownerId: string): Promise<School[]> {
    return await db
      .select()
      .from(schools)
      .where(eq(schools.ownerId, ownerId))
      .orderBy(desc(schools.createdAt));
  }

  async createSchool(schoolData: InsertSchool): Promise<School> {
    const slug = schoolData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const [school] = await db
      .insert(schools)
      .values({
        ...schoolData,
        subdomain: schoolData.subdomain.toLowerCase(),
        slug,
      })
      .returning();
    return school;
  }

  async updateSchool(id: string, schoolData: Partial<UpdateSchool>): Promise<School> {
    const [school] = await db
      .update(schools)
      .set({ ...schoolData, updatedAt: new Date() })
      .where(eq(schools.id, id))
      .returning();
    return school;
  }

  async checkSubdomainAvailability(subdomain: string): Promise<boolean> {
    const existing = await this.getSchoolBySubdomain(subdomain.toLowerCase());
    return !existing;
  }

  async activateSchoolTrial(schoolId: string, trialDays: number = 14): Promise<School> {
    const now = new Date();
    const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
    
    const [school] = await db
      .update(schools)
      .set({
        subscriptionStatus: 'trial',
        trialStartDate: now,
        trialEndDate: trialEnd,
        updatedAt: now,
      })
      .where(eq(schools.id, schoolId))
      .returning();
    return school;
  }

  async updateSchoolSubscription(
    schoolId: string, 
    planId: string, 
    status: string, 
    endDate?: Date
  ): Promise<School> {
    const [school] = await db
      .update(schools)
      .set({
        subscriptionPlanId: planId,
        subscriptionStatus: status,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: endDate || null,
        updatedAt: new Date(),
      })
      .where(eq(schools.id, schoolId))
      .returning();
    return school;
  }

  // School User operations
  async getSchoolUsers(schoolId: string): Promise<SchoolUser[]> {
    return await db
      .select()
      .from(schoolUsers)
      .where(eq(schoolUsers.schoolId, schoolId))
      .orderBy(desc(schoolUsers.createdAt));
  }

  async getSchoolUsersByRole(schoolId: string, role: string): Promise<SchoolUser[]> {
    return await db
      .select()
      .from(schoolUsers)
      .where(and(eq(schoolUsers.schoolId, schoolId), eq(schoolUsers.role, role)))
      .orderBy(schoolUsers.lastName);
  }

  async getSchoolUser(id: string): Promise<SchoolUser | undefined> {
    const [user] = await db
      .select()
      .from(schoolUsers)
      .where(eq(schoolUsers.id, id));
    return user;
  }

  async getSchoolUserByEmail(schoolId: string, email: string): Promise<SchoolUser | undefined> {
    const [user] = await db
      .select()
      .from(schoolUsers)
      .where(and(eq(schoolUsers.schoolId, schoolId), eq(schoolUsers.email, email.toLowerCase())));
    return user;
  }

  async createSchoolUser(userData: InsertSchoolUser): Promise<SchoolUser> {
    const [user] = await db
      .insert(schoolUsers)
      .values({
        ...userData,
        email: userData.email.toLowerCase(),
      })
      .returning();
    return user;
  }

  async updateSchoolUser(id: string, userData: Partial<UpdateSchoolUser>): Promise<SchoolUser> {
    const [user] = await db
      .update(schoolUsers)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(schoolUsers.id, id))
      .returning();
    return user;
  }

  async deleteSchoolUser(id: string): Promise<void> {
    await db.delete(schoolUsers).where(eq(schoolUsers.id, id));
  }

  // Parent-Student Link operations
  async getParentStudentLinks(parentId: string): Promise<ParentStudentLink[]> {
    return await db
      .select()
      .from(parentStudentLinks)
      .where(eq(parentStudentLinks.parentId, parentId));
  }

  async getStudentParentLinks(studentId: string): Promise<ParentStudentLink[]> {
    return await db
      .select()
      .from(parentStudentLinks)
      .where(eq(parentStudentLinks.studentId, studentId));
  }

  async createParentStudentLink(linkData: InsertParentStudentLink): Promise<ParentStudentLink> {
    const [link] = await db
      .insert(parentStudentLinks)
      .values(linkData)
      .returning();
    return link;
  }

  async deleteParentStudentLink(parentId: string, studentId: string): Promise<void> {
    await db.delete(parentStudentLinks).where(
      and(
        eq(parentStudentLinks.parentId, parentId),
        eq(parentStudentLinks.studentId, studentId)
      )
    );
  }

  // ============================================
  // ACADEMIC STRUCTURE IMPLEMENTATIONS
  // ============================================

  async getAcademicTerms(schoolId: string): Promise<AcademicTerm[]> {
    return await db.select().from(academicTerms).where(eq(academicTerms.schoolId, schoolId)).orderBy(desc(academicTerms.startDate));
  }

  async getCurrentAcademicTerm(schoolId: string): Promise<AcademicTerm | undefined> {
    const [term] = await db.select().from(academicTerms).where(and(eq(academicTerms.schoolId, schoolId), eq(academicTerms.isCurrent, true)));
    return term;
  }

  async getAcademicTerm(id: string): Promise<AcademicTerm | undefined> {
    const [term] = await db.select().from(academicTerms).where(eq(academicTerms.id, id));
    return term;
  }

  async createAcademicTerm(termData: InsertAcademicTerm): Promise<AcademicTerm> {
    const [term] = await db.insert(academicTerms).values(termData).returning();
    return term;
  }

  async updateAcademicTerm(id: string, termData: Partial<InsertAcademicTerm>): Promise<AcademicTerm> {
    const [term] = await db.update(academicTerms).set({ ...termData, updatedAt: new Date() }).where(eq(academicTerms.id, id)).returning();
    return term;
  }

  async setCurrentAcademicTerm(schoolId: string, termId: string): Promise<void> {
    await db.update(academicTerms).set({ isCurrent: false }).where(eq(academicTerms.schoolId, schoolId));
    await db.update(academicTerms).set({ isCurrent: true }).where(eq(academicTerms.id, termId));
  }

  async deleteAcademicTerm(id: string): Promise<void> {
    await db.delete(academicTerms).where(eq(academicTerms.id, id));
  }

  async getSchoolClasses(schoolId: string): Promise<SchoolClass[]> {
    return await db.select().from(schoolClasses).where(eq(schoolClasses.schoolId, schoolId)).orderBy(schoolClasses.level, schoolClasses.name);
  }

  async getSchoolClass(id: string): Promise<SchoolClass | undefined> {
    const [cls] = await db.select().from(schoolClasses).where(eq(schoolClasses.id, id));
    return cls;
  }

  async createSchoolClass(classData: InsertSchoolClass): Promise<SchoolClass> {
    const [cls] = await db.insert(schoolClasses).values(classData).returning();
    return cls;
  }

  async updateSchoolClass(id: string, classData: Partial<InsertSchoolClass>): Promise<SchoolClass> {
    const [cls] = await db.update(schoolClasses).set({ ...classData, updatedAt: new Date() }).where(eq(schoolClasses.id, id)).returning();
    return cls;
  }

  async deleteSchoolClass(id: string): Promise<void> {
    await db.delete(schoolClasses).where(eq(schoolClasses.id, id));
  }

  async getSchoolSubjects(schoolId: string): Promise<SchoolSubject[]> {
    return await db.select().from(schoolSubjects).where(eq(schoolSubjects.schoolId, schoolId)).orderBy(schoolSubjects.name);
  }

  async getSchoolSubject(id: string): Promise<SchoolSubject | undefined> {
    const [subject] = await db.select().from(schoolSubjects).where(eq(schoolSubjects.id, id));
    return subject;
  }

  async createSchoolSubject(subjectData: InsertSchoolSubject): Promise<SchoolSubject> {
    const [subject] = await db.insert(schoolSubjects).values(subjectData).returning();
    return subject;
  }

  async updateSchoolSubject(id: string, subjectData: Partial<InsertSchoolSubject>): Promise<SchoolSubject> {
    const [subject] = await db.update(schoolSubjects).set({ ...subjectData, updatedAt: new Date() }).where(eq(schoolSubjects.id, id)).returning();
    return subject;
  }

  async deleteSchoolSubject(id: string): Promise<void> {
    await db.delete(schoolSubjects).where(eq(schoolSubjects.id, id));
  }

  async getClassSubjects(classId: string): Promise<ClassSubject[]> {
    return await db.select().from(classSubjects).where(eq(classSubjects.classId, classId));
  }

  async addSubjectToClass(data: InsertClassSubject): Promise<ClassSubject> {
    const [cs] = await db.insert(classSubjects).values(data).returning();
    return cs;
  }

  async removeSubjectFromClass(classId: string, subjectId: string): Promise<void> {
    await db.delete(classSubjects).where(and(eq(classSubjects.classId, classId), eq(classSubjects.subjectId, subjectId)));
  }

  async getTeacherAssignments(schoolId: string, termId?: string): Promise<TeacherAssignment[]> {
    if (termId) {
      return await db.select().from(teacherAssignments).where(and(eq(teacherAssignments.schoolId, schoolId), eq(teacherAssignments.termId, termId)));
    }
    return await db.select().from(teacherAssignments).where(eq(teacherAssignments.schoolId, schoolId));
  }

  async getTeacherAssignmentsByTeacher(teacherId: string): Promise<TeacherAssignment[]> {
    return await db.select().from(teacherAssignments).where(eq(teacherAssignments.teacherId, teacherId));
  }

  async getTeacherAssignmentsByClass(classId: string): Promise<TeacherAssignment[]> {
    return await db.select().from(teacherAssignments).where(eq(teacherAssignments.classId, classId));
  }

  async createTeacherAssignment(assignmentData: InsertTeacherAssignment): Promise<TeacherAssignment> {
    const [assignment] = await db.insert(teacherAssignments).values(assignmentData).returning();
    return assignment;
  }

  async updateTeacherAssignment(id: string, assignmentData: Partial<InsertTeacherAssignment>): Promise<TeacherAssignment> {
    const [assignment] = await db.update(teacherAssignments).set({ ...assignmentData, updatedAt: new Date() }).where(eq(teacherAssignments.id, id)).returning();
    return assignment;
  }

  async deleteTeacherAssignment(id: string): Promise<void> {
    await db.delete(teacherAssignments).where(eq(teacherAssignments.id, id));
  }

  async getClassEnrollments(classId: string, termId?: string): Promise<ClassEnrollment[]> {
    if (termId) {
      return await db.select().from(classEnrollments).where(and(eq(classEnrollments.classId, classId), eq(classEnrollments.termId, termId)));
    }
    return await db.select().from(classEnrollments).where(eq(classEnrollments.classId, classId));
  }

  async getStudentEnrollments(studentId: string): Promise<ClassEnrollment[]> {
    return await db.select().from(classEnrollments).where(eq(classEnrollments.studentId, studentId));
  }

  async enrollStudent(enrollmentData: InsertClassEnrollment): Promise<ClassEnrollment> {
    const [enrollment] = await db.insert(classEnrollments).values(enrollmentData).returning();
    return enrollment;
  }

  async updateEnrollment(id: string, enrollmentData: Partial<InsertClassEnrollment>): Promise<ClassEnrollment> {
    const [enrollment] = await db.update(classEnrollments).set(enrollmentData).where(eq(classEnrollments.id, id)).returning();
    return enrollment;
  }

  async deleteEnrollment(id: string): Promise<void> {
    await db.delete(classEnrollments).where(eq(classEnrollments.id, id));
  }

  // ============================================
  // ATTENDANCE IMPLEMENTATIONS
  // ============================================

  async getAttendanceRecords(classId: string, date: Date, subjectId?: string): Promise<AttendanceRecord[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const conditions = [
      eq(attendanceRecords.classId, classId),
      sql`${attendanceRecords.date} >= ${startOfDay} AND ${attendanceRecords.date} <= ${endOfDay}`
    ];
    
    if (subjectId) {
      conditions.push(eq(attendanceRecords.subjectId, subjectId));
    } else {
      conditions.push(sql`${attendanceRecords.subjectId} IS NULL`);
    }
    
    return await db.select().from(attendanceRecords).where(and(...conditions));
  }

  async getStudentAttendance(studentId: string, termId: string): Promise<AttendanceRecord[]> {
    return await db.select().from(attendanceRecords).where(and(eq(attendanceRecords.studentId, studentId), eq(attendanceRecords.termId, termId))).orderBy(attendanceRecords.date);
  }

  async getSubjectAttendance(classId: string, subjectId: string, termId: string): Promise<AttendanceRecord[]> {
    return await db.select().from(attendanceRecords).where(
      and(
        eq(attendanceRecords.classId, classId),
        eq(attendanceRecords.subjectId, subjectId),
        eq(attendanceRecords.termId, termId)
      )
    ).orderBy(attendanceRecords.date);
  }

  async markAttendance(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const [attendance] = await db.insert(attendanceRecords).values(record).returning();
    return attendance;
  }

  async bulkMarkAttendance(records: InsertAttendanceRecord[]): Promise<AttendanceRecord[]> {
    const result = await db.insert(attendanceRecords).values(records).returning();
    return result;
  }

  async updateAttendance(id: string, record: Partial<InsertAttendanceRecord>): Promise<AttendanceRecord> {
    const [attendance] = await db.update(attendanceRecords).set({ ...record, updatedAt: new Date() }).where(eq(attendanceRecords.id, id)).returning();
    return attendance;
  }

  async getAttendanceSummary(classId: string, termId: string): Promise<{ studentId: string; present: number; absent: number; late: number; excused: number }[]> {
    const records = await db.select().from(attendanceRecords).where(and(eq(attendanceRecords.classId, classId), eq(attendanceRecords.termId, termId)));
    const summary: { [studentId: string]: { present: number; absent: number; late: number; excused: number } } = {};
    for (const record of records) {
      if (!summary[record.studentId]) {
        summary[record.studentId] = { present: 0, absent: 0, late: 0, excused: 0 };
      }
      if (record.status === 'present') summary[record.studentId].present++;
      else if (record.status === 'absent') summary[record.studentId].absent++;
      else if (record.status === 'late') summary[record.studentId].late++;
      else if (record.status === 'excused') summary[record.studentId].excused++;
    }
    return Object.entries(summary).map(([studentId, counts]) => ({ studentId, ...counts }));
  }

  async getStudentAttendanceSummary(studentId: string, termId: string): Promise<{ present: number; absent: number; late: number; excused: number; totalDays: number; rate: number }> {
    const records = await db.select().from(attendanceRecords).where(
      and(
        eq(attendanceRecords.studentId, studentId),
        eq(attendanceRecords.termId, termId),
        sql`${attendanceRecords.subjectId} IS NULL`
      )
    );
    
    const summary = { present: 0, absent: 0, late: 0, excused: 0 };
    for (const record of records) {
      if (record.status === 'present') summary.present++;
      else if (record.status === 'absent') summary.absent++;
      else if (record.status === 'late') summary.late++;
      else if (record.status === 'excused') summary.excused++;
    }
    
    const totalDays = summary.present + summary.absent + summary.late + summary.excused;
    const rate = totalDays > 0 ? Math.round(((summary.present + summary.late) / totalDays) * 100) : 0;
    
    return { ...summary, totalDays, rate };
  }

  async getAttendanceReport(classId: string, termId: string, startDate: Date, endDate: Date): Promise<AttendanceRecord[]> {
    return await db.select().from(attendanceRecords).where(
      and(
        eq(attendanceRecords.classId, classId),
        eq(attendanceRecords.termId, termId),
        sql`${attendanceRecords.date} >= ${startDate} AND ${attendanceRecords.date} <= ${endDate}`
      )
    ).orderBy(attendanceRecords.date);
  }

  // ============================================
  // GRADES & ASSESSMENTS IMPLEMENTATIONS
  // ============================================

  async getAssessmentTypes(schoolId: string): Promise<AssessmentType[]> {
    return await db.select().from(assessmentTypes).where(eq(assessmentTypes.schoolId, schoolId));
  }

  async getAssessmentType(id: string): Promise<AssessmentType | undefined> {
    const [type] = await db.select().from(assessmentTypes).where(eq(assessmentTypes.id, id));
    return type;
  }

  async createAssessmentType(typeData: InsertAssessmentType): Promise<AssessmentType> {
    const [type] = await db.insert(assessmentTypes).values(typeData).returning();
    return type;
  }

  async updateAssessmentType(id: string, typeData: Partial<InsertAssessmentType>): Promise<AssessmentType> {
    const [type] = await db.update(assessmentTypes).set(typeData).where(eq(assessmentTypes.id, id)).returning();
    return type;
  }

  async deleteAssessmentType(id: string): Promise<void> {
    await db.delete(assessmentTypes).where(eq(assessmentTypes.id, id));
  }

  async getStudentGrades(studentId: string, termId: string): Promise<StudentGrade[]> {
    return await db.select().from(studentGrades).where(and(eq(studentGrades.studentId, studentId), eq(studentGrades.termId, termId)));
  }

  async getClassGrades(classId: string, subjectId: string, termId: string): Promise<StudentGrade[]> {
    return await db.select().from(studentGrades).where(and(eq(studentGrades.classId, classId), eq(studentGrades.subjectId, subjectId), eq(studentGrades.termId, termId)));
  }

  async createStudentGrade(gradeData: InsertStudentGrade): Promise<StudentGrade> {
    const [grade] = await db.insert(studentGrades).values(gradeData).returning();
    return grade;
  }

  async updateStudentGrade(id: string, gradeData: Partial<InsertStudentGrade>): Promise<StudentGrade> {
    const [grade] = await db.update(studentGrades).set({ ...gradeData, updatedAt: new Date() }).where(eq(studentGrades.id, id)).returning();
    return grade;
  }

  async deleteStudentGrade(id: string): Promise<void> {
    await db.delete(studentGrades).where(eq(studentGrades.id, id));
  }

  async getTermResults(studentId: string, termId: string): Promise<TermResult[]> {
    return await db.select().from(termResults).where(and(eq(termResults.studentId, studentId), eq(termResults.termId, termId)));
  }

  async getClassTermResults(classId: string, termId: string): Promise<TermResult[]> {
    return await db.select().from(termResults).where(and(eq(termResults.classId, classId), eq(termResults.termId, termId)));
  }

  async createTermResult(resultData: InsertTermResult): Promise<TermResult> {
    const [result] = await db.insert(termResults).values(resultData).returning();
    return result;
  }

  async updateTermResult(id: string, resultData: Partial<InsertTermResult>): Promise<TermResult> {
    const [result] = await db.update(termResults).set({ ...resultData, updatedAt: new Date() }).where(eq(termResults.id, id)).returning();
    return result;
  }

  async bulkCreateStudentGrades(gradesData: InsertStudentGrade[]): Promise<StudentGrade[]> {
    if (gradesData.length === 0) return [];
    
    const results: StudentGrade[] = [];
    for (const gradeData of gradesData) {
      const existing = await db.select().from(studentGrades).where(
        and(
          eq(studentGrades.studentId, gradeData.studentId),
          eq(studentGrades.subjectId, gradeData.subjectId),
          eq(studentGrades.termId, gradeData.termId),
          eq(studentGrades.assessmentTypeId, gradeData.assessmentTypeId)
        )
      );
      
      if (existing.length > 0) {
        const [updated] = await db.update(studentGrades)
          .set({ score: gradeData.score, maxScore: gradeData.maxScore, gradedAt: new Date() })
          .where(eq(studentGrades.id, existing[0].id))
          .returning();
        results.push(updated);
      } else {
        const [created] = await db.insert(studentGrades).values(gradeData).returning();
        results.push(created);
      }
    }
    return results;
  }

  async getStudentGradesSummary(studentId: string, termId: string): Promise<{ subjectId: string; subjectName: string; averageScore: number; grade: string }[]> {
    const grades = await db.select().from(studentGrades).where(
      and(eq(studentGrades.studentId, studentId), eq(studentGrades.termId, termId))
    );
    
    if (grades.length === 0) return [];
    
    const firstGrade = grades[0];
    const schoolId = firstGrade.schoolId;
    const assessmentTypesData = await this.getAssessmentTypes(schoolId);
    
    const subjectScores: { [subjectId: string]: { weightedScore: number; totalWeight: number } } = {};
    for (const grade of grades) {
      if (!subjectScores[grade.subjectId]) {
        subjectScores[grade.subjectId] = { weightedScore: 0, totalWeight: 0 };
      }
      
      const assessmentType = assessmentTypesData.find(at => at.id === grade.assessmentTypeId);
      if (assessmentType) {
        const percentage = (grade.score / grade.maxScore) * 100;
        subjectScores[grade.subjectId].weightedScore += (percentage * assessmentType.weight) / 100;
        subjectScores[grade.subjectId].totalWeight += assessmentType.weight;
      }
    }
    
    const summaries: { subjectId: string; subjectName: string; averageScore: number; grade: string }[] = [];
    for (const [subjectId, scores] of Object.entries(subjectScores)) {
      const subject = await db.select().from(schoolSubjects).where(eq(schoolSubjects.id, subjectId));
      const percentage = scores.totalWeight > 0 
        ? Math.round((scores.weightedScore / scores.totalWeight) * 100) 
        : 0;
      let grade = 'F';
      if (percentage >= 70) grade = 'A';
      else if (percentage >= 60) grade = 'B';
      else if (percentage >= 50) grade = 'C';
      else if (percentage >= 40) grade = 'D';
      
      summaries.push({
        subjectId,
        subjectName: subject[0]?.name || 'Unknown Subject',
        averageScore: percentage,
        grade,
      });
    }
    
    return summaries.sort((a, b) => b.averageScore - a.averageScore);
  }

  async calculateTermResults(schoolId: string, classId: string, termId: string): Promise<TermResult[]> {
    const students = await this.getClassStudents(classId);
    const subjects = await db.select().from(classSubjects).where(eq(classSubjects.classId, classId));
    const assessmentTypesData = await this.getAssessmentTypes(schoolId);
    
    const results: TermResult[] = [];
    
    for (const subjectLink of subjects) {
      const subjectId = subjectLink.subjectId;
      const studentScores: { studentId: string; totalScore: number; totalWeight: number }[] = [];
      
      for (const student of students) {
        const grades = await db.select().from(studentGrades).where(
          and(
            eq(studentGrades.studentId, student.id),
            eq(studentGrades.subjectId, subjectId),
            eq(studentGrades.termId, termId)
          )
        );
        
        let totalWeightedScore = 0;
        let totalWeight = 0;
        
        for (const grade of grades) {
          const assessmentType = assessmentTypesData.find(at => at.id === grade.assessmentTypeId);
          if (assessmentType) {
            const percentage = (grade.score / grade.maxScore) * 100;
            totalWeightedScore += (percentage * assessmentType.weight) / 100;
            totalWeight += assessmentType.weight;
          }
        }
        
        if (totalWeight > 0) {
          studentScores.push({
            studentId: student.id,
            totalScore: Math.round((totalWeightedScore / totalWeight) * 100),
            totalWeight,
          });
        }
      }
      
      studentScores.sort((a, b) => b.totalScore - a.totalScore);
      const scores = studentScores.map(s => s.totalScore);
      const classAverage = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const highestScore = Math.max(...scores, 0);
      const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
      
      for (let i = 0; i < studentScores.length; i++) {
        const { studentId, totalScore } = studentScores[i];
        let grade = 'F';
        let gradePoint = 0;
        if (totalScore >= 70) { grade = 'A'; gradePoint = 4.0; }
        else if (totalScore >= 60) { grade = 'B'; gradePoint = 3.0; }
        else if (totalScore >= 50) { grade = 'C'; gradePoint = 2.0; }
        else if (totalScore >= 40) { grade = 'D'; gradePoint = 1.0; }
        
        const existingResults = await db.select().from(termResults).where(
          and(
            eq(termResults.studentId, studentId),
            eq(termResults.subjectId, subjectId),
            eq(termResults.termId, termId)
          )
        );
        
        const resultData = {
          schoolId,
          studentId,
          classId,
          subjectId,
          termId,
          totalScore,
          grade,
          gradePoint,
          position: i + 1,
          classAverage,
          highestScore,
          lowestScore,
          remarks: null,
        };
        
        if (existingResults.length > 0) {
          const [updated] = await db.update(termResults)
            .set({ ...resultData, updatedAt: new Date() })
            .where(eq(termResults.id, existingResults[0].id))
            .returning();
          results.push(updated);
        } else {
          const [created] = await db.insert(termResults).values(resultData).returning();
          results.push(created);
        }
      }
    }
    
    return results;
  }

  async getStudentFeeSummary(studentId: string): Promise<{ totalDue: number; totalPaid: number; balance: number }> {
    const enrollments = await this.getStudentEnrollments(studentId);
    let totalDue = 0;
    let totalPaid = 0;
    
    for (const enrollment of enrollments) {
      const fees = await this.getClassFees(enrollment.classId, enrollment.termId);
      totalDue += fees.reduce((sum, f) => sum + f.amount, 0);
      
      const payments = await this.getFeePayments(studentId, enrollment.termId);
      totalPaid += payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
    }
    
    return { totalDue, totalPaid, balance: totalDue - totalPaid };
  }

  // ============================================
  // FEES & PAYMENTS IMPLEMENTATIONS
  // ============================================

  async getFeeTypes(schoolId: string): Promise<FeeType[]> {
    return await db.select().from(feeTypes).where(eq(feeTypes.schoolId, schoolId));
  }

  async getFeeType(id: string): Promise<FeeType | undefined> {
    const [fee] = await db.select().from(feeTypes).where(eq(feeTypes.id, id));
    return fee;
  }

  async createFeeType(feeData: InsertFeeType): Promise<FeeType> {
    const [fee] = await db.insert(feeTypes).values(feeData).returning();
    return fee;
  }

  async updateFeeType(id: string, feeData: Partial<InsertFeeType>): Promise<FeeType> {
    const [fee] = await db.update(feeTypes).set({ ...feeData, updatedAt: new Date() }).where(eq(feeTypes.id, id)).returning();
    return fee;
  }

  async deleteFeeType(id: string): Promise<void> {
    await db.delete(feeTypes).where(eq(feeTypes.id, id));
  }

  async getClassFees(classId: string, termId?: string): Promise<ClassFee[]> {
    if (termId) {
      return await db.select().from(classFees).where(and(eq(classFees.classId, classId), eq(classFees.termId, termId)));
    }
    return await db.select().from(classFees).where(eq(classFees.classId, classId));
  }

  async createClassFee(feeData: InsertClassFee): Promise<ClassFee> {
    const [fee] = await db.insert(classFees).values(feeData).returning();
    return fee;
  }

  async updateClassFee(id: string, feeData: Partial<InsertClassFee>): Promise<ClassFee> {
    const [fee] = await db.update(classFees).set(feeData).where(eq(classFees.id, id)).returning();
    return fee;
  }

  async deleteClassFee(id: string): Promise<void> {
    await db.delete(classFees).where(eq(classFees.id, id));
  }

  async getFeePayments(studentId: string, termId?: string): Promise<FeePayment[]> {
    if (termId) {
      return await db.select().from(feePayments).where(and(eq(feePayments.studentId, studentId), eq(feePayments.termId, termId)));
    }
    return await db.select().from(feePayments).where(eq(feePayments.studentId, studentId));
  }

  async getSchoolFeePayments(schoolId: string, termId?: string): Promise<FeePayment[]> {
    if (termId) {
      return await db.select().from(feePayments).where(and(eq(feePayments.schoolId, schoolId), eq(feePayments.termId, termId))).orderBy(desc(feePayments.createdAt));
    }
    return await db.select().from(feePayments).where(eq(feePayments.schoolId, schoolId)).orderBy(desc(feePayments.createdAt));
  }

  async createFeePayment(paymentData: InsertFeePayment): Promise<FeePayment> {
    const [payment] = await db.insert(feePayments).values(paymentData).returning();
    return payment;
  }

  async updateFeePayment(id: string, paymentData: Partial<InsertFeePayment>): Promise<FeePayment> {
    const [payment] = await db.update(feePayments).set({ ...paymentData, updatedAt: new Date() }).where(eq(feePayments.id, id)).returning();
    return payment;
  }

  async getStudentFeeBalance(studentId: string, termId: string): Promise<{ total: number; paid: number; balance: number }> {
    const enrollment = await this.getStudentEnrollments(studentId);
    const classId = enrollment.find(e => e.termId === termId)?.classId;
    if (!classId) return { total: 0, paid: 0, balance: 0 };
    
    const fees = await this.getClassFees(classId, termId);
    const total = fees.reduce((sum, f) => sum + f.amount, 0);
    
    const payments = await this.getFeePayments(studentId, termId);
    const paid = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
    
    return { total, paid, balance: total - paid };
  }

  // ============================================
  // TIMETABLE IMPLEMENTATIONS
  // ============================================

  async getTimetablePeriods(schoolId: string): Promise<TimetablePeriod[]> {
    return await db.select().from(timetablePeriods).where(eq(timetablePeriods.schoolId, schoolId)).orderBy(timetablePeriods.orderIndex);
  }

  async createTimetablePeriod(periodData: InsertTimetablePeriod): Promise<TimetablePeriod> {
    const [period] = await db.insert(timetablePeriods).values(periodData).returning();
    return period;
  }

  async updateTimetablePeriod(id: string, periodData: Partial<InsertTimetablePeriod>): Promise<TimetablePeriod> {
    const [period] = await db.update(timetablePeriods).set(periodData).where(eq(timetablePeriods.id, id)).returning();
    return period;
  }

  async deleteTimetablePeriod(id: string): Promise<void> {
    await db.delete(timetablePeriods).where(eq(timetablePeriods.id, id));
  }

  async getTimetableEntries(classId: string, termId?: string): Promise<TimetableEntry[]> {
    if (termId) {
      return await db.select().from(timetableEntries).where(and(eq(timetableEntries.classId, classId), eq(timetableEntries.termId, termId)));
    }
    return await db.select().from(timetableEntries).where(eq(timetableEntries.classId, classId));
  }

  async getTeacherTimetable(teacherId: string, termId?: string): Promise<TimetableEntry[]> {
    if (termId) {
      return await db.select().from(timetableEntries).where(and(eq(timetableEntries.teacherId, teacherId), eq(timetableEntries.termId, termId)));
    }
    return await db.select().from(timetableEntries).where(eq(timetableEntries.teacherId, teacherId));
  }

  async createTimetableEntry(entryData: InsertTimetableEntry): Promise<TimetableEntry> {
    const [entry] = await db.insert(timetableEntries).values(entryData).returning();
    return entry;
  }

  async updateTimetableEntry(id: string, entryData: Partial<InsertTimetableEntry>): Promise<TimetableEntry> {
    const [entry] = await db.update(timetableEntries).set({ ...entryData, updatedAt: new Date() }).where(eq(timetableEntries.id, id)).returning();
    return entry;
  }

  async deleteTimetableEntry(id: string): Promise<void> {
    await db.delete(timetableEntries).where(eq(timetableEntries.id, id));
  }

  // ============================================
  // COMMUNICATION IMPLEMENTATIONS
  // ============================================

  async getSchoolAnnouncements(schoolId: string, published?: boolean): Promise<SchoolAnnouncement[]> {
    if (published !== undefined) {
      return await db.select().from(schoolAnnouncements).where(and(eq(schoolAnnouncements.schoolId, schoolId), eq(schoolAnnouncements.isPublished, published))).orderBy(desc(schoolAnnouncements.createdAt));
    }
    return await db.select().from(schoolAnnouncements).where(eq(schoolAnnouncements.schoolId, schoolId)).orderBy(desc(schoolAnnouncements.createdAt));
  }

  async getSchoolAnnouncement(id: string): Promise<SchoolAnnouncement | undefined> {
    const [announcement] = await db.select().from(schoolAnnouncements).where(eq(schoolAnnouncements.id, id));
    return announcement;
  }

  async createSchoolAnnouncement(announcementData: InsertSchoolAnnouncement): Promise<SchoolAnnouncement> {
    const [announcement] = await db.insert(schoolAnnouncements).values(announcementData).returning();
    return announcement;
  }

  async updateSchoolAnnouncement(id: string, announcementData: Partial<InsertSchoolAnnouncement>): Promise<SchoolAnnouncement> {
    const [announcement] = await db.update(schoolAnnouncements).set({ ...announcementData, updatedAt: new Date() }).where(eq(schoolAnnouncements.id, id)).returning();
    return announcement;
  }

  async deleteSchoolAnnouncement(id: string): Promise<void> {
    await db.delete(schoolAnnouncements).where(eq(schoolAnnouncements.id, id));
  }

  async getSchoolUserNotifications(userId: string, limit: number = 50): Promise<SchoolNotification[]> {
    return await db.select().from(schoolNotifications).where(eq(schoolNotifications.userId, userId)).orderBy(desc(schoolNotifications.createdAt)).limit(limit);
  }

  async createSchoolNotification(notificationData: InsertSchoolNotification): Promise<SchoolNotification> {
    const [notification] = await db.insert(schoolNotifications).values(notificationData).returning();
    return notification;
  }

  async markSchoolNotificationAsRead(id: string): Promise<void> {
    await db.update(schoolNotifications).set({ isRead: true }).where(eq(schoolNotifications.id, id));
  }

  async deleteSchoolNotification(id: string): Promise<void> {
    await db.delete(schoolNotifications).where(eq(schoolNotifications.id, id));
  }

  // ============================================
  // SCHOOL RESOURCES IMPLEMENTATIONS
  // ============================================

  async getSchoolMaterials(schoolId: string, classId?: string, subjectId?: string): Promise<SchoolMaterial[]> {
    let conditions = [eq(schoolMaterials.schoolId, schoolId)];
    if (classId) conditions.push(eq(schoolMaterials.classId, classId));
    if (subjectId) conditions.push(eq(schoolMaterials.subjectId, subjectId));
    return await db.select().from(schoolMaterials).where(and(...conditions)).orderBy(desc(schoolMaterials.createdAt));
  }

  async getSchoolMaterial(id: string): Promise<SchoolMaterial | undefined> {
    const [material] = await db.select().from(schoolMaterials).where(eq(schoolMaterials.id, id));
    return material;
  }

  async createSchoolMaterial(materialData: InsertSchoolMaterial): Promise<SchoolMaterial> {
    const [material] = await db.insert(schoolMaterials).values(materialData).returning();
    return material;
  }

  async updateSchoolMaterial(id: string, materialData: Partial<InsertSchoolMaterial>): Promise<SchoolMaterial> {
    const [material] = await db.update(schoolMaterials).set({ ...materialData, updatedAt: new Date() }).where(eq(schoolMaterials.id, id)).returning();
    return material;
  }

  async deleteSchoolMaterial(id: string): Promise<void> {
    await db.delete(schoolMaterials).where(eq(schoolMaterials.id, id));
  }
}

export const storage = new DatabaseStorage();
