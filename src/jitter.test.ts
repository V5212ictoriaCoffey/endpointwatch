import { describe, it, expect, beforeEach } from "vitest";
import {
  applyJitter,
  createJitterState,
  jitterSummary,
  type JitterOptions,
  type JitterState,
} from "./jitter";
import {
  parseJitterConfig,
  applyJitterDefaults,
  toJitterOptions,
  defaultJitterConfig,
} from "./jitter.config";

const baseOpts = (strategy: JitterOptions["strategy"]): JitterOptions => ({
  strategy,
  minMs: 100,
  maxMs: 2000,
});

describe("applyJitter", () => {
  let state: JitterState;
  beforeEach(() => {
    state = createJitterState();
  });

  it("none: returns baseMs clamped", () => {
    const result = applyJitter(500, baseOpts("none"), state);
    expect(result).toBe(500);
  });

  it("full: result within [minMs, maxMs]", () => {
    for (let i = 0; i < 20; i++) {
      const result = applyJitter(1000, baseOpts("full"), state);
      expect(result).toBeGreaterThanOrEqual(100);
      expect(result).toBeLessThanOrEqual(2000);
    }
  });

  it("equal: result within [minMs, maxMs]", () => {
    for (let i = 0; i < 20; i++) {
      const result = applyJitter(1000, baseOpts("equal"), state);
      expect(result).toBeGreaterThanOrEqual(100);
      expect(result).toBeLessThanOrEqual(2000);
    }
  });

  it("decorrelated: updates lastDelay in state", () => {
    applyJitter(500, baseOpts("decorrelated"), state);
    expect(state.lastDelay).toBeGreaterThan(0);
  });

  it("clamps to maxMs", () => {
    const opts: JitterOptions = { strategy: "none", minMs: 0, maxMs: 100 };
    expect(applyJitter(9999, opts, state)).toBe(100);
  });

  it("clamps to minMs", () => {
    const opts: JitterOptions = { strategy: "none", minMs: 500, maxMs: 2000 };
    expect(applyJitter(10, opts, state)).toBe(500);
  });
});

describe("jitterSummary", () => {
  it("includes strategy and bounds", () => {
    const s = jitterSummary({ strategy: "full", minMs: 0, maxMs: 3000 });
    expect(s).toContain("full");
    expect(s).toContain("3000");
  });
});

describe("parseJitterConfig", () => {
  it("parses valid config", () => {
    const result = parseJitterConfig({ strategy: "equal", minMs: 50, maxMs: 1000 });
    expect(result.strategy).toBe("equal");
    expect(result.minMs).toBe(50);
  });

  it("throws on invalid strategy", () => {
    expect(() => parseJitterConfig({ strategy: "bogus" })).toThrow();
  });

  it("throws when minMs > maxMs", () => {
    expect(() => parseJitterConfig({ minMs: 1000, maxMs: 100 })).toThrow();
  });
});

describe("applyJitterDefaults", () => {
  it("fills in defaults", () => {
    const result = applyJitterDefaults({});
    expect(result).toEqual(defaultJitterConfig);
  });
});

describe("toJitterOptions", () => {
  it("returns default when undefined", () => {
    expect(toJitterOptions(undefined)).toEqual(defaultJitterConfig);
  });

  it("merges partial config", () => {
    const result = toJitterOptions({ strategy: "decorrelated" });
    expect(result.strategy).toBe("decorrelated");
    expect(result.minMs).toBe(defaultJitterConfig.minMs);
  });
});
