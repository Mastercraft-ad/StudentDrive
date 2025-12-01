import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler, Request } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { storage } from "./storage";
import { 
  createActiveSession, 
  endSession, 
  logSecurityEvent, 
  checkBruteForce,
  updateSessionActivity 
} from "./session-security-service";

export function getSession() {
  const sessionTtlMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  const sessionTtlSeconds = sessionTtlMs / 1000; // convert to seconds for pg store
  
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtlSeconds, // connect-pg-simple expects seconds
    tableName: "sessions",
  });
  
  const isProduction = process.env.NODE_ENV === 'production';
  const isReplit = !!process.env.REPLIT_DOMAINS;
  
  return session({
    secret: process.env.SESSION_SECRET || "studentdrive-secret-key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction || isReplit,
      sameSite: 'lax',
      maxAge: sessionTtlMs, // cookie maxAge expects milliseconds
      path: '/',
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passReqToCallback: true },
      async (req: Request, email: string, password: string, done: any) => {
        try {
          // Check for brute force attempts
          const bruteForceCheck = await checkBruteForce({
            email,
            ipAddress: req.ip || req.socket?.remoteAddress,
          });
          
          if (bruteForceCheck.isBruteForce) {
            await logSecurityEvent({
              eventType: "brute_force_detected",
              severity: "critical",
              platform: "lms",
              targetUserEmail: email,
              description: `Brute force attack detected: ${bruteForceCheck.attemptCount} failed attempts in ${bruteForceCheck.timeWindowMinutes} minutes`,
              metadata: bruteForceCheck,
              req,
            });
            return done(null, false, { message: "Too many failed attempts. Please try again later." });
          }
          
          const user = await storage.getUserByEmail(email);
          if (!user) {
            // Log failed login - user not found
            await logSecurityEvent({
              eventType: "login_failed",
              severity: "warning",
              platform: "lms",
              targetUserEmail: email,
              description: `Failed login attempt: User not found for email ${email}`,
              metadata: { reason: "user_not_found" },
              req,
            });
            return done(null, false, { message: "Invalid email or password" });
          }

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            // Log failed login - wrong password
            await logSecurityEvent({
              eventType: "login_failed",
              severity: "warning",
              platform: "lms",
              targetUserId: user.id,
              targetUserEmail: email,
              targetUserRole: user.role || undefined,
              description: `Failed login attempt: Invalid password for ${email}`,
              metadata: { reason: "invalid_password" },
              req,
            });
            return done(null, false, { message: "Invalid email or password" });
          }

          // Log successful login
          await logSecurityEvent({
            eventType: "login_success",
            severity: "info",
            platform: "lms",
            targetUserId: user.id,
            targetUserEmail: email,
            targetUserRole: user.role || undefined,
            description: `Successful login for ${email}`,
            req,
          });

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export const requireEmailVerified: RequestHandler = (req: any, res, next) => {
  if (req.isAuthenticated() && req.user?.emailVerified) {
    return next();
  }
  res.status(403).json({ message: "Email verification required" });
};

export const requireOnboarding: RequestHandler = (req: any, res, next) => {
  if (req.isAuthenticated()) {
    if (req.user?.role === 'super_admin' || req.user?.onboardingCompleted) {
      return next();
    }
  }
  res.status(403).json({ message: "Onboarding required" });
};

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
