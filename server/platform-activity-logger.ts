import type { Request } from "express";
import { db } from "./db";
import { platformActivityFeed, impersonationLogs } from "@shared/schema";
import { desc, eq, and, gte, lte, or, sql } from "drizzle-orm";

export type PlatformActivityType =
  | "user_registered"
  | "user_login"
  | "user_logout"
  | "user_updated"
  | "user_deleted"
  | "school_registered"
  | "school_activated"
  | "school_deactivated"
  | "school_verified"
  | "school_updated"
  | "school_deleted"
  | "school_user_created"
  | "school_user_login"
  | "school_user_logout"
  | "school_user_updated"
  | "subscription_created"
  | "subscription_renewed"
  | "subscription_expired"
  | "subscription_cancelled"
  | "payment_received"
  | "payment_failed"
  | "material_uploaded"
  | "quiz_created"
  | "announcement_created"
  | "grade_entered"
  | "attendance_marked"
  | "impersonation_started"
  | "impersonation_ended"
  | "admin_action"
  | "system_event";

export type ActivitySeverity = "info" | "warning" | "error" | "success";

export interface LogActivityParams {
  activityType: PlatformActivityType;
  platform: "lms" | "sms";
  description: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  actorId?: string;
  actorType?: "user" | "school_user" | "admin" | "super_admin" | "system";
  actorName?: string;
  actorEmail?: string;
  schoolId?: string;
  schoolName?: string;
  metadata?: Record<string, any>;
  severity?: ActivitySeverity;
  req?: Request;
}

export async function logPlatformActivity(params: LogActivityParams): Promise<boolean> {
  try {
    const ipAddress = params.req?.ip || params.req?.socket?.remoteAddress || null;
    const userAgent = params.req?.get("user-agent") || null;

    await db.insert(platformActivityFeed).values({
      activityType: params.activityType,
      platform: params.platform,
      description: params.description,
      entityType: params.entityType,
      entityId: params.entityId,
      entityName: params.entityName,
      actorId: params.actorId,
      actorType: params.actorType,
      actorName: params.actorName,
      actorEmail: params.actorEmail,
      schoolId: params.schoolId,
      schoolName: params.schoolName,
      metadata: params.metadata,
      severity: params.severity || "info",
      ipAddress,
      userAgent,
    });
    return true;
  } catch (error) {
    console.error("Error logging platform activity:", error);
    return false;
  }
}

export async function getPlatformActivityFeed(options: {
  limit?: number;
  offset?: number;
  platform?: "lms" | "sms" | "all";
  activityType?: string;
  schoolId?: string;
  startDate?: Date;
  endDate?: Date;
  severity?: string;
}) {
  try {
    const {
      limit = 50,
      offset = 0,
      platform = "all",
      activityType,
      schoolId,
      startDate,
      endDate,
      severity,
    } = options;

    const conditions = [];

    if (platform !== "all") {
      conditions.push(eq(platformActivityFeed.platform, platform));
    }

    if (activityType) {
      conditions.push(eq(platformActivityFeed.activityType, activityType));
    }

    if (schoolId) {
      conditions.push(eq(platformActivityFeed.schoolId, schoolId));
    }

    if (severity) {
      conditions.push(eq(platformActivityFeed.severity, severity));
    }

    if (startDate) {
      conditions.push(gte(platformActivityFeed.createdAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(platformActivityFeed.createdAt, endDate));
    }

    const query = db
      .select()
      .from(platformActivityFeed)
      .orderBy(desc(platformActivityFeed.createdAt))
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }

    return await query;
  } catch (error) {
    console.error("Error getting platform activity feed:", error);
    return [];
  }
}

export async function getActivityFeedCount(options: {
  platform?: "lms" | "sms" | "all";
  activityType?: string;
  schoolId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const { platform = "all", activityType, schoolId, startDate, endDate } = options;

    const conditions = [];

    if (platform !== "all") {
      conditions.push(eq(platformActivityFeed.platform, platform));
    }

    if (activityType) {
      conditions.push(eq(platformActivityFeed.activityType, activityType));
    }

    if (schoolId) {
      conditions.push(eq(platformActivityFeed.schoolId, schoolId));
    }

    if (startDate) {
      conditions.push(gte(platformActivityFeed.createdAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(platformActivityFeed.createdAt, endDate));
    }

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(platformActivityFeed)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return result[0]?.count || 0;
  } catch (error) {
    console.error("Error getting activity feed count:", error);
    return 0;
  }
}

export async function logImpersonation(params: {
  superAdminId: string;
  superAdminEmail: string;
  targetSchoolId: string;
  targetSchoolName: string;
  targetUserId?: string;
  targetUserEmail?: string;
  targetUserRole?: string;
  action: "start" | "end";
  reason?: string;
  sessionToken?: string;
  req?: Request;
}) {
  try {
    const ipAddress = params.req?.ip || params.req?.socket?.remoteAddress || null;
    const userAgent = params.req?.get("user-agent") || null;

    if (params.action === "start") {
      const [log] = await db.insert(impersonationLogs).values({
        superAdminId: params.superAdminId,
        superAdminEmail: params.superAdminEmail,
        targetSchoolId: params.targetSchoolId,
        targetSchoolName: params.targetSchoolName,
        targetUserId: params.targetUserId,
        targetUserEmail: params.targetUserEmail,
        targetUserRole: params.targetUserRole,
        action: params.action,
        reason: params.reason,
        sessionToken: params.sessionToken,
        ipAddress,
        userAgent,
      }).returning();

      await logPlatformActivity({
        activityType: "impersonation_started",
        platform: "sms",
        description: `Super admin ${params.superAdminEmail} started impersonating ${params.targetSchoolName}`,
        entityType: "school",
        entityId: params.targetSchoolId,
        entityName: params.targetSchoolName,
        actorId: params.superAdminId,
        actorType: "super_admin",
        actorEmail: params.superAdminEmail,
        schoolId: params.targetSchoolId,
        schoolName: params.targetSchoolName,
        metadata: {
          impersonationLogId: log.id,
          targetUserId: params.targetUserId,
          targetUserEmail: params.targetUserEmail,
          reason: params.reason,
        },
        severity: "warning",
        req: params.req,
      });

      return log;
    } else {
      const [log] = await db
        .update(impersonationLogs)
        .set({
          action: "end",
          endedAt: new Date(),
        })
        .where(
          and(
            eq(impersonationLogs.superAdminId, params.superAdminId),
            eq(impersonationLogs.targetSchoolId, params.targetSchoolId),
            eq(impersonationLogs.action, "start")
          )
        )
        .returning();

      await logPlatformActivity({
        activityType: "impersonation_ended",
        platform: "sms",
        description: `Super admin ${params.superAdminEmail} ended impersonation of ${params.targetSchoolName}`,
        entityType: "school",
        entityId: params.targetSchoolId,
        entityName: params.targetSchoolName,
        actorId: params.superAdminId,
        actorType: "super_admin",
        actorEmail: params.superAdminEmail,
        schoolId: params.targetSchoolId,
        schoolName: params.targetSchoolName,
        severity: "info",
        req: params.req,
      });

      return log;
    }
  } catch (error) {
    console.error("Error logging impersonation:", error);
    return null;
  }
}

export async function getImpersonationLogs(options: {
  limit?: number;
  offset?: number;
  superAdminId?: string;
  schoolId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const { limit = 50, offset = 0, superAdminId, schoolId, startDate, endDate } = options;

    const conditions = [];

    if (superAdminId) {
      conditions.push(eq(impersonationLogs.superAdminId, superAdminId));
    }

    if (schoolId) {
      conditions.push(eq(impersonationLogs.targetSchoolId, schoolId));
    }

    if (startDate) {
      conditions.push(gte(impersonationLogs.createdAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(impersonationLogs.createdAt, endDate));
    }

    const query = db
      .select()
      .from(impersonationLogs)
      .orderBy(desc(impersonationLogs.createdAt))
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }

    return await query;
  } catch (error) {
    console.error("Error getting impersonation logs:", error);
    return [];
  }
}

export async function getActiveImpersonation(superAdminId: string) {
  try {
    const result = await db
      .select()
      .from(impersonationLogs)
      .where(
        and(
          eq(impersonationLogs.superAdminId, superAdminId),
          eq(impersonationLogs.action, "start")
        )
      )
      .orderBy(desc(impersonationLogs.startedAt))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error getting active impersonation:", error);
    return null;
  }
}

export async function getActivityStats(startDate?: Date, endDate?: Date) {
  try {
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = endDate || new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const [lmsCount, smsCount, totalToday] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(platformActivityFeed)
        .where(
          and(
            eq(platformActivityFeed.platform, "lms"),
            gte(platformActivityFeed.createdAt, start),
            lte(platformActivityFeed.createdAt, end)
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(platformActivityFeed)
        .where(
          and(
            eq(platformActivityFeed.platform, "sms"),
            gte(platformActivityFeed.createdAt, start),
            lte(platformActivityFeed.createdAt, end)
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(platformActivityFeed)
        .where(
          and(
            gte(platformActivityFeed.createdAt, start),
            lte(platformActivityFeed.createdAt, end)
          )
        ),
    ]);

    const typeBreakdown = await db
      .select({
        activityType: platformActivityFeed.activityType,
        count: sql<number>`count(*)::int`,
      })
      .from(platformActivityFeed)
      .where(
        and(
          gte(platformActivityFeed.createdAt, start),
          lte(platformActivityFeed.createdAt, end)
        )
      )
      .groupBy(platformActivityFeed.activityType);

    return {
      lmsActivities: lmsCount[0]?.count || 0,
      smsActivities: smsCount[0]?.count || 0,
      totalActivities: totalToday[0]?.count || 0,
      byType: typeBreakdown,
    };
  } catch (error) {
    console.error("Error getting activity stats:", error);
    return {
      lmsActivities: 0,
      smsActivities: 0,
      totalActivities: 0,
      byType: [],
    };
  }
}
