import { describe, it, expect, vi, beforeEach } from "vitest";
import { probe, probeWithRetry } from "./probe";
import { applyProbeDefaults, parseProbeConfig, probeSummary } from "./probe.config";

const mockFetch = (status: number, ok: boolean, fail = false) =>
  vi.fn().mockImplementation(() =>
    fail
      ? Promise.reject(new Error("network error"))
      : Promise.resolve({ status, ok })
  );

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("probe", () => {
  it("returns ok result on success", async () => {
    vi.stubGlobal("fetch", mockFetch(200, true));
    const result = await probe({ url: "https://example.com" });
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.url).toBe("https://example.com");
  });

  it("returns error result on fetch failure", async () => {
    vi.stubGlobal("fetch", mockFetch(0, false, true));
    const result = await probe({ url: "https://example.com" });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(0);
    expect(result.error).toMatch(/network error/);
  });

  it("captures non-ok status", async () => {
    vi.stubGlobal("fetch", mockFetch(503, false));
    const result = await probe({ url: "https://example.com" });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(503);
  });
});

describe("probeWithRetry", () => {
  it("returns on first success", async () => {
    vi.stubGlobal("fetch", mockFetch(200, true));
    const result = await probeWithRetry({ url: "https://example.com" }, 2, 0);
    expect(result.ok).toBe(true);
  });

  it("retries on failure and returns last result", async () => {
    vi.stubGlobal("fetch", mockFetch(500, false));
    const result = await probeWithRetry({ url: "https://example.com" }, 2, 0);
    expect(result.ok).toBe(false);
  });
});

describe("parseProbeConfig", () => {
  it("parses valid fields", () => {
    const cfg = parseProbeConfig({ method: "post", timeoutMs: 5000, retries: 3 });
    expect(cfg.method).toBe("POST");
    expect(cfg.timeoutMs).toBe(5000);
    expect(cfg.retries).toBe(3);
  });

  it("ignores invalid fields", () => {
    const cfg = parseProbeConfig({ timeoutMs: -1 });
    expect(cfg.timeoutMs).toBeUndefined();
  });
});

describe("applyProbeDefaults", () => {
  it("fills defaults", () => {
    const cfg = applyProbeDefaults({});
    expect(cfg.method).toBe("GET");
    expect(cfg.retries).toBe(0);
  });
});

describe("probeSummary", () => {
  it("includes method and timeout", () => {
    const s = probeSummary(applyProbeDefaults({ retries: 1, retryDelayMs: 200 }));
    expect(s).toContain("GET");
    expect(s).toContain("retries=1");
  });
});
