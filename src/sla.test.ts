import { describe, it, expect, beforeEach } from "vitest";
import { checkSla, checkAllSlas, formatSlaResult } from "./sla";
import { parseSlaConfig, applySlaDefaults, slaSummary } from "./sla.config";
import {
  createSlaStore,
  recordSlaResult,
  getBreachedSlas,
  slaStoreSummary,
} from "./sla.store";

const target = { url: "https://api.example.com", uptimePercent: 99, maxLatencyMs: 500 };

describe("checkSla", () => {
  it("returns met when uptime and latency within targets", () => {
    const r = checkSla(target, 100, 100, 200);
    expect(r.met).toBe(true);
    expect(r.uptimeMet).toBe(true);
    expect(r.latencyMet).toBe(true);
  });

  it("fails when uptime below target", () => {
    const r = checkSla(target, 100, 90, 200);
    expect(r.uptimeMet).toBe(false);
    expect(r.met).toBe(false);
  });

  it("fails when latency exceeds target", () => {
    const r = checkSla(target, 100, 100, 600);
    expect(r.latencyMet).toBe(false);
    expect(r.met).toBe(false);
  });

  it("handles zero total checks as 100% uptime", () => {
    const r = checkSla(target, 0, 0, 0);
    expect(r.actualUptimePercent).toBe(100);
  });
});

describe("checkAllSlas", () => {
  it("maps targets to results", () => {
    const results = checkAllSlas([target], {
      "https://api.example.com": { total: 10, success: 10, avgLatency: 100 },
    });
    expect(results).toHaveLength(1);
    expect(results[0].met).toBe(true);
  });

  it("uses zero stats for missing urls", () => {
    const results = checkAllSlas([target], {});
    expect(results[0].actualUptimePercent).toBe(100);
  });
});

describe("formatSlaResult", () => {
  it("includes MET for passing result", () => {
    const r = checkSla(target, 100, 100, 200);
    expect(formatSlaResult(r)).toContain("MET");
  });

  it("includes BREACHED for failing result", () => {
    const r = checkSla(target, 100, 80, 200);
    expect(formatSlaResult(r)).toContain("BREACHED");
  });
});

describe("parseSlaConfig", () => {
  it("parses targets from raw config", () => {
    const cfg = parseSlaConfig({
      slaTargets: [{ url: "https://x.com", uptimePercent: 95, maxLatencyMs: 300 }],
    });
    expect(cfg.targets).toHaveLength(1);
    expect(cfg.targets[0].uptimePercent).toBe(95);
  });

  it("applies defaults for missing fields", () => {
    const cfg = parseSlaConfig({ slaTargets: [{ url: "https://x.com" }] });
    expect(cfg.targets[0].uptimePercent).toBe(99.9);
  });
});

describe("SlaStore", () => {
  let store = createSlaStore();
  beforeEach(() => { store = createSlaStore(); });

  it("records and retrieves results", () => {
    const r = checkSla(target, 100, 99, 200);
    recordSlaResult(store, r);
    expect(getBreachedSlas(store)).toHaveLength(0);
  });

  it("reports breached slas", () => {
    const r = checkSla(target, 100, 50, 200);
    recordSlaResult(store, r);
    expect(getBreachedSlas(store)).toHaveLength(1);
    expect(slaStoreSummary(store)).toContain("1 breached");
  });
});
