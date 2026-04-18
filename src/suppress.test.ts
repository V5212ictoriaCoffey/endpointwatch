import {
  createSuppressStore,
  addSuppressRule,
  removeSuppressRule,
  isSuppressed,
  pruneExpired,
  suppressSummary,
} from "./suppress";
import { parseSuppressConfig, applySuppressDefaults, toSuppressRules } from "./suppress.config";

const NOW = 1_000_000;

describe("suppress store", () => {
  it("returns false when no rules", () => {
    const store = createSuppressStore();
    expect(isSuppressed(store, "https://api.example.com", "critical", NOW)).toBe(false);
  });

  it("suppresses matching url and level", () => {
    const store = createSuppressStore();
    addSuppressRule(store, "r1", { urlPattern: "example.com", alertLevel: "critical", durationMs: 10000 }, NOW);
    expect(isSuppressed(store, "https://api.example.com/health", "critical", NOW + 1)).toBe(true);
  });

  it("does not suppress non-matching level", () => {
    const store = createSuppressStore();
    addSuppressRule(store, "r1", { urlPattern: "example.com", alertLevel: "critical", durationMs: 10000 }, NOW);
    expect(isSuppressed(store, "https://api.example.com", "warning", NOW + 1)).toBe(false);
  });

  it("respects expiry", () => {
    const store = createSuppressStore();
    addSuppressRule(store, "r1", { durationMs: 1000 }, NOW);
    expect(isSuppressed(store, "any", "critical", NOW + 2000)).toBe(false);
  });

  it("removes rule explicitly", () => {
    const store = createSuppressStore();
    addSuppressRule(store, "r1", { durationMs: 10000 }, NOW);
    removeSuppressRule(store, "r1");
    expect(isSuppressed(store, "any", "critical", NOW + 1)).toBe(false);
  });

  it("prunes expired rules", () => {
    const store = createSuppressStore();
    addSuppressRule(store, "r1", { durationMs: 500 }, NOW);
    addSuppressRule(store, "r2", { durationMs: 10000 }, NOW);
    const pruned = pruneExpired(store, NOW + 1000);
    expect(pruned).toBe(1);
    expect(store.rules.size).toBe(1);
  });

  it("summary reflects active rules", () => {
    const store = createSuppressStore();
    addSuppressRule(store, "r1", { durationMs: 10000 }, NOW);
    expect(suppressSummary(store, NOW + 1)).toContain("1 active");
  });
});

describe("suppress config", () => {
  it("parses config with rules", () => {
    const cfg = parseSuppressConfig({ rules: [{ key: "k1", urlPattern: "foo", durationMs: 3000 }], defaultDurationMs: 6000 });
    expect(cfg.rules).toHaveLength(1);
    expect(cfg.defaultDurationMs).toBe(6000);
  });

  it("applies defaults", () => {
    const cfg = applySuppressDefaults({});
    expect(cfg.defaultDurationMs).toBe(300000);
    expect(cfg.rules).toEqual([]);
  });

  it("converts to suppress rules using default duration", () => {
    const cfg = applySuppressDefaults({ rules: [{ key: "k1", urlPattern: "api" }] });
    const rules = toSuppressRules(cfg);
    expect(rules[0].rule.durationMs).toBe(300000);
    expect(rules[0].key).toBe("k1");
  });
});
