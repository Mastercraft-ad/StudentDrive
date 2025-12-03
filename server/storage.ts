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
  subscriptionPayments,
  schoolConversations,
  schoolMessages,
  badges,
  userBadges,
  userGamification,
  xpTransactions,
  spacedRepetitionCards,
  learningRecommendations,
  dailyStudyLogs,
  studyGroups,
  studyGroupMembers,
  studyGroupMessages,
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
  type SubscriptionPayment,
  type InsertSubscriptionPayment,
  type SchoolConversation,
  type InsertSchoolConversation,
  type SchoolMessage,
  type InsertSchoolMessage,
  type Badge,
  type InsertBadge,
  type UserBadge,
  type InsertUserBadge,
  type UserGamification,
  type InsertUserGamification,
  type XpTransaction,
  type InsertXpTransaction,
  type SpacedRepetitionCard,
  type InsertSpacedRepetitionCard,
  type LearningRecommendation,
  type InsertLearningRecommendation,
  type DailyStudyLog,
  type InsertDailyStudyLog,
  type StudyGroup,
  type InsertStudyGroup,
  type StudyGroupMember,
  type InsertStudyGroupMember,
  type StudyGroupMessage,
  type InsertStudyGroupMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, ne, lte, gte, asc } from "drizzle-orm";

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
  cancelSchoolSubscription(schoolId: string): Promise<School>;
  
  // Subscription Payment operations
  getSubscriptionPayments(schoolId: string): Promise<SubscriptionPayment[]>;
  getSubscriptionPayment(id: string): Promise<SubscriptionPayment | undefined>;
  getSubscriptionPaymentByReference(reference: string): Promise<SubscriptionPayment | undefined>;
  createSubscriptionPayment(payment: InsertSubscriptionPayment): Promise<SubscriptionPayment>;
  updateSubscriptionPayment(id: string, payment: Partial<InsertSubscriptionPayment>): Promise<SubscriptionPayment>;
  completeSubscriptionPayment(id: string, transactionId: string): Promise<SubscriptionPayment>;
  
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
  getFeePayment(id: string): Promise<FeePayment | undefined>;
  getFeePaymentByReference(reference: string): Promise<FeePayment | undefined>;
  createFeePayment(payment: InsertFeePayment): Promise<FeePayment>;
  updateFeePayment(id: string, payment: Partial<InsertFeePayment> & { paidAt?: Date }): Promise<FeePayment>;
  getStudentFeeBalance(studentId: string, termId: string): Promise<{ total: number; paid: number; balance: number }>;
  getStudentOutstandingFees(studentId: string): Promise<Array<{ feeType: FeeType; classFee: ClassFee; termId: string; amountDue: number; amountPaid: number; balance: number }>>;
  generateReceiptNumber(schoolId: string): Promise<string>;
  getOverduePayments(schoolId: string): Promise<Array<{ student: SchoolUser; parent?: SchoolUser; balance: number; termId: string }>>;
  sendFeeReminder(schoolId: string, studentId: string, parentId: string, amount: number, termId: string): Promise<SchoolNotification>;
  
  // ============================================
  // TIMETABLE OPERATIONS
  // ============================================
  
  getTimetablePeriods(schoolId: string): Promise<TimetablePeriod[]>;
  createTimetablePeriod(period: InsertTimetablePeriod): Promise<TimetablePeriod>;
  updateTimetablePeriod(id: string, period: Partial<InsertTimetablePeriod>): Promise<TimetablePeriod>;
  deleteTimetablePeriod(id: string): Promise<void>;
  
  getTimetableEntries(classId: string, termId?: string): Promise<TimetableEntry[]>;
  getTeacherTimetable(teacherId: string, termId?: string): Promise<TimetableEntry[]>;
  checkTeacherConflict(teacherId: string, dayOfWeek: number, periodId: string, termId?: string, excludeEntryId?: string): Promise<TimetableEntry | undefined>;
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
  incrementMaterialViewCount(id: string): Promise<void>;
  incrementMaterialDownloadCount(id: string): Promise<void>;
  
  // ============================================
  // PARENT-TEACHER MESSAGING OPERATIONS
  // ============================================
  
  getConversations(userId: string, userType: 'parent' | 'teacher'): Promise<SchoolConversation[]>;
  getConversation(id: string): Promise<SchoolConversation | undefined>;
  createConversation(conversation: InsertSchoolConversation): Promise<SchoolConversation>;
  updateConversationLastMessage(id: string): Promise<void>;
  
  getMessages(conversationId: string, limit?: number, offset?: number): Promise<SchoolMessage[]>;
  createMessage(message: InsertSchoolMessage): Promise<SchoolMessage>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  getUnreadMessageCount(userId: string, userType: 'parent' | 'teacher'): Promise<number>;
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

  async cancelSchoolSubscription(schoolId: string): Promise<School> {
    const [school] = await db
      .update(schools)
      .set({
        subscriptionStatus: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(schools.id, schoolId))
      .returning();
    return school;
  }

  // Subscription Payment operations
  async getSubscriptionPayments(schoolId: string): Promise<SubscriptionPayment[]> {
    return await db
      .select()
      .from(subscriptionPayments)
      .where(eq(subscriptionPayments.schoolId, schoolId))
      .orderBy(desc(subscriptionPayments.createdAt));
  }

  async getSubscriptionPayment(id: string): Promise<SubscriptionPayment | undefined> {
    const [payment] = await db
      .select()
      .from(subscriptionPayments)
      .where(eq(subscriptionPayments.id, id));
    return payment;
  }

  async getSubscriptionPaymentByReference(reference: string): Promise<SubscriptionPayment | undefined> {
    const [payment] = await db
      .select()
      .from(subscriptionPayments)
      .where(eq(subscriptionPayments.paystackReference, reference));
    return payment;
  }

  async createSubscriptionPayment(payment: InsertSubscriptionPayment): Promise<SubscriptionPayment> {
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const [created] = await db
      .insert(subscriptionPayments)
      .values({
        ...payment,
        invoiceNumber,
      })
      .returning();
    return created;
  }

  async updateSubscriptionPayment(id: string, payment: Partial<InsertSubscriptionPayment>): Promise<SubscriptionPayment> {
    const [updated] = await db
      .update(subscriptionPayments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(subscriptionPayments.id, id))
      .returning();
    return updated;
  }

  async completeSubscriptionPayment(id: string, transactionId: string): Promise<SubscriptionPayment> {
    const [payment] = await db
      .update(subscriptionPayments)
      .set({
        status: 'completed',
        paystackTransactionId: transactionId,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptionPayments.id, id))
      .returning();
    return payment;
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

  async updateFeePayment(id: string, paymentData: Partial<InsertFeePayment> & { paidAt?: Date }): Promise<FeePayment> {
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

  async getFeePayment(id: string): Promise<FeePayment | undefined> {
    const [payment] = await db.select().from(feePayments).where(eq(feePayments.id, id));
    return payment;
  }

  async getFeePaymentByReference(reference: string): Promise<FeePayment | undefined> {
    const [payment] = await db.select().from(feePayments).where(eq(feePayments.paystackReference, reference));
    return payment;
  }

  async getStudentOutstandingFees(studentId: string): Promise<Array<{ feeType: FeeType; classFee: ClassFee; termId: string; amountDue: number; amountPaid: number; balance: number }>> {
    const enrollments = await this.getStudentEnrollments(studentId);
    const outstandingFees: Array<{ feeType: FeeType; classFee: ClassFee; termId: string; amountDue: number; amountPaid: number; balance: number }> = [];
    
    for (const enrollment of enrollments) {
      const fees = await this.getClassFees(enrollment.classId, enrollment.termId);
      const payments = await this.getFeePayments(studentId, enrollment.termId);
      
      for (const classFee of fees) {
        const feeType = await this.getFeeType(classFee.feeTypeId);
        if (!feeType) continue;
        
        const paidAmount = payments
          .filter(p => p.feeTypeId === classFee.feeTypeId && p.status === 'completed')
          .reduce((sum, p) => sum + p.amount, 0);
        
        const balance = classFee.amount - paidAmount;
        
        if (balance > 0) {
          outstandingFees.push({
            feeType,
            classFee,
            termId: enrollment.termId,
            amountDue: classFee.amount,
            amountPaid: paidAmount,
            balance,
          });
        }
      }
    }
    
    return outstandingFees;
  }

  async generateReceiptNumber(schoolId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await db.select({ count: sql<number>`count(*)` })
      .from(feePayments)
      .where(and(
        eq(feePayments.schoolId, schoolId),
        sql`EXTRACT(YEAR FROM ${feePayments.createdAt}) = ${year}`
      ));
    const nextNumber = (count[0]?.count || 0) + 1;
    return `RCP-${year}-${String(nextNumber).padStart(5, '0')}`;
  }

  async getOverduePayments(schoolId: string): Promise<Array<{ student: SchoolUser; parent?: SchoolUser; balance: number; termId: string }>> {
    const currentTerm = await db.select().from(academicTerms)
      .where(and(eq(academicTerms.schoolId, schoolId), eq(academicTerms.isCurrent, true)))
      .limit(1);
    
    if (!currentTerm.length) return [];
    const termId = currentTerm[0].id;

    const students = await db.select().from(schoolUsers)
      .where(and(eq(schoolUsers.schoolId, schoolId), eq(schoolUsers.role, 'student')));
    
    const overdueList: Array<{ student: SchoolUser; parent?: SchoolUser; balance: number; termId: string }> = [];

    for (const student of students) {
      const feeBalance = await this.getStudentFeeBalance(student.id, termId);
      if (feeBalance.balance > 0) {
        let parent: SchoolUser | undefined;
        if (student.parentId) {
          parent = await this.getSchoolUser(student.parentId);
        }
        overdueList.push({ student, parent, balance: feeBalance.balance, termId });
      }
    }

    return overdueList;
  }

  async sendFeeReminder(schoolId: string, studentId: string, parentId: string, amount: number, termId: string): Promise<SchoolNotification> {
    const term = await this.getAcademicTerm(termId);
    const student = await this.getSchoolUser(studentId);
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(amount / 100);
    };

    const notification: InsertSchoolNotification = {
      schoolId,
      userId: parentId,
      type: 'fee_reminder',
      title: 'Fee Payment Reminder',
      message: `This is a reminder that there is an outstanding balance of ${formatCurrency(amount)} for ${student?.firstName} ${student?.lastName} for ${term?.name || 'current term'}. Please make payment at your earliest convenience.`,
      link: '/school/parent/fees',
      metadata: { studentId, termId, amount },
    };

    return this.createSchoolNotification(notification);
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

  async checkTeacherConflict(teacherId: string, dayOfWeek: number, periodId: string, termId?: string, excludeEntryId?: string): Promise<TimetableEntry | undefined> {
    const conditions = [
      eq(timetableEntries.teacherId, teacherId),
      eq(timetableEntries.dayOfWeek, dayOfWeek),
      eq(timetableEntries.periodId, periodId),
    ];
    
    if (termId) {
      conditions.push(eq(timetableEntries.termId, termId));
    }
    
    if (excludeEntryId) {
      conditions.push(ne(timetableEntries.id, excludeEntryId));
    }
    
    const [conflict] = await db.select().from(timetableEntries).where(and(...conditions));
    return conflict;
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

  async incrementMaterialViewCount(id: string): Promise<void> {
    await db.update(schoolMaterials)
      .set({ viewCount: sql`${schoolMaterials.viewCount} + 1` })
      .where(eq(schoolMaterials.id, id));
  }

  async incrementMaterialDownloadCount(id: string): Promise<void> {
    await db.update(schoolMaterials)
      .set({ downloadCount: sql`${schoolMaterials.downloadCount} + 1` })
      .where(eq(schoolMaterials.id, id));
  }

  // ============================================
  // PARENT-TEACHER MESSAGING IMPLEMENTATIONS
  // ============================================

  async getConversations(userId: string, userType: 'parent' | 'teacher'): Promise<SchoolConversation[]> {
    const condition = userType === 'parent' 
      ? eq(schoolConversations.parentId, userId)
      : eq(schoolConversations.teacherId, userId);
    
    return await db.select()
      .from(schoolConversations)
      .where(condition)
      .orderBy(desc(schoolConversations.lastMessageAt));
  }

  async getConversation(id: string): Promise<SchoolConversation | undefined> {
    const [conversation] = await db.select()
      .from(schoolConversations)
      .where(eq(schoolConversations.id, id));
    return conversation;
  }

  async createConversation(conversationData: InsertSchoolConversation): Promise<SchoolConversation> {
    const [conversation] = await db.insert(schoolConversations)
      .values(conversationData)
      .returning();
    return conversation;
  }

  async updateConversationLastMessage(id: string): Promise<void> {
    await db.update(schoolConversations)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(schoolConversations.id, id));
  }

  async getMessages(conversationId: string, limit: number = 50, offset: number = 0): Promise<SchoolMessage[]> {
    return await db.select()
      .from(schoolMessages)
      .where(eq(schoolMessages.conversationId, conversationId))
      .orderBy(desc(schoolMessages.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createMessage(messageData: InsertSchoolMessage): Promise<SchoolMessage> {
    const [message] = await db.insert(schoolMessages)
      .values(messageData)
      .returning();
    
    // Update the conversation's last message timestamp and unread count
    const conversation = await this.getConversation(messageData.conversationId);
    if (conversation) {
      const updateData: any = { 
        lastMessageAt: new Date(), 
        updatedAt: new Date() 
      };
      
      // Increment the unread count for the other party
      if (messageData.senderType === 'parent') {
        updateData.teacherUnreadCount = sql`${schoolConversations.teacherUnreadCount} + 1`;
      } else {
        updateData.parentUnreadCount = sql`${schoolConversations.parentUnreadCount} + 1`;
      }
      
      await db.update(schoolConversations)
        .set(updateData)
        .where(eq(schoolConversations.id, messageData.conversationId));
    }
    
    return message;
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    // Mark all unread messages in the conversation as read
    await db.update(schoolMessages)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(schoolMessages.conversationId, conversationId),
          ne(schoolMessages.senderId, userId),
          eq(schoolMessages.isRead, false)
        )
      );
    
    // Reset the unread count for the user
    const conversation = await this.getConversation(conversationId);
    if (conversation) {
      if (conversation.parentId === userId) {
        await db.update(schoolConversations)
          .set({ parentUnreadCount: 0 })
          .where(eq(schoolConversations.id, conversationId));
      } else if (conversation.teacherId === userId) {
        await db.update(schoolConversations)
          .set({ teacherUnreadCount: 0 })
          .where(eq(schoolConversations.id, conversationId));
      }
    }
  }

  async getUnreadMessageCount(userId: string, userType: 'parent' | 'teacher'): Promise<number> {
    const condition = userType === 'parent' 
      ? eq(schoolConversations.parentId, userId)
      : eq(schoolConversations.teacherId, userId);
    
    const conversations = await db.select()
      .from(schoolConversations)
      .where(condition);
    
    const countField = userType === 'parent' ? 'parentUnreadCount' : 'teacherUnreadCount';
    return conversations.reduce((total, conv) => total + (conv[countField] || 0), 0);
  }

  // ============================================
  // LEARNING ENHANCEMENT - BADGES
  // ============================================

  async getBadges(): Promise<Badge[]> {
    return await db.select()
      .from(badges)
      .where(eq(badges.isActive, true))
      .orderBy(badges.sortOrder);
  }

  async getBadge(id: string): Promise<Badge | undefined> {
    const [badge] = await db.select()
      .from(badges)
      .where(eq(badges.id, id));
    return badge;
  }

  async createBadge(badgeData: InsertBadge): Promise<Badge> {
    const [badge] = await db.insert(badges)
      .values(badgeData)
      .returning();
    return badge;
  }

  async getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
    const results = await db.select()
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.earnedAt));
    
    return results.map(r => ({
      ...r.user_badges,
      badge: r.badges
    }));
  }

  async hasUserBadge(userId: string, badgeId: string): Promise<boolean> {
    const [result] = await db.select()
      .from(userBadges)
      .where(and(
        eq(userBadges.userId, userId),
        eq(userBadges.badgeId, badgeId)
      ));
    return !!result;
  }

  async awardBadge(userId: string, badgeId: string): Promise<UserBadge> {
    const [userBadge] = await db.insert(userBadges)
      .values({ userId, badgeId })
      .returning();
    return userBadge;
  }

  async getUnnotifiedBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
    const results = await db.select()
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(and(
        eq(userBadges.userId, userId),
        eq(userBadges.notified, false)
      ))
      .orderBy(desc(userBadges.earnedAt));
    
    return results.map(r => ({
      ...r.user_badges,
      badge: r.badges
    }));
  }

  async markBadgeNotified(userBadgeId: string): Promise<void> {
    await db.update(userBadges)
      .set({ notified: true })
      .where(eq(userBadges.id, userBadgeId));
  }

  // ============================================
  // LEARNING ENHANCEMENT - GAMIFICATION
  // ============================================

  async getUserGamification(userId: string): Promise<UserGamification | undefined> {
    const [result] = await db.select()
      .from(userGamification)
      .where(eq(userGamification.userId, userId));
    return result;
  }

  async createUserGamification(userId: string): Promise<UserGamification> {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [result] = await db.insert(userGamification)
      .values({
        userId,
        weekStartDate: weekStart,
        monthStartDate: monthStart,
      })
      .returning();
    return result;
  }

  async getOrCreateUserGamification(userId: string): Promise<UserGamification> {
    let gamification = await this.getUserGamification(userId);
    if (!gamification) {
      gamification = await this.createUserGamification(userId);
    }
    return gamification;
  }

  async updateUserGamification(userId: string, updates: Partial<UserGamification>): Promise<UserGamification> {
    const [result] = await db.update(userGamification)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userGamification.userId, userId))
      .returning();
    return result;
  }

  async addXp(userId: string, amount: number, source: string, sourceId?: string, description?: string): Promise<XpTransaction> {
    const gamification = await this.getOrCreateUserGamification(userId);
    
    const newTotalXp = gamification.totalXp + amount;
    const newWeeklyXp = gamification.weeklyXp + amount;
    const newMonthlyXp = gamification.monthlyXp + amount;
    const newLevel = this.calculateLevel(newTotalXp);
    
    await this.updateUserGamification(userId, {
      totalXp: newTotalXp,
      weeklyXp: newWeeklyXp,
      monthlyXp: newMonthlyXp,
      level: newLevel,
    });
    
    const [transaction] = await db.insert(xpTransactions)
      .values({ userId, amount, source, sourceId, description })
      .returning();
    
    return transaction;
  }

  calculateLevel(totalXp: number): number {
    const xpPerLevel = 100;
    const levelMultiplier = 1.5;
    
    let level = 1;
    let xpRequired = xpPerLevel;
    let xpRemaining = totalXp;
    
    while (xpRemaining >= xpRequired) {
      xpRemaining -= xpRequired;
      level++;
      xpRequired = Math.floor(xpPerLevel * Math.pow(levelMultiplier, level - 1));
    }
    
    return level;
  }

  async getXpTransactions(userId: string, limit: number = 20): Promise<XpTransaction[]> {
    return await db.select()
      .from(xpTransactions)
      .where(eq(xpTransactions.userId, userId))
      .orderBy(desc(xpTransactions.createdAt))
      .limit(limit);
  }

  async getLeaderboard(limit: number = 10, type: 'total' | 'weekly' | 'monthly' = 'weekly'): Promise<(UserGamification & { user: User })[]> {
    const orderColumn = type === 'total' 
      ? userGamification.totalXp 
      : type === 'weekly' 
        ? userGamification.weeklyXp 
        : userGamification.monthlyXp;
    
    const results = await db.select()
      .from(userGamification)
      .innerJoin(users, eq(userGamification.userId, users.id))
      .orderBy(desc(orderColumn))
      .limit(limit);
    
    return results.map(r => ({
      ...r.user_gamification,
      user: r.users
    }));
  }

  // ============================================
  // LEARNING ENHANCEMENT - STREAKS
  // ============================================

  async updateStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number; isNewDay: boolean }> {
    const gamification = await this.getOrCreateUserGamification(userId);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const lastActivity = gamification.lastActivityDate 
      ? new Date(gamification.lastActivityDate.getFullYear(), gamification.lastActivityDate.getMonth(), gamification.lastActivityDate.getDate())
      : null;
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    let currentStreak = gamification.currentStreak;
    let longestStreak = gamification.longestStreak;
    let isNewDay = false;
    
    if (!lastActivity || lastActivity.getTime() < today.getTime()) {
      isNewDay = true;
      
      if (lastActivity && lastActivity.getTime() === yesterday.getTime()) {
        currentStreak += 1;
      } else if (!lastActivity || lastActivity.getTime() < yesterday.getTime()) {
        currentStreak = 1;
      }
      
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
      
      await this.updateUserGamification(userId, {
        currentStreak,
        longestStreak,
        lastActivityDate: now,
      });
    }
    
    return { currentStreak, longestStreak, isNewDay };
  }

  async getDailyStudyLog(userId: string, date: Date): Promise<DailyStudyLog | undefined> {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    const [log] = await db.select()
      .from(dailyStudyLogs)
      .where(and(
        eq(dailyStudyLogs.userId, userId),
        gte(dailyStudyLogs.date, dayStart),
        lte(dailyStudyLogs.date, dayEnd)
      ));
    return log;
  }

  async updateDailyStudyLog(userId: string, updates: { quizzesTaken?: number; materialsViewed?: number; reviewsCompleted?: number; xpEarned?: number; studyMinutes?: number }): Promise<DailyStudyLog> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let log = await this.getDailyStudyLog(userId, today);
    
    if (!log) {
      const [newLog] = await db.insert(dailyStudyLogs)
        .values({
          userId,
          date: today,
          ...updates
        })
        .returning();
      return newLog;
    }
    
    const updateData: any = { updatedAt: new Date() };
    if (updates.quizzesTaken) updateData.quizzesTaken = sql`${dailyStudyLogs.quizzesTaken} + ${updates.quizzesTaken}`;
    if (updates.materialsViewed) updateData.materialsViewed = sql`${dailyStudyLogs.materialsViewed} + ${updates.materialsViewed}`;
    if (updates.reviewsCompleted) updateData.reviewsCompleted = sql`${dailyStudyLogs.reviewsCompleted} + ${updates.reviewsCompleted}`;
    if (updates.xpEarned) updateData.xpEarned = sql`${dailyStudyLogs.xpEarned} + ${updates.xpEarned}`;
    if (updates.studyMinutes) updateData.studyMinutes = sql`${dailyStudyLogs.studyMinutes} + ${updates.studyMinutes}`;
    
    const [updatedLog] = await db.update(dailyStudyLogs)
      .set(updateData)
      .where(eq(dailyStudyLogs.id, log.id))
      .returning();
    
    return updatedLog;
  }

  async getStudyHistory(userId: string, days: number = 30): Promise<DailyStudyLog[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    return await db.select()
      .from(dailyStudyLogs)
      .where(and(
        eq(dailyStudyLogs.userId, userId),
        gte(dailyStudyLogs.date, startDate)
      ))
      .orderBy(desc(dailyStudyLogs.date));
  }

  // ============================================
  // LEARNING ENHANCEMENT - SPACED REPETITION
  // ============================================

  async getSpacedRepetitionCards(userId: string): Promise<SpacedRepetitionCard[]> {
    return await db.select()
      .from(spacedRepetitionCards)
      .where(and(
        eq(spacedRepetitionCards.userId, userId),
        eq(spacedRepetitionCards.isActive, true)
      ))
      .orderBy(asc(spacedRepetitionCards.nextReviewDate));
  }

  async getDueCards(userId: string, limit: number = 20): Promise<SpacedRepetitionCard[]> {
    const now = new Date();
    return await db.select()
      .from(spacedRepetitionCards)
      .where(and(
        eq(spacedRepetitionCards.userId, userId),
        eq(spacedRepetitionCards.isActive, true),
        lte(spacedRepetitionCards.nextReviewDate, now)
      ))
      .orderBy(asc(spacedRepetitionCards.nextReviewDate))
      .limit(limit);
  }

  async getSpacedRepetitionCard(id: string): Promise<SpacedRepetitionCard | undefined> {
    const [card] = await db.select()
      .from(spacedRepetitionCards)
      .where(eq(spacedRepetitionCards.id, id));
    return card;
  }

  async createSpacedRepetitionCard(cardData: InsertSpacedRepetitionCard): Promise<SpacedRepetitionCard> {
    const [card] = await db.insert(spacedRepetitionCards)
      .values(cardData)
      .returning();
    return card;
  }

  async updateSpacedRepetitionCard(id: string, updates: Partial<SpacedRepetitionCard>): Promise<SpacedRepetitionCard> {
    const [card] = await db.update(spacedRepetitionCards)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(spacedRepetitionCards.id, id))
      .returning();
    return card;
  }

  async reviewCard(cardId: string, quality: number): Promise<SpacedRepetitionCard> {
    const card = await this.getSpacedRepetitionCard(cardId);
    if (!card) throw new Error('Card not found');
    
    let easeFactor = card.easeFactor;
    let interval = card.interval;
    let repetitions = card.repetitions;
    
    if (quality >= 3) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
      easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    } else {
      repetitions = 0;
      interval = 1;
      if (quality < 2) {
        easeFactor = Math.max(1.3, easeFactor - 0.2);
      }
    }
    
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    
    const isCorrect = quality >= 3;
    
    return await this.updateSpacedRepetitionCard(cardId, {
      easeFactor,
      interval,
      repetitions,
      nextReviewDate,
      lastReviewDate: new Date(),
      totalReviews: card.totalReviews + 1,
      correctReviews: isCorrect ? card.correctReviews + 1 : card.correctReviews,
    });
  }

  async deleteSpacedRepetitionCard(id: string): Promise<void> {
    await db.update(spacedRepetitionCards)
      .set({ isActive: false })
      .where(eq(spacedRepetitionCards.id, id));
  }

  async getCardsByCourse(userId: string, courseId: string): Promise<SpacedRepetitionCard[]> {
    return await db.select()
      .from(spacedRepetitionCards)
      .where(and(
        eq(spacedRepetitionCards.userId, userId),
        eq(spacedRepetitionCards.courseId, courseId),
        eq(spacedRepetitionCards.isActive, true)
      ))
      .orderBy(asc(spacedRepetitionCards.nextReviewDate));
  }

  // ============================================
  // LEARNING ENHANCEMENT - RECOMMENDATIONS
  // ============================================

  async getRecommendations(userId: string, limit: number = 10): Promise<LearningRecommendation[]> {
    return await db.select()
      .from(learningRecommendations)
      .where(and(
        eq(learningRecommendations.userId, userId),
        eq(learningRecommendations.status, 'active')
      ))
      .orderBy(desc(learningRecommendations.priority))
      .limit(limit);
  }

  async getRecommendation(id: string): Promise<LearningRecommendation | undefined> {
    const [rec] = await db.select()
      .from(learningRecommendations)
      .where(eq(learningRecommendations.id, id));
    return rec;
  }

  async createRecommendation(recData: InsertLearningRecommendation): Promise<LearningRecommendation> {
    const [rec] = await db.insert(learningRecommendations)
      .values(recData as any)
      .returning();
    return rec;
  }

  async updateRecommendationStatus(id: string, status: 'viewed' | 'completed' | 'dismissed'): Promise<LearningRecommendation> {
    const updateData: any = { status };
    
    if (status === 'viewed') updateData.viewedAt = new Date();
    if (status === 'completed') updateData.completedAt = new Date();
    if (status === 'dismissed') updateData.dismissedAt = new Date();
    
    const [rec] = await db.update(learningRecommendations)
      .set(updateData)
      .where(eq(learningRecommendations.id, id))
      .returning();
    return rec;
  }

  async deleteExpiredRecommendations(): Promise<void> {
    const now = new Date();
    await db.update(learningRecommendations)
      .set({ status: 'dismissed', dismissedAt: now })
      .where(and(
        eq(learningRecommendations.status, 'active'),
        lte(learningRecommendations.expiresAt, now)
      ));
  }

  async clearUserRecommendations(userId: string, type?: string): Promise<void> {
    const conditions = [eq(learningRecommendations.userId, userId)];
    if (type) {
      conditions.push(eq(learningRecommendations.type, type));
    }
    
    await db.delete(learningRecommendations)
      .where(and(...conditions));
  }

  // ============================================
  // STUDY GROUPS - Peer Collaboration
  // ============================================

  async getStudyGroups(options?: { 
    userId?: string; 
    courseId?: string; 
    isPublic?: boolean;
    limit?: number;
  }): Promise<StudyGroup[]> {
    const conditions = [eq(studyGroups.isActive, true)];
    
    if (options?.courseId) {
      conditions.push(eq(studyGroups.courseId, options.courseId));
    }
    if (options?.isPublic !== undefined) {
      conditions.push(eq(studyGroups.isPublic, options.isPublic));
    }
    
    const query = db.select()
      .from(studyGroups)
      .where(and(...conditions))
      .orderBy(desc(studyGroups.lastActivityAt));
    
    if (options?.limit) {
      return await query.limit(options.limit);
    }
    return await query;
  }

  async getUserStudyGroups(userId: string): Promise<(StudyGroup & { memberRole: string })[]> {
    const results = await db.select()
      .from(studyGroupMembers)
      .innerJoin(studyGroups, eq(studyGroupMembers.groupId, studyGroups.id))
      .where(and(
        eq(studyGroupMembers.userId, userId),
        eq(studyGroups.isActive, true)
      ))
      .orderBy(desc(studyGroups.lastActivityAt));
    
    return results.map(r => ({
      ...r.study_groups,
      memberRole: r.study_group_members.role
    }));
  }

  async getStudyGroup(id: string): Promise<StudyGroup | undefined> {
    const [group] = await db.select()
      .from(studyGroups)
      .where(eq(studyGroups.id, id));
    return group;
  }

  async createStudyGroup(groupData: InsertStudyGroup): Promise<StudyGroup> {
    const [group] = await db.insert(studyGroups)
      .values(groupData)
      .returning();
    
    await db.insert(studyGroupMembers)
      .values({
        groupId: group.id,
        userId: groupData.createdById,
        role: 'owner'
      });
    
    return group;
  }

  async updateStudyGroup(id: string, updates: Partial<StudyGroup>): Promise<StudyGroup> {
    const [group] = await db.update(studyGroups)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(studyGroups.id, id))
      .returning();
    return group;
  }

  async deleteStudyGroup(id: string): Promise<void> {
    await db.update(studyGroups)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(studyGroups.id, id));
  }

  async getStudyGroupMembers(groupId: string): Promise<(StudyGroupMember & { user: User })[]> {
    const results = await db.select()
      .from(studyGroupMembers)
      .innerJoin(users, eq(studyGroupMembers.userId, users.id))
      .where(eq(studyGroupMembers.groupId, groupId))
      .orderBy(desc(studyGroupMembers.xpContributed));
    
    return results.map(r => ({
      ...r.study_group_members,
      user: r.users
    }));
  }

  async getStudyGroupMember(groupId: string, userId: string): Promise<StudyGroupMember | undefined> {
    const [member] = await db.select()
      .from(studyGroupMembers)
      .where(and(
        eq(studyGroupMembers.groupId, groupId),
        eq(studyGroupMembers.userId, userId)
      ));
    return member;
  }

  async joinStudyGroup(groupId: string, userId: string): Promise<StudyGroupMember> {
    const [member] = await db.insert(studyGroupMembers)
      .values({ groupId, userId, role: 'member' })
      .returning();
    return member;
  }

  async leaveStudyGroup(groupId: string, userId: string): Promise<void> {
    await db.delete(studyGroupMembers)
      .where(and(
        eq(studyGroupMembers.groupId, groupId),
        eq(studyGroupMembers.userId, userId)
      ));
  }

  async updateStudyGroupMember(groupId: string, userId: string, updates: Partial<StudyGroupMember>): Promise<StudyGroupMember> {
    const [member] = await db.update(studyGroupMembers)
      .set({ ...updates, lastActiveAt: new Date() })
      .where(and(
        eq(studyGroupMembers.groupId, groupId),
        eq(studyGroupMembers.userId, userId)
      ))
      .returning();
    return member;
  }

  async getStudyGroupMessages(groupId: string, limit: number = 50): Promise<(StudyGroupMessage & { user: User })[]> {
    const results = await db.select()
      .from(studyGroupMessages)
      .innerJoin(users, eq(studyGroupMessages.userId, users.id))
      .where(eq(studyGroupMessages.groupId, groupId))
      .orderBy(desc(studyGroupMessages.createdAt))
      .limit(limit);
    
    return results.map(r => ({
      ...r.study_group_messages,
      user: r.users
    })).reverse();
  }

  async createStudyGroupMessage(messageData: InsertStudyGroupMessage): Promise<StudyGroupMessage> {
    const [message] = await db.insert(studyGroupMessages)
      .values(messageData)
      .returning();
    
    await db.update(studyGroups)
      .set({ lastActivityAt: new Date() })
      .where(eq(studyGroups.id, messageData.groupId));
    
    await db.update(studyGroupMembers)
      .set({ 
        messagesCount: sql`${studyGroupMembers.messagesCount} + 1`,
        lastActiveAt: new Date()
      })
      .where(and(
        eq(studyGroupMembers.groupId, messageData.groupId),
        eq(studyGroupMembers.userId, messageData.userId)
      ));
    
    return message;
  }

  async getStudyGroupMemberCount(groupId: string): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)::int` })
      .from(studyGroupMembers)
      .where(eq(studyGroupMembers.groupId, groupId));
    return result?.count || 0;
  }
}

export const storage = new DatabaseStorage();
