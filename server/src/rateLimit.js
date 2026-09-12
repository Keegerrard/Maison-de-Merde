// Minimal in-process rate limiter — no external dependency (added without
// running `npm install`, since this session's sandbox can't reach the repo
// to install packages; see the standing Windows/virtiofs mount outage).
// Fixed-window counter per (IP, bucket key). Good enough for a
// single-instance deploy (this app is served as one Railway process, per
// server.js's own comment about single-service deploy). If this ever runs
// as multiple instances behind a load balancer, swap this for a shared
// store (Redis) — a fixed-window in-memory map won't coordinate across
// processes.

const buckets = new Map(); // key -> { count, resetAt }

// Sweep expired entries periodically so this doesn't grow unbounded across
// a long-running process.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref();

function clientKey(req) {
  // req.ip respects Express's `trust proxy` setting; falls back to the
  // socket address if that's somehow unset.
  return req.ip || req.socket?.remoteAddress || "unknown";
}

/**
 * rateLimit({ windowMs, max, message, keyPrefix })
 * Fixed-window limiter: allows `max` requests per `windowMs` per client IP,
 * scoped by `keyPrefix` so different routes don't share a counter.
 */
function rateLimit({ windowMs, max, message = "Too many requests. Please try again later.", keyPrefix }) {
  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    const key = `${keyPrefix}:${clientKey(req)}`;
    let entry = buckets.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      buckets.set(key, entry);
    }

    entry.count += 1;

    if (entry.count > max) {
      const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.set("Retry-After", String(retryAfterSec));
      return res.status(429).json({ error: message });
    }

    next();
  };
}

module.exports = { rateLimit };
