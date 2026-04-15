import {
  createDedupStore,
  parseDedupOptions,
  isSuppressed,
  recordAlert,
  clearAlert,
  dedupKey,
} from "./dedup";

describe("parseDedupOptions", () => {
  it("uses default cooldown when no options provided", () => {
    const opts = parseDedupOptions(undefined);
    expect(opts.cooldownMs).toBe(5 * 60 * 1000);
  });

  it("uses provided cooldown", () => {
    const opts = parseDedupOptions({ cooldownMs: 1000 });
    expect(opts.cooldownMs).toBe(1000);
  });

  it("allows zero cooldown", () => {
    const opts = parseDedupOptions({ cooldownMs: 0 });
    expect(opts.cooldownMs).toBe(0);
  });

  it("falls back to default for negative cooldown", () => {
    const opts = parseDedupOptions({ cooldownMs: -1 });
    expect(opts.cooldownMs).toBe(5 * 60 * 1000);
  });
});

describe("isSuppressed", () => {
  const opts = { cooldownMs: 10_000 };
  const now = 1_000_000;

  it("returns false when no alert has been recorded", () => {
    const store = createDedupStore();
    expect(isSuppressed(store, "url::warn", opts, now)).toBe(false);
  });

  it("returns true when alert was recorded within cooldown", () => {
    const store = createDedupStore();
    recordAlert(store, "url::warn", now - 5_000);
    expect(isSuppressed(store, "url::warn", opts, now)).toBe(true);
  });

  it("returns false when alert was recorded outside cooldown", () => {
    const store = createDedupStore();
    recordAlert(store, "url::warn", now - 15_000);
    expect(isSuppressed(store, "url::warn", opts, now)).toBe(false);
  });

  it("returns false exactly at cooldown boundary", () => {
    const store = createDedupStore();
    recordAlert(store, "url::warn", now - 10_000);
    expect(isSuppressed(store, "url::warn", opts, now)).toBe(false);
  });
});

describe("recordAlert and clearAlert", () => {
  it("records and then clears an alert", () => {
    const store = createDedupStore();
    const opts = { cooldownMs: 60_000 };
    const now = Date.now();
    recordAlert(store, "url::critical", now);
    expect(isSuppressed(store, "url::critical", opts, now + 1_000)).toBe(true);
    clearAlert(store, "url::critical");
    expect(isSuppressed(store, "url::critical", opts, now + 1_000)).toBe(false);
  });
});

describe("dedupKey", () => {
  it("combines url and alert level with separator", () => {
    expect(dedupKey("https://api.example.com/health", "critical")).toBe(
      "https://api.example.com/health::critical"
    );
  });

  it("produces distinct keys for different levels", () => {
    const k1 = dedupKey("https://example.com", "warn");
    const k2 = dedupKey("https://example.com", "critical");
    expect(k1).not.toBe(k2);
  });
});
