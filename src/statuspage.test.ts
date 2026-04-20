import { describe, it, expect } from "vitest";
import {
  resolveLevel,
  overallLevel,
  buildStatusPage,
  formatStatusPage,
  EndpointStatus,
} from "./statuspage";
import { createStore, addEntry } from "./history";
import type { HistoryEntry } from "./history";

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    url: "https://example.com",
    status: 200,
    latencyMs: 120,
    timestamp: Date.now(),
    ok: true,
    ...overrides,
  };
}

describe("resolveLevel", () => {
  const opts = { degradedLatencyMs: 1000, outageErrorRatePct: 50, degradedErrorRatePct: 10 };

  it("returns operational for healthy metrics", () => {
    expect(resolveLevel(200, 0, opts)).toBe("operational");
  });

  it("returns degraded for high latency", () => {
    expect(resolveLevel(1500, 0, opts)).toBe("degraded");
  });

  it("returns degraded for moderate error rate", () => {
    expect(resolveLevel(100, 20, opts)).toBe("degraded");
  });

  it("returns outage for high error rate", () => {
    expect(resolveLevel(100, 60, opts)).toBe("outage");
  });
});

describe("overallLevel", () => {
  const makeStatus = (level: EndpointStatus["level"]): EndpointStatus => ({
    url: "https://x.com",
    level,
    avgLatencyMs: 100,
    errorRatePct: 0,
    lastChecked: Date.now(),
  });

  it("returns operational when all are operational", () => {
    expect(overallLevel([makeStatus("operational"), makeStatus("operational")])).toBe("operational");
  });

  it("returns outage when any is outage", () => {
    expect(overallLevel([makeStatus("operational"), makeStatus("outage")])).toBe("outage");
  });

  it("returns degraded when any is degraded and none is outage", () => {
    expect(overallLevel([makeStatus("operational"), makeStatus("degraded")])).toBe("degraded");
  });
});

describe("buildStatusPage", () => {
  it("builds status for multiple endpoints", () => {
    const stores = new Map();
    const s1 = createStore("https://a.com");
    addEntry(s1, makeEntry({ url: "https://a.com", latencyMs: 80, ok: true }));
    const s2 = createStore("https://b.com");
    addEntry(s2, makeEntry({ url: "https://b.com", latencyMs: 2000, ok: false }));
    stores.set("https://a.com", s1);
    stores.set("https://b.com", s2);

    const page = buildStatusPage(stores);
    expect(page.endpoints).toHaveLength(2);
    const a = page.endpoints.find((e) => e.url === "https://a.com")!;
    expect(a.level).toBe("operational");
    expect(page.generatedAt).toBeGreaterThan(0);
  });

  it("marks endpoint as unknown when no entries exist", () => {
    const stores = new Map();
    stores.set("https://empty.com", createStore("https://empty.com"));
    const page = buildStatusPage(stores);
    expect(page.endpoints[0].level).toBe("unknown");
  });
});

describe("formatStatusPage", () => {
  it("includes overall level and endpoint details", () => {
    const stores = new Map();
    const s = createStore("https://api.com");
    addEntry(s, makeEntry({ url: "https://api.com", latencyMs: 150, ok: true }));
    stores.set("https://api.com", s);
    const page = buildStatusPage(stores);
    const output = formatStatusPage(page);
    expect(output).toContain("Overall:");
    expect(output).toContain("https://api.com");
    expect(output).toContain("avg latency:");
  });
});
