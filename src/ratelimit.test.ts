import {
  createRateLimiter,
  parseRateLimitOptions,
  RateLimitOptions,
} from "./ratelimit";
import {
  resolveRateLimitConfig,
  applyRateLimitDefaults,
  rateLimitSummary,
  DEFAULT_RATE_LIMIT,
} from "./ratelimit.config";

describe("parseRateLimitOptions", () => {
  it("returns defaults for empty input", () => {
    expect(parseRateLimitOptions({})).toEqual({
      maxRequestsPerMinute: 60,
      burstAllowance: 0,
    });
  });

  it("parses valid options", () => {
    expect(
      parseRateLimitOptions({ maxRequestsPerMinute: 30, burstAllowance: 5 })
    ).toEqual({ maxRequestsPerMinute: 30, burstAllowance: 5 });
  });

  it("ignores non-positive maxRequestsPerMinute", () => {
    expect(parseRateLimitOptions({ maxRequestsPerMinute: -1 })).toEqual({
      maxRequestsPerMinute: 60,
      burstAllowance: 0,
    });
  });
});

describe("createRateLimiter", () => {
  it("tracks request count after acquire", async () => {
    const limiter = createRateLimiter({ maxRequestsPerMinute: 600 });
    await limiter.acquire();
    await limiter.acquire();
    expect(limiter.getStats().requestCount).toBe(2);
  });

  it("resets count and window on reset()", async () => {
    const limiter = createRateLimiter({ maxRequestsPerMinute: 600 });
    await limiter.acquire();
    limiter.reset();
    expect(limiter.getStats().requestCount).toBe(0);
  });
});

describe("resolveRateLimitConfig", () => {
  it("returns disabled config for undefined input", () => {
    const result = resolveRateLimitConfig(undefined);
    expect(result.enabled).toBe(false);
  });

  it("returns disabled when enabled=false", () => {
    const result = resolveRateLimitConfig({ enabled: false });
    expect(result.enabled).toBe(false);
  });

  it("parses enabled config with nested options", () => {
    const result = resolveRateLimitConfig({
      enabled: true,
      options: { maxRequestsPerMinute: 120, burstAllowance: 10 },
    });
    expect(result.enabled).toBe(true);
    expect(result.options.maxRequestsPerMinute).toBe(120);
    expect(result.options.burstAllowance).toBe(10);
  });
});

describe("applyRateLimitDefaults", () => {
  it("fills missing fields with defaults", () => {
    const result = applyRateLimitDefaults({});
    expect(result).toEqual({ enabled: false, options: DEFAULT_RATE_LIMIT });
  });
});

describe("rateLimitSummary", () => {
  it("returns disabled message when not enabled", () => {
    expect(
      rateLimitSummary({ enabled: false, options: DEFAULT_RATE_LIMIT })
    ).toBe("rate limiting disabled");
  });

  it("returns summary string when enabled", () => {
    const summary = rateLimitSummary({
      enabled: true,
      options: { maxRequestsPerMinute: 30, burstAllowance: 5 },
    });
    expect(summary).toBe("rate limit: 30 req/min, burst: +5");
  });
});
