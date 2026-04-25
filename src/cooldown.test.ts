import {
  createCooldownStore,
  enterCooldown,
  isInCooldown,
  clearCooldown,
  clearAllCooldowns,
  cooldownRemaining,
  cooldownSummary,
} from "./cooldown";
import {
  parseCooldownConfig,
  applyCooldownDefaults,
  toCooldownOptions,
  cooldownConfigSummary,
} from "./cooldown.config";

const DURATION = 5000;

function makeStore() {
  return createCooldownStore({ durationMs: DURATION });
}

describe("cooldown store", () => {
  it("starts with no entries in cooldown", () => {
    const store = makeStore();
    expect(isInCooldown(store, "https://example.com")).toBe(false);
  });

  it("enters and detects cooldown", () => {
    const store = makeStore();
    const now = Date.now();
    enterCooldown(store, "https://example.com", now);
    expect(isInCooldown(store, "https://example.com", now + 1000)).toBe(true);
  });

  it("expires cooldown after duration", () => {
    const store = makeStore();
    const now = Date.now();
    enterCooldown(store, "https://example.com", now);
    expect(isInCooldown(store, "https://example.com", now + DURATION + 1)).toBe(false);
  });

  it("clears a single cooldown", () => {
    const store = makeStore();
    const now = Date.now();
    enterCooldown(store, "https://example.com", now);
    clearCooldown(store, "https://example.com");
    expect(isInCooldown(store, "https://example.com", now + 100)).toBe(false);
  });

  it("clears all cooldowns", () => {
    const store = makeStore();
    const now = Date.now();
    enterCooldown(store, "https://a.com", now);
    enterCooldown(store, "https://b.com", now);
    clearAllCooldowns(store);
    expect(isInCooldown(store, "https://a.com", now + 100)).toBe(false);
    expect(isInCooldown(store, "https://b.com", now + 100)).toBe(false);
  });

  it("returns remaining cooldown time", () => {
    const store = makeStore();
    const now = Date.now();
    enterCooldown(store, "https://example.com", now);
    const remaining = cooldownRemaining(store, "https://example.com", now + 2000);
    expect(remaining).toBeCloseTo(3000, -2);
  });

  it("returns 0 remaining when not in cooldown", () => {
    const store = makeStore();
    expect(cooldownRemaining(store, "https://example.com")).toBe(0);
  });

  it("formats summary string", () => {
    const store = makeStore();
    const now = Date.now();
    enterCooldown(store, "https://example.com", now);
    const summary = cooldownSummary(store);
    expect(summary).toContain("cooldown:");
    expect(summary).toContain("durationMs=5000");
  });
});

describe("cooldown config", () => {
  it("parses enabled and durationMs", () => {
    const cfg = parseCooldownConfig({ cooldownEnabled: false, cooldownDurationMs: 30000 });
    expect(cfg.enabled).toBe(false);
    expect(cfg.durationMs).toBe(30000);
  });

  it("prefers durationSec over durationMs", () => {
    const resolved = applyCooldownDefaults({ durationMs: 5000, durationSec: 10 });
    expect(resolved.durationMs).toBe(10000);
  });

  it("applies defaults when empty", () => {
    const resolved = applyCooldownDefaults({});
    expect(resolved.enabled).toBe(true);
    expect(resolved.durationMs).toBe(60000);
  });

  it("converts to CooldownOptions", () => {
    const opts = toCooldownOptions({ durationMs: 15000 });
    expect(opts.durationMs).toBe(15000);
  });

  it("formats config summary", () => {
    const summary = cooldownConfigSummary({ enabled: true, durationMs: 20000 });
    expect(summary).toContain("enabled=true");
    expect(summary).toContain("durationMs=20000");
  });
});
