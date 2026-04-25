import { describe, it, expect } from "vitest";
import { createLimiter, limiterSummary } from "./limiter";
import {
  parseLimiterConfig,
  applyLimiterDefaults,
  toLimiterOptions,
  limiterConfigSummary,
} from "./limiter.config";

describe("createLimiter", () => {
  it("throws if maxConcurrent < 1", () => {
    expect(() => createLimiter({ maxConcurrent: 0 })).toThrow();
  });

  it("allows up to maxConcurrent tasks immediately", async () => {
    const limiter = createLimiter({ maxConcurrent: 2 });
    const rel1 = await limiter.acquire();
    const rel2 = await limiter.acquire();
    expect(limiter.state().active).toBe(2);
    expect(limiter.state().queued).toBe(0);
    rel1();
    rel2();
  });

  it("queues tasks beyond maxConcurrent", async () => {
    const limiter = createLimiter({ maxConcurrent: 1 });
    const rel1 = await limiter.acquire();
    expect(limiter.state().active).toBe(1);

    let queued = false;
    const p = limiter.acquire().then((rel) => { queued = true; rel(); });
    expect(limiter.state().queued).toBe(1);

    rel1();
    await p;
    expect(queued).toBe(true);
    expect(limiter.state().active).toBe(0);
  });

  it("drain resolves when idle", async () => {
    const limiter = createLimiter({ maxConcurrent: 2 });
    await limiter.drain(); // already idle
    const rel = await limiter.acquire();
    const drainPromise = limiter.drain();
    rel();
    await expect(drainPromise).resolves.toBeUndefined();
  });

  it("limiterSummary returns correct string", async () => {
    const limiter = createLimiter({ maxConcurrent: 3 });
    const rel = await limiter.acquire();
    const summary = limiterSummary(limiter);
    expect(summary).toContain("concurrency=3");
    expect(summary).toContain("active=1");
    rel();
  });
});

describe("parseLimiterConfig", () => {
  it("parses valid maxConcurrent", () => {
    expect(parseLimiterConfig({ maxConcurrent: 5 })).toEqual({ maxConcurrent: 5 });
  });

  it("throws on invalid maxConcurrent", () => {
    expect(() => parseLimiterConfig({ maxConcurrent: -1 })).toThrow();
    expect(() => parseLimiterConfig({ maxConcurrent: 0 })).toThrow();
    expect(() => parseLimiterConfig({ maxConcurrent: "abc" })).toThrow();
  });

  it("returns empty config when no fields provided", () => {
    expect(parseLimiterConfig({})).toEqual({});
  });
});

describe("applyLimiterDefaults", () => {
  it("fills in default maxConcurrent", () => {
    expect(applyLimiterDefaults({}).maxConcurrent).toBe(10);
  });

  it("preserves provided values", () => {
    expect(applyLimiterDefaults({ maxConcurrent: 4 }).maxConcurrent).toBe(4);
  });
});

describe("toLimiterOptions", () => {
  it("converts config to options", () => {
    expect(toLimiterOptions({ maxConcurrent: 7 })).toEqual({ maxConcurrent: 7 });
  });
});

describe("limiterConfigSummary", () => {
  it("formats summary string", () => {
    expect(limiterConfigSummary({ maxConcurrent: 6 })).toBe("maxConcurrent=6");
    expect(limiterConfigSummary({})).toBe("maxConcurrent=10");
  });
});
