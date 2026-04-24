import {
  createSignalStore,
  onShutdown,
  offShutdown,
  triggerShutdown,
  signalSummary,
} from "./signal";
import {
  parseSignalConfig,
  applySignalDefaults,
  signalConfigSummary,
} from "./signal.config";

describe("signal store", () => {
  it("starts idle", () => {
    const store = createSignalStore();
    expect(store.triggered).toBe(false);
    expect(store.signal).toBeNull();
    expect(store.handlers).toHaveLength(0);
  });

  it("registers and calls handlers on trigger", async () => {
    const store = createSignalStore();
    const calls: string[] = [];
    onShutdown(store, () => { calls.push("a"); });
    onShutdown(store, async () => { calls.push("b"); });
    await triggerShutdown(store, "SIGINT");
    expect(calls).toEqual(["a", "b"]);
    expect(store.triggered).toBe(true);
    expect(store.signal).toBe("SIGINT");
  });

  it("does not re-trigger if already triggered", async () => {
    const store = createSignalStore();
    const calls: string[] = [];
    onShutdown(store, () => { calls.push("x"); });
    await triggerShutdown(store, "SIGTERM");
    await triggerShutdown(store, "SIGINT");
    expect(calls).toHaveLength(1);
    expect(store.signal).toBe("SIGTERM");
  });

  it("removes handlers with offShutdown", async () => {
    const store = createSignalStore();
    const calls: string[] = [];
    const handler = () => { calls.push("removed"); };
    onShutdown(store, handler);
    offShutdown(store, handler);
    await triggerShutdown(store, "SIGINT");
    expect(calls).toHaveLength(0);
  });

  it("continues after a handler throws", async () => {
    const store = createSignalStore();
    const calls: string[] = [];
    onShutdown(store, () => { throw new Error("boom"); });
    onShutdown(store, () => { calls.push("after"); });
    await expect(triggerShutdown(store, "SIGTERM")).resolves.toBeUndefined();
    expect(calls).toContain("after");
  });

  it("signalSummary reflects state", async () => {
    const store = createSignalStore();
    expect(signalSummary(store)).toBe("signal: idle");
    await triggerShutdown(store, "SIGINT");
    expect(signalSummary(store)).toContain("SIGINT");
  });
});

describe("signal config", () => {
  it("parses valid config", () => {
    const cfg = parseSignalConfig({ signals: ["SIGINT"], timeoutMs: 3000, exitCode: 1 });
    expect(cfg.signals).toEqual(["SIGINT"]);
    expect(cfg.timeoutMs).toBe(3000);
    expect(cfg.exitCode).toBe(1);
  });

  it("applies defaults for missing fields", () => {
    const cfg = parseSignalConfig({});
    expect(cfg.signals).toEqual(["SIGINT", "SIGTERM"]);
    expect(cfg.timeoutMs).toBe(5000);
    expect(cfg.exitCode).toBe(0);
  });

  it("applySignalDefaults fills blanks", () => {
    const cfg = applySignalDefaults({ exitCode: 2 });
    expect(cfg.exitCode).toBe(2);
    expect(cfg.timeoutMs).toBe(5000);
  });

  it("signalConfigSummary formats correctly", () => {
    const cfg = applySignalDefaults({});
    const s = signalConfigSummary(cfg);
    expect(s).toContain("SIGINT");
    expect(s).toContain("5000ms");
  });
});
