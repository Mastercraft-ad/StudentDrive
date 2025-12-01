import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { storage } from "./storage";

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
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            return done(null, false, { message: "Invalid email or password" });
          }

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
