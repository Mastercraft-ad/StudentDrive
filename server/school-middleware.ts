import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { schools } from "@shared/schema";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      school?: {
        id: string;
        name: string;
        subdomain: string;
        slug: string;
        logoUrl: string | null;
        subscriptionStatus: string;
        isActive: boolean;
        trialEndDate: Date | null;
        primaryColor: string | null;
        secondaryColor: string | null;
      };
      isSchoolContext?: boolean;
    }
  }
}

const MAIN_DOMAINS = [
  'studentdrive.com',
  'www.studentdrive.com',
  'localhost',
  '127.0.0.1',
];

function extractSubdomain(hostname: string): string | null {
  const lowerHost = hostname.toLowerCase();
  
  for (const domain of MAIN_DOMAINS) {
    if (lowerHost === domain || lowerHost.endsWith(`.${domain}`)) {
      if (lowerHost === domain) {
        return null;
      }
      const subdomain = lowerHost.replace(`.${domain}`, '').split('.').pop();
      return subdomain || null;
    }
  }
  
  if (lowerHost.includes('.replit.dev') || lowerHost.includes('.repl.co')) {
    const parts = lowerHost.split('.');
    if (parts.length > 2) {
      const replitHost = parts.slice(-3).join('.');
      const subdomainPart = lowerHost.replace(`.${replitHost}`, '');
      if (subdomainPart && subdomainPart !== lowerHost) {
        return subdomainPart.split('.').pop() || null;
      }
    }
  }
  
  return null;
}

export async function schoolContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const hostname = req.hostname || req.get('host')?.split(':')[0] || '';
    
    const subdomainFromQuery = req.query.__school as string | undefined;
    const subdomain = subdomainFromQuery || extractSubdomain(hostname);
    
    if (!subdomain) {
      req.isSchoolContext = false;
      return next();
    }
    
    const [school] = await db
      .select({
        id: schools.id,
        name: schools.name,
        subdomain: schools.subdomain,
        slug: schools.slug,
        logoUrl: schools.logoUrl,
        subscriptionStatus: schools.subscriptionStatus,
        isActive: schools.isActive,
        trialEndDate: schools.trialEndDate,
        primaryColor: schools.primaryColor,
        secondaryColor: schools.secondaryColor,
      })
      .from(schools)
      .where(eq(schools.subdomain, subdomain))
      .limit(1);
    
    if (!school) {
      req.isSchoolContext = false;
      return next();
    }
    
    if (!school.isActive) {
      res.status(403).json({ 
        message: "This school portal is currently inactive. Please contact the school administrator." 
      });
      return;
    }
    
    if (school.subscriptionStatus === 'expired') {
      const allowedPaths = ['/api/school/subscription', '/api/school/auth/login', '/api/school/auth/logout'];
      if (!allowedPaths.some(path => req.path.startsWith(path))) {
        res.status(402).json({ 
          message: "School subscription has expired. Please renew to continue using the portal.",
          subscriptionStatus: 'expired'
        });
        return;
      }
    }
    
    req.school = school;
    req.isSchoolContext = true;
    
    next();
  } catch (error) {
    console.error('Error in school context middleware:', error);
    next(error);
  }
}

export function requireSchoolContext(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.isSchoolContext || !req.school) {
    res.status(400).json({ 
      message: "This endpoint requires a school context. Please access via your school's subdomain." 
    });
    return;
  }
  next();
}

export function checkTrialStatus(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.school) {
    return next();
  }
  
  if (req.school.subscriptionStatus === 'trial' && req.school.trialEndDate) {
    const now = new Date();
    const trialEnd = new Date(req.school.trialEndDate);
    const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 0) {
      res.status(402).json({ 
        message: "Your free trial has ended. Please subscribe to continue using the school portal.",
        subscriptionStatus: 'trial_expired',
        daysRemaining: 0
      });
      return;
    }
    
    res.setHeader('X-Trial-Days-Remaining', daysRemaining.toString());
  }
  
  next();
}

export function getSchoolFromRequest(req: Request) {
  return req.school || null;
}
