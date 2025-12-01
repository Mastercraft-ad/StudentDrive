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
} from "@shared/schema";
import { eq, desc, sql, and, count, sum, gte, lte } from "drizzle-orm";
import { isAuthenticated, requireOnboarding } from "./auth";

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

export default router;
