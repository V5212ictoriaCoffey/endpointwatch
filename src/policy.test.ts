import { evaluatePolicy, evaluateAll } from "./policy";
import { parsePolicyRules, policySummary } from "./policy.config";
import { createPolicyStore, addRule, removeRule, check, getViolations, clearViolations } from "./policy.store";
import type { PolicyInput, PolicyRule } from "./policy";

const baseInput: PolicyInput = { url: "https://api.example.com/health", latency: 200, status: 200, tags: ["prod"] };

const blockRule: PolicyRule = { id: "r1", maxLatency: 100, action: "block" };
const warnRule: PolicyRule = { id: "r2", urlPattern: "example.com", maxLatency: 500, action: "warn" };

describe("evaluatePolicy", () => {
  it("returns allow when no rules match", () => {
    expect(evaluatePolicy([], baseInput).action).toBe("allow");
  });

  it("blocks when latency exceeds maxLatency", () => {
    const r = evaluatePolicy([blockRule], { ...baseInput, latency: 300 });
    expect(r.action).toBe("block");
    expect(r.ruleId).toBe("r1");
  });

  it("skips rule when latency is within threshold", () => {
    const r = evaluatePolicy([blockRule], { ...baseInput, latency: 50 });
    expect(r.action).toBe("allow");
  });

  it("matches urlPattern", () => {
    const r = evaluatePolicy([warnRule], { ...baseInput, latency: 600 });
    expect(r.action).toBe("warn");
  });

  it("does not match when urlPattern does not match url", () => {
    const r = evaluatePolicy([warnRule], { ...baseInput, url: "https://other.com/api", latency: 600 });
    expect(r.action).toBe("allow");
  });
});

describe("evaluateAll", () => {
  it("returns results for each input", () => {
    const results = evaluateAll([blockRule], [{ ...baseInput, latency: 300 }, { ...baseInput, latency: 50 }]);
    expect(results[0].action).toBe("block");
    expect(results[1].action).toBe("allow");
  });
});

describe("parsePolicyRules", () => {
  it("parses valid rules", () => {
    const rules = parsePolicyRules([{ id: "x", maxLatency: 200, action: "warn" }]);
    expect(rules).toHaveLength(1);
    expect(rules[0].action).toBe("warn");
  });

  it("defaults action to warn for unknown", () => {
    const rules = parsePolicyRules([{ action: "unknown" }]);
    expect(rules[0].action).toBe("warn");
  });

  it("returns empty for non-array", () => {
    expect(parsePolicyRules(null)).toEqual([]);
  });

  it("formats summary", () => {
    const s = policySummary([blockRule, warnRule]);
    expect(s).toContain("2 rules");
  });
});

describe("policy store", () => {
  it("records violations", () => {
    const store = createPolicyStore([blockRule]);
    check(store, { ...baseInput, latency: 300 });
    expect(getViolations(store)).toHaveLength(1);
  });

  it("clears violations", () => {
    const store = createPolicyStore([blockRule]);
    check(store, { ...baseInput, latency: 300 });
    clearViolations(store);
    expect(getViolations(store)).toHaveLength(0);
  });

  it("adds and removes rules", () => {
    const store = createPolicyStore([]);
    addRule(store, blockRule);
    expect(store.rules).toHaveLength(1);
    removeRule(store, "r1");
    expect(store.rules).toHaveLength(0);
  });

  it("does not record a violation when input passes all rules", () => {
    const store = createPolicyStore([blockRule]);
    check(store, { ...baseInput, latency: 50 });
    expect(getViolations(store)).toHaveLength(0);
  });
});
