import { Router, Response, Request } from "express";
import { db } from "./db";
import { 
  users, 
  schools, 
  schoolUsers, 
  subscriptionPlans, 
  subscriptionPayments,
  institutions,
  materials,
  quizzes,
  courses,
  schoolClasses,
} from "@shared/schema";
import { eq, desc, sql, and, count, sum, gte, lte, or, like, ilike } from "drizzle-orm";
import { isAuthenticated, requireOnboarding } from "./auth";
import { 
  getPlatformActivityFeed, 
  getActivityFeedCount, 
  getActivityStats,
  logImpersonation,
  getImpersonationLogs,
  getActiveImpersonation,
  logPlatformActivity,
} from "./platform-activity-logger";
import crypto from "crypto";

const router = Router();

const requireSuperAdmin = (req: any, res: Response, next: any) => {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({ message: "Access denied. Super Admin only." });
  }
  next();
};

router.get("/api/super-admin/stats", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const [
      usersResult,
      institutionsResult,
      coursesResult,
      materialsResult,
      quizzesResult,
      schoolsResult,
      schoolUsersResult,
      paymentsResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(institutions),
      db.select({ count: count() }).from(courses),
      db.select({ count: count() }).from(materials),
      db.select({ count: count() }).from(quizzes),
      db.select({ count: count() }).from(schools),
      db.select({ 
        count: count(),
        role: schoolUsers.role,
      }).from(schoolUsers).groupBy(schoolUsers.role),
      db.select({ 
        total: sum(subscriptionPayments.amount),
      }).from(subscriptionPayments).where(eq(subscriptionPayments.status, 'paid')),
    ]);

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyPayments = await db.select({ 
      total: sum(subscriptionPayments.amount),
    }).from(subscriptionPayments)
      .where(and(
        eq(subscriptionPayments.status, 'paid'),
        gte(subscriptionPayments.paidAt, firstOfMonth)
      ));

    const schoolStats = await db.select({
      subscriptionStatus: schools.subscriptionStatus,
      count: count(),
    }).from(schools).groupBy(schools.subscriptionStatus);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const newUsersToday = await db.select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, today));

    const newUsersWeek = await db.select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, weekAgo));

    const schoolUserCounts = schoolUsersResult.reduce((acc, item) => {
      acc[item.role || 'other'] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const subscriptionCounts = schoolStats.reduce((acc, item) => {
      acc[item.subscriptionStatus || 'unknown'] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const stats = {
      lms: {
        totalUsers: usersResult[0]?.count || 0,
        activeUsers: usersResult[0]?.count || 0,
        totalInstitutions: institutionsResult[0]?.count || 0,
        totalCourses: coursesResult[0]?.count || 0,
        totalMaterials: materialsResult[0]?.count || 0,
        totalQuizzes: quizzesResult[0]?.count || 0,
        newUsersToday: newUsersToday[0]?.count || 0,
        newUsersThisWeek: newUsersWeek[0]?.count || 0,
      },
      sms: {
        totalSchools: schoolsResult[0]?.count || 0,
        activeSchools: subscriptionCounts['active'] || 0,
        trialSchools: subscriptionCounts['trial'] || 0,
        paidSchools: subscriptionCounts['active'] || 0,
        totalStudents: schoolUserCounts['student'] || 0,
        totalTeachers: schoolUserCounts['teacher'] || 0,
        totalParents: schoolUserCounts['parent'] || 0,
        totalRevenue: Number(paymentsResult[0]?.total) || 0,
        monthlyRevenue: Number(monthlyPayments[0]?.total) || 0,
      },
      recentActivity: [],
    };

    res.json(stats);
  } catch (error: any) {
    console.error("Error fetching super admin stats:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

router.get("/api/super-admin/users", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    res.json(allUsers);
  } catch (error: any) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.patch("/api/super-admin/users/:userId", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const [updatedUser] = await db.update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();

    res.json(updatedUser);
  } catch (error: any) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
});

router.get("/api/super-admin/schools", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const allSchools = await db.select().from(schools).orderBy(desc(schools.createdAt));

    const schoolsWithStats = await Promise.all(allSchools.map(async (school) => {
      const userStats = await db.select({
        role: schoolUsers.role,
        count: count(),
      }).from(schoolUsers)
        .where(eq(schoolUsers.schoolId, school.id))
        .groupBy(schoolUsers.role);

      const statsByRole = userStats.reduce((acc, item) => {
        acc[item.role || 'other'] = item.count;
        return acc;
      }, {} as Record<string, number>);

      const plan = school.subscriptionPlanId 
        ? await db.select({ name: subscriptionPlans.name })
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.id, school.subscriptionPlanId))
            .limit(1)
        : null;

      return {
        ...school,
        studentsCount: statsByRole['student'] || 0,
        teachersCount: statsByRole['teacher'] || 0,
        parentsCount: statsByRole['parent'] || 0,
        subscriptionPlanName: plan?.[0]?.name || null,
      };
    }));

    res.json(schoolsWithStats);
  } catch (error: any) {
    console.error("Error fetching schools:", error);
    res.status(500).json({ message: "Failed to fetch schools" });
  }
});

router.patch("/api/super-admin/schools/:schoolId", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { schoolId } = req.params;
    const updates = req.body;

    const [updatedSchool] = await db.update(schools)
      .set(updates)
      .where(eq(schools.id, schoolId))
      .returning();

    res.json(updatedSchool);
  } catch (error: any) {
    console.error("Error updating school:", error);
    res.status(500).json({ message: "Failed to update school" });
  }
});

router.get("/api/super-admin/subscription-payments", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const payments = await db.select({
      payment: subscriptionPayments,
      school: schools,
      plan: subscriptionPlans,
    })
      .from(subscriptionPayments)
      .leftJoin(schools, eq(subscriptionPayments.schoolId, schools.id))
      .leftJoin(subscriptionPlans, eq(subscriptionPayments.planId, subscriptionPlans.id))
      .orderBy(desc(subscriptionPayments.createdAt));

    const formattedPayments = payments.map(({ payment, school, plan }) => ({
      id: payment.id,
      schoolId: payment.schoolId,
      schoolName: school?.name || 'Unknown School',
      planName: plan?.name || 'Unknown Plan',
      amount: payment.amount,
      currency: payment.currency || 'NGN',
      status: payment.status,
      invoiceNumber: payment.invoiceNumber,
      paystackReference: payment.paystackReference,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
    }));

    res.json(formattedPayments);
  } catch (error: any) {
    console.error("Error fetching subscription payments:", error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
});

router.get("/api/super-admin/subscription-stats", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const [totalRevenue] = await db.select({ 
      total: sum(subscriptionPayments.amount),
    }).from(subscriptionPayments).where(eq(subscriptionPayments.status, 'paid'));

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthlyRevenue] = await db.select({ 
      total: sum(subscriptionPayments.amount),
    }).from(subscriptionPayments)
      .where(and(
        eq(subscriptionPayments.status, 'paid'),
        gte(subscriptionPayments.paidAt, firstOfMonth)
      ));

    const schoolStats = await db.select({
      subscriptionStatus: schools.subscriptionStatus,
      count: count(),
    }).from(schools).groupBy(schools.subscriptionStatus);

    const subscriptionCounts = schoolStats.reduce((acc, item) => {
      acc[item.subscriptionStatus || 'unknown'] = item.count;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      totalRevenue: Number(totalRevenue?.total) || 0,
      monthlyRevenue: Number(monthlyRevenue?.total) || 0,
      activeSubscriptions: subscriptionCounts['active'] || 0,
      trialSubscriptions: subscriptionCounts['trial'] || 0,
      expiredSubscriptions: subscriptionCounts['expired'] || 0,
      cancelledSubscriptions: subscriptionCounts['cancelled'] || 0,
    });
  } catch (error: any) {
    console.error("Error fetching subscription stats:", error);
    res.status(500).json({ message: "Failed to fetch subscription stats" });
  }
});

router.get("/api/super-admin/subscription-plans", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const plans = await db.select().from(subscriptionPlans).orderBy(desc(subscriptionPlans.createdAt));

    const plansWithStats = await Promise.all(plans.map(async (plan) => {
      const [subscriberCount] = await db.select({ count: count() })
        .from(schools)
        .where(eq(schools.subscriptionPlanId, plan.id));

      return {
        ...plan,
        monthlyPrice: plan.price || 0,
        yearlyPrice: (plan.price || 0) * 10,
        isFeatured: false,
        subscribersCount: subscriberCount?.count || 0,
      };
    }));

    res.json(plansWithStats);
  } catch (error: any) {
    console.error("Error fetching subscription plans:", error);
    res.status(500).json({ message: "Failed to fetch plans" });
  }
});

router.post("/api/super-admin/subscription-plans", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { name, description, monthlyPrice, maxStudents, maxTeachers, maxClasses, features, isActive } = req.body;

    const code = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    const [newPlan] = await db.insert(subscriptionPlans).values({
      name,
      code,
      description,
      price: monthlyPrice || 0,
      billingPeriod: 'monthly',
      maxStudents,
      maxTeachers,
      maxClasses,
      features: features || [],
      isActive: isActive ?? true,
    }).returning();

    res.json({
      ...newPlan,
      monthlyPrice: newPlan.price,
      yearlyPrice: (newPlan.price || 0) * 10,
    });
  } catch (error: any) {
    console.error("Error creating subscription plan:", error);
    res.status(500).json({ message: "Failed to create plan" });
  }
});

router.patch("/api/super-admin/subscription-plans/:planId", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { planId } = req.params;
    const updates = req.body;

    const [updatedPlan] = await db.update(subscriptionPlans)
      .set(updates)
      .where(eq(subscriptionPlans.id, planId))
      .returning();

    res.json(updatedPlan);
  } catch (error: any) {
    console.error("Error updating subscription plan:", error);
    res.status(500).json({ message: "Failed to update plan" });
  }
});

router.delete("/api/super-admin/subscription-plans/:planId", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { planId } = req.params;

    const [subscriberCount] = await db.select({ count: count() })
      .from(schools)
      .where(eq(schools.subscriptionPlanId, planId));

    if (subscriberCount.count > 0) {
      return res.status(400).json({ 
        message: `Cannot delete plan with ${subscriberCount.count} active subscribers. Please reassign schools first.` 
      });
    }

    await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, planId));

    res.json({ message: "Plan deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting subscription plan:", error);
    res.status(500).json({ message: "Failed to delete plan" });
  }
});

router.get("/api/super-admin/analytics", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const [
      totalUsersResult,
      totalSchoolsResult,
      totalMaterialsResult,
      totalQuizzesResult,
      totalRevenueResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(schools),
      db.select({ count: count() }).from(materials),
      db.select({ count: count() }).from(quizzes),
      db.select({ total: sum(subscriptionPayments.amount) })
        .from(subscriptionPayments)
        .where(eq(subscriptionPayments.status, 'paid')),
    ]);

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthlyRevenueResult] = await db.select({ total: sum(subscriptionPayments.amount) })
      .from(subscriptionPayments)
      .where(and(
        eq(subscriptionPayments.status, 'paid'),
        gte(subscriptionPayments.paidAt, firstOfMonth)
      ));

    const schoolStats = await db.select({
      subscriptionStatus: schools.subscriptionStatus,
      count: count(),
    }).from(schools).groupBy(schools.subscriptionStatus);

    const usersByRole = await db.select({
      role: users.role,
      count: count(),
    }).from(users).groupBy(users.role);

    const topInstitutions = await db.select({
      id: institutions.id,
      name: institutions.name,
    }).from(institutions).limit(5);

    const topSchools = await db.select({
      id: schools.id,
      name: schools.name,
      subscriptionStatus: schools.subscriptionStatus,
    }).from(schools).limit(6);

    const topSchoolsWithCounts = await Promise.all(topSchools.map(async (school) => {
      const [studentCount] = await db.select({ count: count() })
        .from(schoolUsers)
        .where(and(eq(schoolUsers.schoolId, school.id), eq(schoolUsers.role, 'student')));
      
      const [teacherCount] = await db.select({ count: count() })
        .from(schoolUsers)
        .where(and(eq(schoolUsers.schoolId, school.id), eq(schoolUsers.role, 'teacher')));

      return {
        ...school,
        studentsCount: studentCount?.count || 0,
        teachersCount: teacherCount?.count || 0,
      };
    }));

    res.json({
      overview: {
        totalUsers: totalUsersResult[0]?.count || 0,
        activeUsers: totalUsersResult[0]?.count || 0,
        totalSchools: totalSchoolsResult[0]?.count || 0,
        activeSchools: schoolStats.find(s => s.subscriptionStatus === 'active')?.count || 0,
        totalMaterials: totalMaterialsResult[0]?.count || 0,
        totalQuizzes: totalQuizzesResult[0]?.count || 0,
        totalRevenue: Number(totalRevenueResult[0]?.total) || 0,
        monthlyRevenue: Number(monthlyRevenueResult?.total) || 0,
      },
      usersByRole: usersByRole.map(item => ({
        role: item.role || 'No role',
        count: item.count,
      })),
      schoolsBySubscription: schoolStats.map(item => ({
        status: item.subscriptionStatus || 'Unknown',
        count: item.count,
      })),
      topInstitutions: topInstitutions.map(inst => ({
        id: inst.id,
        name: inst.name,
        studentsCount: 0,
        materialsCount: 0,
      })),
      topSchools: topSchoolsWithCounts,
    });
  } catch (error: any) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

router.get("/api/super-admin/settings", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    res.json({
      siteName: "StudentDrive",
      siteDescription: "Comprehensive educational platform combining LMS and SMS",
      supportEmail: "support@studentdrive.com",
      maintenanceMode: false,
      allowNewRegistrations: true,
      allowSchoolRegistrations: true,
      defaultTrialDays: 14,
      paystackEnabled: true,
      emailNotificationsEnabled: true,
      lastDatabaseBackup: null,
    });
  } catch (error: any) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
});

router.patch("/api/super-admin/settings", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    res.json({ message: "Settings updated successfully" });
  } catch (error: any) {
    console.error("Error updating settings:", error);
    res.status(500).json({ message: "Failed to update settings" });
  }
});

// ============================================
// ACTIVITY FEED ROUTES
// ============================================

router.get("/api/super-admin/activity-feed", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { 
      limit = "50", 
      offset = "0", 
      platform = "all", 
      activityType, 
      schoolId,
      startDate,
      endDate,
      severity,
    } = req.query;

    const activities = await getPlatformActivityFeed({
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      platform: platform as "lms" | "sms" | "all",
      activityType: activityType as string | undefined,
      schoolId: schoolId as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      severity: severity as string | undefined,
    });

    const total = await getActivityFeedCount({
      platform: platform as "lms" | "sms" | "all",
      activityType: activityType as string | undefined,
      schoolId: schoolId as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({
      activities,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error: any) {
    console.error("Error fetching activity feed:", error);
    res.status(500).json({ message: "Failed to fetch activity feed" });
  }
});

router.get("/api/super-admin/activity-feed/stats", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await getActivityStats(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json(stats);
  } catch (error: any) {
    console.error("Error fetching activity stats:", error);
    res.status(500).json({ message: "Failed to fetch activity stats" });
  }
});

// ============================================
// SCHOOL USERS ROUTES
// ============================================

router.get("/api/super-admin/schools/:schoolId/users", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { schoolId } = req.params;
    const { role, search, limit = "50", offset = "0" } = req.query;

    const school = await db.select().from(schools).where(eq(schools.id, schoolId)).limit(1);
    if (!school[0]) {
      return res.status(404).json({ message: "School not found" });
    }

    let conditions = [eq(schoolUsers.schoolId, schoolId)];

    if (role && role !== "all") {
      conditions.push(eq(schoolUsers.role, role as string));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          ilike(schoolUsers.firstName, searchTerm),
          ilike(schoolUsers.lastName, searchTerm),
          ilike(schoolUsers.email, searchTerm)
        ) as any
      );
    }

    const usersResult = await db.select()
      .from(schoolUsers)
      .where(and(...conditions))
      .orderBy(desc(schoolUsers.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const [totalResult] = await db.select({ count: count() })
      .from(schoolUsers)
      .where(and(...conditions));

    const roleStats = await db.select({
      role: schoolUsers.role,
      count: count(),
    })
      .from(schoolUsers)
      .where(eq(schoolUsers.schoolId, schoolId))
      .groupBy(schoolUsers.role);

    res.json({
      school: school[0],
      users: usersResult,
      total: totalResult?.count || 0,
      roleStats: roleStats.reduce((acc, item) => {
        acc[item.role || 'other'] = item.count;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error: any) {
    console.error("Error fetching school users:", error);
    res.status(500).json({ message: "Failed to fetch school users" });
  }
});

router.get("/api/super-admin/schools/:schoolId/users/:userId", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { schoolId, userId } = req.params;

    const [user] = await db.select()
      .from(schoolUsers)
      .where(and(
        eq(schoolUsers.schoolId, schoolId),
        eq(schoolUsers.id, userId)
      ));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let classInfo = null;
    if (user.classId) {
      const [cls] = await db.select()
        .from(schoolClasses)
        .where(eq(schoolClasses.id, user.classId));
      classInfo = cls;
    }

    res.json({
      ...user,
      class: classInfo,
    });
  } catch (error: any) {
    console.error("Error fetching school user:", error);
    res.status(500).json({ message: "Failed to fetch school user" });
  }
});

router.patch("/api/super-admin/schools/:schoolId/users/:userId", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { schoolId, userId } = req.params;
    const updates = req.body;

    const safeUpdates: Record<string, any> = {};
    const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'isActive', 'role'];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        safeUpdates[field] = updates[field];
      }
    }

    const [updatedUser] = await db.update(schoolUsers)
      .set(safeUpdates)
      .where(and(
        eq(schoolUsers.schoolId, schoolId),
        eq(schoolUsers.id, userId)
      ))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    await logPlatformActivity({
      activityType: "school_user_updated",
      platform: "sms",
      description: `Super admin updated user ${updatedUser.firstName} ${updatedUser.lastName} in school`,
      entityType: "school_user",
      entityId: userId,
      entityName: `${updatedUser.firstName} ${updatedUser.lastName}`,
      actorId: req.user.id,
      actorType: "super_admin",
      actorEmail: req.user.email,
      schoolId,
      metadata: { updates: safeUpdates },
      severity: "info",
      req,
    });

    res.json(updatedUser);
  } catch (error: any) {
    console.error("Error updating school user:", error);
    res.status(500).json({ message: "Failed to update school user" });
  }
});

// ============================================
// IMPERSONATION ROUTES
// ============================================

router.post("/api/super-admin/impersonate/:schoolId", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { schoolId } = req.params;
    const { reason, targetUserId } = req.body;

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return res.status(400).json({ 
        message: "A valid reason is required for impersonation (minimum 5 characters)" 
      });
    }

    const sanitizedReason = reason.trim().substring(0, 500);

    const [school] = await db.select().from(schools).where(eq(schools.id, schoolId));
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    let targetUser = null;
    if (targetUserId) {
      const [user] = await db.select()
        .from(schoolUsers)
        .where(and(
          eq(schoolUsers.schoolId, schoolId),
          eq(schoolUsers.id, targetUserId)
        ));
      
      if (!user) {
        return res.status(404).json({ 
          message: "Target user not found" 
        });
      }
      
      if (user.role !== 'school_admin') {
        return res.status(400).json({ 
          message: "Impersonation is only allowed for school admins. Target user has role: " + user.role
        });
      }
      
      targetUser = user;
    } else {
      const [adminUser] = await db.select()
        .from(schoolUsers)
        .where(and(
          eq(schoolUsers.schoolId, schoolId),
          eq(schoolUsers.role, 'school_admin')
        ))
        .limit(1);
      targetUser = adminUser;
    }

    if (!targetUser) {
      return res.status(404).json({ message: "No school admin found to impersonate" });
    }
    
    if (targetUser.role !== 'school_admin') {
      return res.status(400).json({ 
        message: "Impersonation is only allowed for school admins" 
      });
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');

    const impersonationLog = await logImpersonation({
      superAdminId: req.user.id,
      superAdminEmail: req.user.email,
      targetSchoolId: schoolId,
      targetSchoolName: school.name,
      targetUserId: targetUser.id,
      targetUserEmail: targetUser.email,
      targetUserRole: targetUser.role,
      action: "start",
      reason: sanitizedReason,
      sessionToken,
      req,
    });

    res.json({
      success: true,
      impersonationId: impersonationLog?.id,
      sessionToken,
      school: {
        id: school.id,
        name: school.name,
        subdomain: school.subdomain,
      },
      targetUser: {
        id: targetUser.id,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        email: targetUser.email,
        role: targetUser.role,
      },
      message: `Impersonation started for ${school.name}`,
    });
  } catch (error: any) {
    console.error("Error starting impersonation:", error);
    res.status(500).json({ message: "Failed to start impersonation" });
  }
});

router.post("/api/super-admin/impersonate/:schoolId/end", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { schoolId } = req.params;

    const [school] = await db.select().from(schools).where(eq(schools.id, schoolId));
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    await logImpersonation({
      superAdminId: req.user.id,
      superAdminEmail: req.user.email,
      targetSchoolId: schoolId,
      targetSchoolName: school.name,
      action: "end",
      req,
    });

    res.json({
      success: true,
      message: `Impersonation ended for ${school.name}`,
    });
  } catch (error: any) {
    console.error("Error ending impersonation:", error);
    res.status(500).json({ message: "Failed to end impersonation" });
  }
});

router.get("/api/super-admin/impersonation/active", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const activeImpersonation = await getActiveImpersonation(req.user.id);
    res.json({ active: activeImpersonation });
  } catch (error: any) {
    console.error("Error checking active impersonation:", error);
    res.status(500).json({ message: "Failed to check active impersonation" });
  }
});

router.get("/api/super-admin/impersonation/logs", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { limit = "50", offset = "0", schoolId, startDate, endDate } = req.query;

    const logs = await getImpersonationLogs({
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      schoolId: schoolId as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({ logs });
  } catch (error: any) {
    console.error("Error fetching impersonation logs:", error);
    res.status(500).json({ message: "Failed to fetch impersonation logs" });
  }
});

// ============= Active Sessions Management =============
import {
  getActiveSessions,
  getActiveSessionsCount,
  getSessionStats,
  forceTerminateSession,
  forceTerminateUserSessions,
  forceTerminateSchoolSessions,
  cleanupExpiredSessions,
  getSecurityEvents,
  getSecurityEventsCount,
  getSecurityEventStats,
  resolveSecurityEvent,
  logSecurityEvent,
} from "./session-security-service";

// Get active sessions with filters
router.get("/api/super-admin/sessions", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { 
      limit = "50", 
      offset = "0", 
      platform = "all", 
      schoolId, 
      userId,
      isActive = "true",
    } = req.query;

    const sessions = await getActiveSessions({
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      platform: platform as "lms" | "sms" | "all",
      schoolId: schoolId as string | undefined,
      userId: userId as string | undefined,
      isActive: isActive === "true",
    });

    const total = await getActiveSessionsCount({
      platform: platform as "lms" | "sms" | "all",
      schoolId: schoolId as string | undefined,
    });

    res.json({
      sessions,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error: any) {
    console.error("Error fetching active sessions:", error);
    res.status(500).json({ message: "Failed to fetch active sessions" });
  }
});

// Get session stats
router.get("/api/super-admin/sessions/stats", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const stats = await getSessionStats();
    res.json(stats);
  } catch (error: any) {
    console.error("Error fetching session stats:", error);
    res.status(500).json({ message: "Failed to fetch session stats" });
  }
});

// Force terminate a single session
router.post("/api/super-admin/sessions/:sessionId/terminate", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;

    const terminated = await forceTerminateSession({
      sessionId,
      terminatedBy: req.user.id,
      reason,
    });

    if (!terminated) {
      return res.status(404).json({ message: "Session not found or already terminated" });
    }

    // Log security event
    await logSecurityEvent({
      eventType: "session_terminated",
      severity: "warning",
      platform: terminated.platform as "lms" | "sms",
      schoolId: terminated.schoolId || undefined,
      schoolName: terminated.schoolName || undefined,
      targetUserId: terminated.userId || undefined,
      targetUserEmail: terminated.userEmail,
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: "super_admin",
      description: `Session terminated by super admin: ${terminated.userEmail}`,
      metadata: { sessionId, reason },
      req,
    });

    res.json({
      success: true,
      message: "Session terminated successfully",
      session: terminated,
    });
  } catch (error: any) {
    console.error("Error terminating session:", error);
    res.status(500).json({ message: "Failed to terminate session" });
  }
});

// Force terminate all sessions for a user
router.post("/api/super-admin/sessions/user/:userId/terminate-all", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const terminated = await forceTerminateUserSessions({
      userId,
      terminatedBy: req.user.id,
      reason,
    });

    // Log security event
    await logSecurityEvent({
      eventType: "session_terminated",
      severity: "warning",
      platform: "lms",
      targetUserId: userId,
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: "super_admin",
      description: `All sessions terminated for user by super admin (${terminated.length} sessions)`,
      metadata: { userId, reason, sessionCount: terminated.length },
      req,
    });

    res.json({
      success: true,
      message: `${terminated.length} session(s) terminated successfully`,
      count: terminated.length,
    });
  } catch (error: any) {
    console.error("Error terminating user sessions:", error);
    res.status(500).json({ message: "Failed to terminate user sessions" });
  }
});

// Force terminate all sessions for a school
router.post("/api/super-admin/sessions/school/:schoolId/terminate-all", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { schoolId } = req.params;
    const { reason } = req.body;

    const [school] = await db.select().from(schools).where(eq(schools.id, schoolId));
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    const terminated = await forceTerminateSchoolSessions({
      schoolId,
      terminatedBy: req.user.id,
      reason,
    });

    // Log security event
    await logSecurityEvent({
      eventType: "session_terminated",
      severity: "warning",
      platform: "sms",
      schoolId,
      schoolName: school.name,
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: "super_admin",
      description: `All sessions terminated for school ${school.name} by super admin (${terminated.length} sessions)`,
      metadata: { schoolId, schoolName: school.name, reason, sessionCount: terminated.length },
      req,
    });

    res.json({
      success: true,
      message: `${terminated.length} session(s) terminated for ${school.name}`,
      count: terminated.length,
    });
  } catch (error: any) {
    console.error("Error terminating school sessions:", error);
    res.status(500).json({ message: "Failed to terminate school sessions" });
  }
});

// Cleanup expired sessions
router.post("/api/super-admin/sessions/cleanup", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const cleaned = await cleanupExpiredSessions();
    res.json({
      success: true,
      message: `${cleaned} expired session(s) cleaned up`,
      count: cleaned,
    });
  } catch (error: any) {
    console.error("Error cleaning up sessions:", error);
    res.status(500).json({ message: "Failed to cleanup sessions" });
  }
});

// ============= Security Events =============

// Get security events with filters
router.get("/api/super-admin/security-events", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { 
      limit = "50", 
      offset = "0", 
      platform = "all", 
      eventType,
      severity,
      schoolId,
      targetUserId,
      ipAddress,
      isResolved,
      startDate,
      endDate,
    } = req.query;

    const events = await getSecurityEvents({
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      platform: platform as "lms" | "sms" | "all",
      eventType: eventType as string | undefined,
      severity: severity as string | undefined,
      schoolId: schoolId as string | undefined,
      targetUserId: targetUserId as string | undefined,
      ipAddress: ipAddress as string | undefined,
      isResolved: isResolved !== undefined ? isResolved === "true" : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    const total = await getSecurityEventsCount({
      platform: platform as "lms" | "sms" | "all",
      eventType: eventType as string | undefined,
      severity: severity as string | undefined,
      isResolved: isResolved !== undefined ? isResolved === "true" : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({
      events,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error: any) {
    console.error("Error fetching security events:", error);
    res.status(500).json({ message: "Failed to fetch security events" });
  }
});

// Get security event stats
router.get("/api/super-admin/security-events/stats", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await getSecurityEventStats({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    
    res.json(stats);
  } catch (error: any) {
    console.error("Error fetching security event stats:", error);
    res.status(500).json({ message: "Failed to fetch security event stats" });
  }
});

// Resolve a security event
router.post("/api/super-admin/security-events/:eventId/resolve", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { eventId } = req.params;
    const { notes } = req.body;

    const resolved = await resolveSecurityEvent({
      eventId,
      resolvedBy: req.user.id,
      notes,
    });

    if (!resolved) {
      return res.status(404).json({ message: "Security event not found" });
    }

    res.json({
      success: true,
      message: "Security event resolved",
      event: resolved,
    });
  } catch (error: any) {
    console.error("Error resolving security event:", error);
    res.status(500).json({ message: "Failed to resolve security event" });
  }
});

// ============= Bulk School Operations =============

// Bulk activate schools
router.post("/api/super-admin/schools/bulk/activate", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { schoolIds } = req.body;

    if (!Array.isArray(schoolIds) || schoolIds.length === 0) {
      return res.status(400).json({ message: "schoolIds array is required" });
    }

    const results = await Promise.all(
      schoolIds.map(async (schoolId: string) => {
        try {
          const [updated] = await db.update(schools)
            .set({ isActive: true })
            .where(eq(schools.id, schoolId))
            .returning();
          
          if (updated) {
            await logPlatformActivity({
              activityType: "admin_action",
              platform: "sms",
              description: `School ${updated.name} activated by super admin`,
              entityType: "school",
              entityId: schoolId,
              entityName: updated.name,
              actorId: req.user.id,
              actorType: "super_admin",
              actorEmail: req.user.email,
              schoolId,
              schoolName: updated.name,
              metadata: { action: "bulk_activate" },
              severity: "info",
              req,
            });
          }
          
          return { schoolId, success: true, name: updated?.name };
        } catch (error) {
          return { schoolId, success: false, error: "Failed to activate" };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    
    // Log bulk action
    await logSecurityEvent({
      eventType: "bulk_action",
      severity: "info",
      platform: "sms",
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: "super_admin",
      description: `Bulk activated ${successCount} schools`,
      metadata: { action: "bulk_activate", schoolIds, results },
      req,
    });

    res.json({
      success: true,
      message: `${successCount} of ${schoolIds.length} schools activated`,
      results,
    });
  } catch (error: any) {
    console.error("Error bulk activating schools:", error);
    res.status(500).json({ message: "Failed to activate schools" });
  }
});

// Bulk deactivate schools
router.post("/api/super-admin/schools/bulk/deactivate", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { schoolIds, reason } = req.body;

    if (!Array.isArray(schoolIds) || schoolIds.length === 0) {
      return res.status(400).json({ message: "schoolIds array is required" });
    }

    const results = await Promise.all(
      schoolIds.map(async (schoolId: string) => {
        try {
          const [updated] = await db.update(schools)
            .set({ isActive: false })
            .where(eq(schools.id, schoolId))
            .returning();
          
          if (updated) {
            // Terminate all sessions for this school
            await forceTerminateSchoolSessions({
              schoolId,
              terminatedBy: req.user.id,
              reason: reason || "School deactivated",
            });
            
            await logPlatformActivity({
              activityType: "admin_action",
              platform: "sms",
              description: `School ${updated.name} deactivated by super admin`,
              entityType: "school",
              entityId: schoolId,
              entityName: updated.name,
              actorId: req.user.id,
              actorType: "super_admin",
              actorEmail: req.user.email,
              schoolId,
              schoolName: updated.name,
              metadata: { action: "bulk_deactivate", reason },
              severity: "warning",
              req,
            });
          }
          
          return { schoolId, success: true, name: updated?.name };
        } catch (error) {
          return { schoolId, success: false, error: "Failed to deactivate" };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    
    // Log bulk action
    await logSecurityEvent({
      eventType: "bulk_action",
      severity: "warning",
      platform: "sms",
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: "super_admin",
      description: `Bulk deactivated ${successCount} schools`,
      metadata: { action: "bulk_deactivate", schoolIds, reason, results },
      req,
    });

    res.json({
      success: true,
      message: `${successCount} of ${schoolIds.length} schools deactivated`,
      results,
    });
  } catch (error: any) {
    console.error("Error bulk deactivating schools:", error);
    res.status(500).json({ message: "Failed to deactivate schools" });
  }
});

// Bulk delete schools (soft delete by deactivating and marking)
router.post("/api/super-admin/schools/bulk/delete", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { schoolIds, reason, hardDelete = false } = req.body;

    if (!Array.isArray(schoolIds) || schoolIds.length === 0) {
      return res.status(400).json({ message: "schoolIds array is required" });
    }

    const results = await Promise.all(
      schoolIds.map(async (schoolId: string) => {
        try {
          const [school] = await db.select().from(schools).where(eq(schools.id, schoolId));
          
          if (!school) {
            return { schoolId, success: false, error: "School not found" };
          }
          
          // Terminate all sessions first
          await forceTerminateSchoolSessions({
            schoolId,
            terminatedBy: req.user.id,
            reason: reason || "School deleted",
          });
          
          if (hardDelete) {
            // Hard delete - remove from database (cascades to related tables)
            await db.delete(schools).where(eq(schools.id, schoolId));
          } else {
            // Soft delete - just deactivate
            await db.update(schools)
              .set({ isActive: false })
              .where(eq(schools.id, schoolId));
          }
          
          await logPlatformActivity({
            activityType: "admin_action",
            platform: "sms",
            description: `School ${school.name} ${hardDelete ? 'permanently deleted' : 'soft deleted'} by super admin`,
            entityType: "school",
            entityId: schoolId,
            entityName: school.name,
            actorId: req.user.id,
            actorType: "super_admin",
            actorEmail: req.user.email,
            metadata: { action: hardDelete ? "hard_delete" : "soft_delete", reason },
            severity: "error",
            req,
          });
          
          return { schoolId, success: true, name: school.name };
        } catch (error) {
          return { schoolId, success: false, error: "Failed to delete" };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    
    // Log bulk action
    await logSecurityEvent({
      eventType: "bulk_action",
      severity: "critical",
      platform: "sms",
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: "super_admin",
      description: `Bulk ${hardDelete ? 'permanently' : 'soft'} deleted ${successCount} schools`,
      metadata: { action: hardDelete ? "bulk_hard_delete" : "bulk_soft_delete", schoolIds, reason, results },
      req,
    });

    res.json({
      success: true,
      message: `${successCount} of ${schoolIds.length} schools ${hardDelete ? 'permanently deleted' : 'soft deleted'}`,
      results,
    });
  } catch (error: any) {
    console.error("Error bulk deleting schools:", error);
    res.status(500).json({ message: "Failed to delete schools" });
  }
});

// Bulk update subscription status
router.post("/api/super-admin/schools/bulk/update-subscription", isAuthenticated, requireOnboarding, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { schoolIds, subscriptionStatus } = req.body;

    if (!Array.isArray(schoolIds) || schoolIds.length === 0) {
      return res.status(400).json({ message: "schoolIds array is required" });
    }

    const validStatuses = ["active", "trial", "expired", "cancelled", "pending"];
    if (!validStatuses.includes(subscriptionStatus)) {
      return res.status(400).json({ message: "Invalid subscription status" });
    }

    const results = await Promise.all(
      schoolIds.map(async (schoolId: string) => {
        try {
          const [updated] = await db.update(schools)
            .set({ subscriptionStatus })
            .where(eq(schools.id, schoolId))
            .returning();
          
          if (updated) {
            await logPlatformActivity({
              activityType: "admin_action",
              platform: "sms",
              description: `School ${updated.name} subscription status updated to ${subscriptionStatus}`,
              entityType: "school",
              entityId: schoolId,
              entityName: updated.name,
              actorId: req.user.id,
              actorType: "super_admin",
              actorEmail: req.user.email,
              schoolId,
              schoolName: updated.name,
              metadata: { action: "bulk_update_subscription", newStatus: subscriptionStatus },
              severity: "info",
              req,
            });
          }
          
          return { schoolId, success: true, name: updated?.name };
        } catch (error) {
          return { schoolId, success: false, error: "Failed to update" };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      message: `${successCount} of ${schoolIds.length} schools updated to ${subscriptionStatus}`,
      results,
    });
  } catch (error: any) {
    console.error("Error bulk updating schools:", error);
    res.status(500).json({ message: "Failed to update schools" });
  }
});

export default router;
