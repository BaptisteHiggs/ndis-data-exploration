// Simple in-memory rate limiter
// Tracks failed attempts by IP and blocks after threshold

interface RateLimitEntry {
  attempts: number;
  blockedUntil?: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Configuration
const MAX_ATTEMPTS = 5; // Max failed attempts
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const CLEANUP_INTERVAL = 60 * 60 * 1000; // Clean up old entries every hour

// Periodically clean up old entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (entry.blockedUntil && entry.blockedUntil < now) {
      rateLimitMap.delete(ip);
    }
  }
}, CLEANUP_INTERVAL);

export function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts?: number; blockedUntil?: Date } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  // If blocked, check if block has expired
  if (entry?.blockedUntil) {
    if (entry.blockedUntil > now) {
      return {
        allowed: false,
        blockedUntil: new Date(entry.blockedUntil),
      };
    }
    // Block expired, reset
    rateLimitMap.delete(ip);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Not blocked
  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - (entry?.attempts || 0),
  };
}

export function recordFailedAttempt(ip: string): void {
  const entry = rateLimitMap.get(ip) || { attempts: 0 };
  entry.attempts += 1;

  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.blockedUntil = Date.now() + BLOCK_DURATION;
  }

  rateLimitMap.set(ip, entry);
}

export function resetAttempts(ip: string): void {
  rateLimitMap.delete(ip);
}
