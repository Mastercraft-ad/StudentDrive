import "express-session";

declare module "express-session" {
  interface SessionData {
    schoolUserId?: string;
    schoolId?: string;
  }
}
