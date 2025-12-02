import rateLimit from 'express-rate-limit';
import { Request } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

const createRateLimitMessage = (retryAfter: number) => ({
  message: 'Too many requests. Please try again later.',
  retryAfter: Math.ceil(retryAfter / 1000),
});

export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 500,
  message: createRateLimitMessage(15 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    return !req.path.startsWith('/api');
  },
  validate: { xForwardedForHeader: false },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 50,
  message: {
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 5 : 20,
  message: {
    message: 'Too many registration attempts. Please try again after an hour.',
    retryAfter: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 3 : 10,
  message: {
    message: 'Too many password reset requests. Please try again after an hour.',
    retryAfter: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 30 : 100,
  message: {
    message: 'Upload limit exceeded. Please try again later.',
    retryAfter: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

export const strictApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isProduction ? 30 : 100,
  message: {
    message: 'Request limit exceeded. Please slow down.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    message: 'Webhook rate limit exceeded.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});
