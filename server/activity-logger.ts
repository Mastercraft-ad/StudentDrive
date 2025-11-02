import type { Request } from "express";
import { db } from "./db";
import { userActivityLogs, userStatistics } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export type ActivityType =
  | "login"
  | "logout"
  | "material_upload"
  | "material_view"
  | "material_download"
  | "quiz_taken"
  | "quiz_created"
  | "blog_post_created"
  | "bookmark_created"
  | "profile_updated"
  | "password_changed";

export async function logUserActivity(
  userId: string,
  activityType: ActivityType,
  description: string,
  metadata?: Record<string, any>,
  req?: Request
) {
  try {
    const ipAddress = req?.ip || req?.socket?.remoteAddress || null;
    const userAgent = req?.get("user-agent") || null;

    await db.insert(userActivityLogs).values({
      userId,
      activityType,
      description,
      metadata,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error("Error logging user activity:", error);
  }
}

export async function updateUserStatistics(
  userId: string,
  updates: {
    loginCount?: number;
    lastLoginAt?: Date;
    materialsUploaded?: number;
    materialsViewed?: number;
    materialsDownloaded?: number;
    quizzesTaken?: number;
    quizzesCreated?: number;
    blogPostsCreated?: number;
    bookmarksCreated?: number;
    averageQuizScore?: number;
    totalTimeSpent?: number;
  },
  mode: 'increment' | 'set' = 'increment'
) {
  try {
    const existing = await db
      .select()
      .from(userStatistics)
      .where(eq(userStatistics.userId, userId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(userStatistics).values({
        userId,
        loginCount: updates.loginCount || 0,
        lastLoginAt: updates.lastLoginAt,
        materialsUploaded: updates.materialsUploaded || 0,
        materialsViewed: updates.materialsViewed || 0,
        materialsDownloaded: updates.materialsDownloaded || 0,
        quizzesTaken: updates.quizzesTaken || 0,
        quizzesCreated: updates.quizzesCreated || 0,
        blogPostsCreated: updates.blogPostsCreated || 0,
        bookmarksCreated: updates.bookmarksCreated || 0,
        averageQuizScore: updates.averageQuizScore,
        totalTimeSpent: updates.totalTimeSpent || 0,
      });
    } else {
      const current = existing[0];
      
      const updateData: any = {};
      
      if (mode === 'set') {
        if (updates.loginCount !== undefined) updateData.loginCount = updates.loginCount;
        if (updates.lastLoginAt !== undefined) updateData.lastLoginAt = updates.lastLoginAt;
        if (updates.materialsUploaded !== undefined) updateData.materialsUploaded = updates.materialsUploaded;
        if (updates.materialsViewed !== undefined) updateData.materialsViewed = updates.materialsViewed;
        if (updates.materialsDownloaded !== undefined) updateData.materialsDownloaded = updates.materialsDownloaded;
        if (updates.quizzesTaken !== undefined) updateData.quizzesTaken = updates.quizzesTaken;
        if (updates.quizzesCreated !== undefined) updateData.quizzesCreated = updates.quizzesCreated;
        if (updates.blogPostsCreated !== undefined) updateData.blogPostsCreated = updates.blogPostsCreated;
        if (updates.bookmarksCreated !== undefined) updateData.bookmarksCreated = updates.bookmarksCreated;
        if (updates.averageQuizScore !== undefined) updateData.averageQuizScore = updates.averageQuizScore;
        if (updates.totalTimeSpent !== undefined) updateData.totalTimeSpent = updates.totalTimeSpent;
      } else {
        if (updates.loginCount !== undefined) updateData.loginCount = current.loginCount + updates.loginCount;
        if (updates.lastLoginAt !== undefined) updateData.lastLoginAt = updates.lastLoginAt;
        if (updates.materialsUploaded !== undefined) updateData.materialsUploaded = current.materialsUploaded + updates.materialsUploaded;
        if (updates.materialsViewed !== undefined) updateData.materialsViewed = current.materialsViewed + updates.materialsViewed;
        if (updates.materialsDownloaded !== undefined) updateData.materialsDownloaded = current.materialsDownloaded + updates.materialsDownloaded;
        if (updates.quizzesTaken !== undefined) updateData.quizzesTaken = current.quizzesTaken + updates.quizzesTaken;
        if (updates.quizzesCreated !== undefined) updateData.quizzesCreated = current.quizzesCreated + updates.quizzesCreated;
        if (updates.blogPostsCreated !== undefined) updateData.blogPostsCreated = current.blogPostsCreated + updates.blogPostsCreated;
        if (updates.bookmarksCreated !== undefined) updateData.bookmarksCreated = current.bookmarksCreated + updates.bookmarksCreated;
        if (updates.averageQuizScore !== undefined) updateData.averageQuizScore = updates.averageQuizScore;
        if (updates.totalTimeSpent !== undefined) updateData.totalTimeSpent = (current.totalTimeSpent || 0) + updates.totalTimeSpent;
      }
      
      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = new Date();
        await db
          .update(userStatistics)
          .set(updateData)
          .where(eq(userStatistics.userId, userId));
      }
    }
  } catch (error) {
    console.error("Error updating user statistics:", error);
  }
}

export async function getUserStatistics(userId: string) {
  try {
    const stats = await db
      .select()
      .from(userStatistics)
      .where(eq(userStatistics.userId, userId))
      .limit(1);

    if (stats.length === 0) {
      return null;
    }

    return stats[0];
  } catch (error) {
    console.error("Error getting user statistics:", error);
    return null;
  }
}

export async function getUserActivityLogs(
  userId: string,
  limit: number = 50,
  offset: number = 0
) {
  try {
    const logs = await db
      .select()
      .from(userActivityLogs)
      .where(eq(userActivityLogs.userId, userId))
      .orderBy(sql`${userActivityLogs.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    return logs;
  } catch (error) {
    console.error("Error getting user activity logs:", error);
    return [];
  }
}
