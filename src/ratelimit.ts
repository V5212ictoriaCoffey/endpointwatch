/**
 * Rate limiting utilities for controlling request frequency
 * to monitored endpoints.
 */

export interface RateLimitOptions {
  maxRequestsPerMinute: number;
  burstAllowance?: number;
}

export interface RateLimiter {
  acquire(): Promise<void>;
  reset(): void;
  getStats(): { requestCount: number; windowStart: number };
}

export function createRateLimiter(options: RateLimitOptions): RateLimiter {
  const { maxRequestsPerMinute, burstAllowance = 0 } = options;
  const intervalMs = 60_000 / maxRequestsPerMinute;
  const maxBurst = maxRequestsPerMinute + burstAllowance;

  let requestCount = 0;
  let windowStart = Date.now();
  let lastRequestTime = 0;

  return {
    async acquire(): Promise<void> {
      const now = Date.now();

      if (now - windowStart >= 60_000) {
        requestCount = 0;
        windowStart = now;
      }

      if (requestCount >= maxBurst) {
        const waitUntil = windowStart + 60_000;
        const delay = waitUntil - now;
        await new Promise((resolve) => setTimeout(resolve, delay));
        requestCount = 0;
        windowStart = Date.now();
      }

      const elapsed = now - lastRequestTime;
      if (elapsed < intervalMs) {
        await new Promise((resolve) =>
          setTimeout(resolve, intervalMs - elapsed)
        );
      }

      lastRequestTime = Date.now();
      requestCount++;
    },

    reset(): void {
      requestCount = 0;
      windowStart = Date.now();
      lastRequestTime = 0;
    },

    getStats() {
      return { requestCount, windowStart };
    },
  };
}

export function parseRateLimitOptions(
  raw: Record<string, unknown>
): RateLimitOptions {
  const maxRequestsPerMinute =
    typeof raw.maxRequestsPerMinute === "number" && raw.maxRequestsPerMinute > 0
      ? raw.maxRequestsPerMinute
      : 60;

  const burstAllowance =
    typeof raw.burstAllowance === "number" && raw.burstAllowance >= 0
      ? raw.burstAllowance
      : 0;

  return { maxRequestsPerMinute, burstAllowance };
}
