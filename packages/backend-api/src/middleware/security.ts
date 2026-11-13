import { Request, Response, NextFunction } from 'express';

/**
 * Security headers (Helmet-equivalent zero-dependency hardening for Express)
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  res.removeHeader('X-Powered-By');
  next();
}

interface RateBucket {
  count: number;
  resetAt: number;
}

/**
 * Sliding/fixed window rate limiter per client IP + route bucket
 */
export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
  message?: string;
}) {
  const buckets = new Map<string, RateBucket>();

  // Periodic sweep to keep memory bounded
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [k, b] of buckets.entries()) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }, Math.max(options.windowMs, 30000));
  if (cleanupTimer.unref) cleanupTimer.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.DISABLE_RATE_LIMIT === 'true' && process.env.NODE_ENV === 'test') {
      return next();
    }
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      'unknown';
    const key = `${options.keyPrefix}:${clientIp}`;
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    existing.count += 1;
    if (existing.count > options.maxRequests) {
      const retryAfterSec = Math.ceil((existing.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(Math.max(1, retryAfterSec)));
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message: options.message || 'Too many requests. Please wait before retrying.',
      });
    }

    next();
  };
}

/**
 * Strip ASCII control characters and dangerous HTML script tags from string inputs
 * without mutating base64 data URLs or long binary strings.
 */
function cleanValue(val: unknown): unknown {
  if (typeof val === 'string') {
    if (val.startsWith('data:')) return val;
    return val
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  if (Array.isArray(val)) return val.map(cleanValue);
  if (val && typeof val === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      out[k] = cleanValue(v);
    }
    return out;
  }
  return val;
}

export function sanitizeRequestBody(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = cleanValue(req.body);
  }
  next();
}

