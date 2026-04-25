import {
  createNotifyStore,
  addNotifyRule,
  removeNotifyRule,
  matchingRules,
  recordNotifyEvent,
  getNotifyHistory,
  shouldNotifyRule,
  notifySummary,
} from "./notify";
import { parseNotifyConfig, toNotifyRules, notifyConfigSummary } from "./notify.config";

describe("notify store", () => {
  test("createNotifyStore returns empty store", () => {
    const store = createNotifyStore();
    expect(store.rules).toHaveLength(0);
    expect(store.sent).toHaveLength(0);
  });

  test("addNotifyRule appends rule", () => {
    const store = createNotifyStore();
    addNotifyRule(store, { channel: "slack", minLevel: "warn", enabled: true });
    expect(store.rules).toHaveLength(1);
  });

  test("removeNotifyRule removes matching rule", () => {
    const store = createNotifyStore();
    addNotifyRule(store, { channel: "slack", minLevel: "warn", target: "#alerts", enabled: true });
    removeNotifyRule(store, "slack", "#alerts");
    expect(store.rules).toHaveLength(0);
  });

  test("shouldNotifyRule respects level ordering", () => {
    const rule = { channel: "slack" as const, minLevel: "warn" as const, enabled: true };
    expect(shouldNotifyRule(rule, "none")).toBe(false);
    expect(shouldNotifyRule(rule, "warn")).toBe(true);
    expect(shouldNotifyRule(rule, "critical")).toBe(true);
  });

  test("shouldNotifyRule returns false when disabled", () => {
    const rule = { channel: "console" as const, minLevel: "none" as const, enabled: false };
    expect(shouldNotifyRule(rule, "critical")).toBe(false);
  });

  test("matchingRules filters by level", () => {
    const store = createNotifyStore();
    addNotifyRule(store, { channel: "slack", minLevel: "critical", enabled: true });
    addNotifyRule(store, { channel: "console", minLevel: "warn", enabled: true });
    const matched = matchingRules(store, "warn");
    expect(matched).toHaveLength(1);
    expect(matched[0].channel).toBe("console");
  });

  test("recordNotifyEvent and getNotifyHistory", () => {
    const store = createNotifyStore();
    recordNotifyEvent(store, { url: "https://a.com", level: "warn", message: "slow", timestamp: 1000 });
    recordNotifyEvent(store, { url: "https://b.com", level: "critical", message: "down", timestamp: 2000 });
    expect(getNotifyHistory(store)).toHaveLength(2);
    expect(getNotifyHistory(store, "https://a.com")).toHaveLength(1);
  });

  test("notifySummary returns correct counts", () => {
    const store = createNotifyStore();
    addNotifyRule(store, { channel: "slack", minLevel: "warn", enabled: true });
    recordNotifyEvent(store, { url: "https://a.com", level: "critical", message: "down", timestamp: 1000 });
    const summary = notifySummary(store);
    expect(summary).toContain("1 sent");
    expect(summary).toContain("1 critical");
  });
});

describe("notify config", () => {
  test("parseNotifyConfig handles empty input", () => {
    expect(parseNotifyConfig(null)).toEqual({});
    expect(parseNotifyConfig({})).toEqual({});
  });

  test("toNotifyRules filters invalid channels", () => {
    const config = parseNotifyConfig({
      rules: [
        { channel: "slack", minLevel: "warn", enabled: true },
        { channel: "unknown", minLevel: "warn", enabled: true },
      ],
    });
    const rules = toNotifyRules(config);
    expect(rules).toHaveLength(1);
    expect(rules[0].channel).toBe("slack");
  });

  test("toNotifyRules applies default minLevel", () => {
    const config = parseNotifyConfig({ rules: [{ channel: "console" }] });
    const rules = toNotifyRules(config);
    expect(rules[0].minLevel).toBe("warn");
  });

  test("notifyConfigSummary reports rule count", () => {
    const config = { rules: [{ channel: "slack", enabled: true }, { channel: "email", enabled: false }] };
    const summary = notifyConfigSummary(config);
    expect(summary).toContain("2 rules");
    expect(summary).toContain("1 enabled");
  });
});
