import { describe, it, expect, beforeEach } from "vitest";
import {
  createProfilingStore,
  recordProfile,
  getProfile,
  averageLatency,
  errorRate,
  getAllProfiles,
  clearProfile,
  clearAllProfiles,
  ProfilingStore,
} from "./profiling";
import {
  parseProfilingConfig,
  applyProfilingDefaults,
  profilingConfigSummary,
} from "./profiling.config";

let store: ProfilingStore;

beforeEach(() => {
  store = createProfilingStore();
});

describe("recordProfile", () => {
  it("creates a new entry on first call", () => {
    const entry = recordProfile(store, "https://api.example.com", 120, false);
    expect(entry.callCount).toBe(1);
    expect(entry.totalLatencyMs).toBe(120);
    expect(entry.minLatencyMs).toBe(120);
    expect(entry.maxLatencyMs).toBe(120);
    expect(entry.errorCount).toBe(0);
  });

  it("accumulates subsequent calls", () => {
    recordProfile(store, "https://api.example.com", 100, false);
    recordProfile(store, "https://api.example.com", 200, true);
    const entry = getProfile(store, "https://api.example.com")!;
    expect(entry.callCount).toBe(2);
    expect(entry.totalLatencyMs).toBe(300);
    expect(entry.minLatencyMs).toBe(100);
    expect(entry.maxLatencyMs).toBe(200);
    expect(entry.errorCount).toBe(1);
  });

  it("tracks min and max correctly across many calls", () => {
    [50, 300, 150, 10, 400].forEach((ms) =>
      recordProfile(store, "https://api.example.com", ms, false)
    );
    const entry = getProfile(store, "https://api.example.com")!;
    expect(entry.minLatencyMs).toBe(10);
    expect(entry.maxLatencyMs).toBe(400);
  });
});

describe("averageLatency", () => {
  it("returns 0 for zero call count", () => {
    const entry = recordProfile(store, "https://x.com", 0, false);
    entry.callCount = 0;
    entry.totalLatencyMs = 0;
    expect(averageLatency(entry)).toBe(0);
  });

  it("computes correct average", () => {
    recordProfile(store, "https://x.com", 100, false);
    recordProfile(store, "https://x.com", 200, false);
    const entry = getProfile(store, "https://x.com")!;
    expect(averageLatency(entry)).toBe(150);
  });
});

describe("errorRate", () => {
  it("returns ratio of errors to calls", () => {
    recordProfile(store, "https://y.com", 100, true);
    recordProfile(store, "https://y.com", 100, false);
    recordProfile(store, "https://y.com", 100, true);
    const entry = getProfile(store, "https://y.com")!;
    expect(errorRate(entry)).toBeCloseTo(2 / 3);
  });
});

describe("getAllProfiles", () => {
  it("returns all tracked urls", () => {
    recordProfile(store, "https://a.com", 100, false);
    recordProfile(store, "https://b.com", 200, false);
    expect(getAllProfiles(store)).toHaveLength(2);
  });
});

describe("clearProfile / clearAllProfiles", () => {
  it("removes a single entry", () => {
    recordProfile(store, "https://a.com", 100, false);
    clearProfile(store, "https://a.com");
    expect(getProfile(store, "https://a.com")).toBeUndefined();
  });

  it("clears all entries", () => {
    recordProfile(store, "https://a.com", 100, false);
    recordProfile(store, "https://b.com", 200, false);
    clearAllProfiles(store);
    expect(getAllProfiles(store)).toHaveLength(0);
  });
});

describe("profilingConfig", () => {
  it("parses valid config", () => {
    const cfg = parseProfilingConfig({ enabled: false, minSamples: 10, slowThresholdMs: 500 });
    expect(cfg.enabled).toBe(false);
    expect(cfg.minSamples).toBe(10);
    expect(cfg.slowThresholdMs).toBe(500);
  });

  it("applies defaults for missing fields", () => {
    const cfg = applyProfilingDefaults({});
    expect(cfg.enabled).toBe(true);
    expect(cfg.minSamples).toBe(5);
    expect(cfg.slowThresholdMs).toBe(1000);
  });

  it("formats summary when disabled", () => {
    const cfg = applyProfilingDefaults({ enabled: false });
    expect(profilingConfigSummary(cfg)).toBe("profiling: disabled");
  });

  it("formats summary when enabled", () => {
    const cfg = applyProfilingDefaults({});
    expect(profilingConfigSummary(cfg)).toContain("profiling: enabled");
  });
});
