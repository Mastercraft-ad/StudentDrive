import { db } from "./db";
import { userActiveSessions, securityEvents, type InsertUserActiveSession, type InsertSecurityEvent } from "@shared/schema";
import { eq, desc, and, gte, lte, count, sql, or, isNull } from "drizzle-orm";
import type { Request } from "express";
import UAParser from "ua-parser-js";

// Parse user agent to extract device info
function parseUserAgent(userAgent: string | undefined) {
  if (!userAgent) return { deviceType: "unknown", browser: "unknown", os: "unknown" };
  
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  let deviceType = "desktop";
  if (result.device.type === "mobile") deviceType = "mobile";
  else if (result.device.type === "tablet") deviceType = "tablet";
  
  return {
    deviceType,
    browser: result.browser.name || "unknown",
    os: result.os.name || "unknown",
  };
}

// Session Types
export type SecurityEventType = 
  | "login_failed"
  | "login_success"
  | "logout"
  | "password_reset_requested"
  | "password_changed"
  | "account_locked"
  | "account_unlocked"
  | "suspicious_activity"
  | "session_hijack_attempt"
  | "brute_force_detected"
  | "ip_blocked"
  | "mfa_failed"
  | "permission_denied"
  | "session_terminated"
  | "bulk_action";

export type SecuritySeverity = "info" | "warning" | "error" | "critical";

// Create a new active session
export async function createActiveSession(params: {
  userId: string;
  userEmail: string;
  userRole?: string;
  userName?: string;
  platform: "lms" | "sms";
  schoolId?: string;
  schoolName?: string;
  sessionId: string;
  req?: Request;
  expiresAt?: Date;
}) {
  try {
    const ipAddress = params.req?.ip || params.req?.socket?.remoteAddress || null;
    const userAgent = params.req?.get("user-agent") || null;
    const deviceInfo = parseUserAgent(userAgent || undefined);
    
    // Calculate expiry (7 days from now if not specified)
    const expiresAt = params.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const [session] = await db.insert(userActiveSessions).values({
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      userName: params.userName,
      platform: params.platform,
      schoolId: params.schoolId,
      schoolName: params.schoolName,
      sessionId: params.sessionId,
      ipAddress,
      userAgent,
      deviceType: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      isActive: true,
      expiresAt,
    }).returning();
    
    return session;
  } catch (error) {
    console.error("Error creating active session:", error);
    return null;
  }
}

// Update session last activity
export async function updateSessionActivity(sessionId: string) {
  try {
    await db.update(userActiveSessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(userActiveSessions.sessionId, sessionId));
    return true;
  } catch (error) {
    console.error("Error updating session activity:", error);
    return false;
  }
}

// End a session (logout)
export async function endSession(sessionId: string) {
  try {
    await db.update(userActiveSessions)
      .set({ 
        isActive: false,
        terminatedAt: new Date(),
      })
      .where(eq(userActiveSessions.sessionId, sessionId));
    return true;
  } catch (error) {
    console.error("Error ending session:", error);
    return false;
  }
}

// Force terminate a session (by super admin)
export async function forceTerminateSession(params: {
  sessionId: string;
  terminatedBy: string;
  reason?: string;
}) {
  try {
    const [terminated] = await db.update(userActiveSessions)
      .set({ 
        isActive: false,
        terminatedAt: new Date(),
        terminatedBy: params.terminatedBy,
        terminationReason: params.reason || "Terminated by administrator",
      })
      .where(and(
        eq(userActiveSessions.sessionId, params.sessionId),
        eq(userActiveSessions.isActive, true)
      ))
      .returning();
    
    return terminated;
  } catch (error) {
    console.error("Error force terminating session:", error);
    return null;
  }
}

// Force terminate all sessions for a user
export async function forceTerminateUserSessions(params: {
  userId: string;
  terminatedBy: string;
  reason?: string;
}) {
  try {
    const terminated = await db.update(userActiveSessions)
      .set({ 
        isActive: false,
        terminatedAt: new Date(),
        terminatedBy: params.terminatedBy,
        terminationReason: params.reason || "All sessions terminated by administrator",
      })
      .where(and(
        eq(userActiveSessions.userId, params.userId),
        eq(userActiveSessions.isActive, true)
      ))
      .returning();
    
    return terminated;
  } catch (error) {
    console.error("Error force terminating user sessions:", error);
    return [];
  }
}

// Force terminate all sessions for a school
export async function forceTerminateSchoolSessions(params: {
  schoolId: string;
  terminatedBy: string;
  reason?: string;
}) {
  try {
    const terminated = await db.update(userActiveSessions)
      .set({ 
        isActive: false,
        terminatedAt: new Date(),
        terminatedBy: params.terminatedBy,
        terminationReason: params.reason || "All school sessions terminated by administrator",
      })
      .where(and(
        eq(userActiveSessions.schoolId, params.schoolId),
        eq(userActiveSessions.isActive, true)
      ))
      .returning();
    
    return terminated;
  } catch (error) {
    console.error("Error force terminating school sessions:", error);
    return [];
  }
}

// Get active sessions with filters
export async function getActiveSessions(options: {
  limit?: number;
  offset?: number;
  platform?: "lms" | "sms" | "all";
  schoolId?: string;
  userId?: string;
  isActive?: boolean;
}) {
  try {
    const { limit = 50, offset = 0, platform = "all", schoolId, userId, isActive = true } = options;
    
    const conditions = [];
    
    if (platform !== "all") {
      conditions.push(eq(userActiveSessions.platform, platform));
    }
    
    if (schoolId) {
      conditions.push(eq(userActiveSessions.schoolId, schoolId));
    }
    
    if (userId) {
      conditions.push(eq(userActiveSessions.userId, userId));
    }
    
    if (isActive !== undefined) {
      conditions.push(eq(userActiveSessions.isActive, isActive));
    }
    
    const query = db
      .select()
      .from(userActiveSessions)
      .orderBy(desc(userActiveSessions.lastActivityAt))
      .limit(limit)
      .offset(offset);
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }
    
    return await query;
  } catch (error) {
    console.error("Error getting active sessions:", error);
    return [];
  }
}

// Get active sessions count
export async function getActiveSessionsCount(options: {
  platform?: "lms" | "sms" | "all";
  schoolId?: string;
}) {
  try {
    const { platform = "all", schoolId } = options;
    
    const conditions = [eq(userActiveSessions.isActive, true)];
    
    if (platform !== "all") {
      conditions.push(eq(userActiveSessions.platform, platform));
    }
    
    if (schoolId) {
      conditions.push(eq(userActiveSessions.schoolId, schoolId));
    }
    
    const [result] = await db
      .select({ count: count() })
      .from(userActiveSessions)
      .where(and(...conditions));
    
    return result?.count || 0;
  } catch (error) {
    console.error("Error getting active sessions count:", error);
    return 0;
  }
}

// Get session stats
export async function getSessionStats() {
  try {
    const [totalActive] = await db
      .select({ count: count() })
      .from(userActiveSessions)
      .where(eq(userActiveSessions.isActive, true));
    
    const [lmsActive] = await db
      .select({ count: count() })
      .from(userActiveSessions)
      .where(and(
        eq(userActiveSessions.isActive, true),
        eq(userActiveSessions.platform, "lms")
      ));
    
    const [smsActive] = await db
      .select({ count: count() })
      .from(userActiveSessions)
      .where(and(
        eq(userActiveSessions.isActive, true),
        eq(userActiveSessions.platform, "sms")
      ));
    
    // Get sessions by device type
    const deviceStats = await db
      .select({
        deviceType: userActiveSessions.deviceType,
        count: count(),
      })
      .from(userActiveSessions)
      .where(eq(userActiveSessions.isActive, true))
      .groupBy(userActiveSessions.deviceType);
    
    return {
      totalActive: totalActive?.count || 0,
      lmsActive: lmsActive?.count || 0,
      smsActive: smsActive?.count || 0,
      byDevice: deviceStats.reduce((acc, item) => {
        acc[item.deviceType || "unknown"] = item.count;
        return acc;
      }, {} as Record<string, number>),
    };
  } catch (error) {
    console.error("Error getting session stats:", error);
    return {
      totalActive: 0,
      lmsActive: 0,
      smsActive: 0,
      byDevice: {},
    };
  }
}

// Clean up expired sessions
export async function cleanupExpiredSessions() {
  try {
    const now = new Date();
    
    const updated = await db.update(userActiveSessions)
      .set({ isActive: false })
      .where(and(
        eq(userActiveSessions.isActive, true),
        lte(userActiveSessions.expiresAt, now)
      ))
      .returning();
    
    return updated.length;
  } catch (error) {
    console.error("Error cleaning up expired sessions:", error);
    return 0;
  }
}

// ============= Security Events =============

// Log a security event
export async function logSecurityEvent(params: {
  eventType: SecurityEventType;
  severity?: SecuritySeverity;
  platform: "lms" | "sms";
  schoolId?: string;
  schoolName?: string;
  targetUserId?: string;
  targetUserEmail?: string;
  targetUserRole?: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  description: string;
  metadata?: Record<string, any>;
  req?: Request;
}) {
  try {
    const ipAddress = params.req?.ip || params.req?.socket?.remoteAddress || null;
    const userAgent = params.req?.get("user-agent") || null;
    const requestPath = params.req?.path || null;
    const requestMethod = params.req?.method || null;
    
    const [event] = await db.insert(securityEvents).values({
      eventType: params.eventType,
      severity: params.severity || "info",
      platform: params.platform,
      schoolId: params.schoolId,
      schoolName: params.schoolName,
      targetUserId: params.targetUserId,
      targetUserEmail: params.targetUserEmail,
      targetUserRole: params.targetUserRole,
      actorId: params.actorId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      description: params.description,
      metadata: params.metadata,
      ipAddress,
      userAgent,
      requestPath,
      requestMethod,
    }).returning();
    
    return event;
  } catch (error) {
    console.error("Error logging security event:", error);
    return null;
  }
}

// Get security events with filters
export async function getSecurityEvents(options: {
  limit?: number;
  offset?: number;
  platform?: "lms" | "sms" | "all";
  eventType?: string;
  severity?: string;
  schoolId?: string;
  targetUserId?: string;
  ipAddress?: string;
  isResolved?: boolean;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const {
      limit = 50,
      offset = 0,
      platform = "all",
      eventType,
      severity,
      schoolId,
      targetUserId,
      ipAddress,
      isResolved,
      startDate,
      endDate,
    } = options;
    
    const conditions = [];
    
    if (platform !== "all") {
      conditions.push(eq(securityEvents.platform, platform));
    }
    
    if (eventType) {
      conditions.push(eq(securityEvents.eventType, eventType));
    }
    
    if (severity) {
      conditions.push(eq(securityEvents.severity, severity));
    }
    
    if (schoolId) {
      conditions.push(eq(securityEvents.schoolId, schoolId));
    }
    
    if (targetUserId) {
      conditions.push(eq(securityEvents.targetUserId, targetUserId));
    }
    
    if (ipAddress) {
      conditions.push(eq(securityEvents.ipAddress, ipAddress));
    }
    
    if (isResolved !== undefined) {
      conditions.push(eq(securityEvents.isResolved, isResolved));
    }
    
    if (startDate) {
      conditions.push(gte(securityEvents.createdAt, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(securityEvents.createdAt, endDate));
    }
    
    const query = db
      .select()
      .from(securityEvents)
      .orderBy(desc(securityEvents.createdAt))
      .limit(limit)
      .offset(offset);
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }
    
    return await query;
  } catch (error) {
    console.error("Error getting security events:", error);
    return [];
  }
}

// Get security events count
export async function getSecurityEventsCount(options: {
  platform?: "lms" | "sms" | "all";
  eventType?: string;
  severity?: string;
  isResolved?: boolean;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const { platform = "all", eventType, severity, isResolved, startDate, endDate } = options;
    
    const conditions = [];
    
    if (platform !== "all") {
      conditions.push(eq(securityEvents.platform, platform));
    }
    
    if (eventType) {
      conditions.push(eq(securityEvents.eventType, eventType));
    }
    
    if (severity) {
      conditions.push(eq(securityEvents.severity, severity));
    }
    
    if (isResolved !== undefined) {
      conditions.push(eq(securityEvents.isResolved, isResolved));
    }
    
    if (startDate) {
      conditions.push(gte(securityEvents.createdAt, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(securityEvents.createdAt, endDate));
    }
    
    const query = db.select({ count: count() }).from(securityEvents);
    
    if (conditions.length > 0) {
      const [result] = await query.where(and(...conditions));
      return result?.count || 0;
    }
    
    const [result] = await query;
    return result?.count || 0;
  } catch (error) {
    console.error("Error getting security events count:", error);
    return 0;
  }
}

// Get security event stats
export async function getSecurityEventStats(options?: {
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const conditions = [];
    
    if (options?.startDate) {
      conditions.push(gte(securityEvents.createdAt, options.startDate));
    }
    
    if (options?.endDate) {
      conditions.push(lte(securityEvents.createdAt, options.endDate));
    }
    
    // Count by severity
    const severityCounts = await db
      .select({
        severity: securityEvents.severity,
        count: count(),
      })
      .from(securityEvents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(securityEvents.severity);
    
    // Count by event type
    const typeCounts = await db
      .select({
        eventType: securityEvents.eventType,
        count: count(),
      })
      .from(securityEvents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(securityEvents.eventType);
    
    // Count unresolved
    const [unresolvedCount] = await db
      .select({ count: count() })
      .from(securityEvents)
      .where(and(
        eq(securityEvents.isResolved, false),
        ...(conditions.length > 0 ? conditions : [])
      ));
    
    // Recent critical/error events
    const recentCritical = await db
      .select()
      .from(securityEvents)
      .where(and(
        or(
          eq(securityEvents.severity, "critical"),
          eq(securityEvents.severity, "error")
        ),
        ...(conditions.length > 0 ? conditions : [])
      ))
      .orderBy(desc(securityEvents.createdAt))
      .limit(10);
    
    return {
      bySeverity: severityCounts.reduce((acc, item) => {
        acc[item.severity] = item.count;
        return acc;
      }, {} as Record<string, number>),
      byType: typeCounts.reduce((acc, item) => {
        acc[item.eventType] = item.count;
        return acc;
      }, {} as Record<string, number>),
      unresolved: unresolvedCount?.count || 0,
      recentCritical,
    };
  } catch (error) {
    console.error("Error getting security event stats:", error);
    return {
      bySeverity: {},
      byType: {},
      unresolved: 0,
      recentCritical: [],
    };
  }
}

// Resolve a security event
export async function resolveSecurityEvent(params: {
  eventId: string;
  resolvedBy: string;
  notes?: string;
}) {
  try {
    const [resolved] = await db.update(securityEvents)
      .set({
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: params.resolvedBy,
        resolutionNotes: params.notes,
      })
      .where(eq(securityEvents.id, params.eventId))
      .returning();
    
    return resolved;
  } catch (error) {
    console.error("Error resolving security event:", error);
    return null;
  }
}

// Check for brute force attempts (more than 5 failed logins in 15 minutes)
export async function checkBruteForce(params: {
  email?: string;
  ipAddress?: string;
  timeWindowMinutes?: number;
  maxAttempts?: number;
}) {
  try {
    const timeWindow = params.timeWindowMinutes || 15;
    const maxAttempts = params.maxAttempts || 5;
    const since = new Date(Date.now() - timeWindow * 60 * 1000);
    
    const conditions = [
      eq(securityEvents.eventType, "login_failed"),
      gte(securityEvents.createdAt, since),
    ];
    
    if (params.email) {
      conditions.push(eq(securityEvents.targetUserEmail, params.email));
    }
    
    if (params.ipAddress) {
      conditions.push(eq(securityEvents.ipAddress, params.ipAddress));
    }
    
    const [result] = await db
      .select({ count: count() })
      .from(securityEvents)
      .where(and(...conditions));
    
    const failedAttempts = result?.count || 0;
    
    return {
      isBruteForce: failedAttempts >= maxAttempts,
      attemptCount: failedAttempts,
      threshold: maxAttempts,
      timeWindowMinutes: timeWindow,
    };
  } catch (error) {
    console.error("Error checking brute force:", error);
    return {
      isBruteForce: false,
      attemptCount: 0,
      threshold: params.maxAttempts || 5,
      timeWindowMinutes: params.timeWindowMinutes || 15,
    };
  }
}
