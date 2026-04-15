import { withRetry, RetryOptions } from "./retry";
import { parseRetryConfig, resolveRetryOptions } from "./retry.config";

describe("withRetry", () => {
  it("returns value immediately on first success", async () => {
    const fn = jest.fn().mockResolvedValue("ok");
    const result = await withRetry(fn, { maxAttempts: 3, delayMs: 0 });
    expect(result.succeeded).toBe(true);
    expect(result.value).toBe("ok");
    expect(result.attempts).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and succeeds eventually", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("recovered");
    const result = await withRetry(fn, { maxAttempts: 3, delayMs: 0 });
    expect(result.succeeded).toBe(true);
    expect(result.value).toBe("recovered");
    expect(result.attempts).toBe(2);
  });

  it("returns failure after exhausting all attempts", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("always fails"));
    const result = await withRetry(fn, { maxAttempts: 3, delayMs: 0 });
    expect(result.succeeded).toBe(false);
    expect(result.value).toBeNull();
    expect(result.attempts).toBe(3);
    expect(result.lastError?.message).toBe("always fails");
  });

  it("uses default options when none provided", async () => {
    const fn = jest.fn().mockResolvedValue(42);
    const result = await withRetry(fn);
    expect(result.succeeded).toBe(true);
    expect(result.value).toBe(42);
  });
});

describe("parseRetryConfig", () => {
  it("returns disabled config for undefined input", () => {
    expect(parseRetryConfig(undefined)).toEqual({ enabled: false });
  });

  it("parses valid config", () => {
    const cfg = parseRetryConfig({
      enabled: true,
      maxAttempts: 5,
      delayMs: 200,
      backoffFactor: 1.5,
    });
    expect(cfg.enabled).toBe(true);
    expect(cfg.maxAttempts).toBe(5);
    expect(cfg.delayMs).toBe(200);
    expect(cfg.backoffFactor).toBe(1.5);
  });

  it("ignores invalid numeric values", () => {
    const cfg = parseRetryConfig({ enabled: true, maxAttempts: -1, delayMs: "bad" });
    expect(cfg.maxAttempts).toBeUndefined();
    expect(cfg.delayMs).toBeUndefined();
  });
});

describe("resolveRetryOptions", () => {
  it("falls back to defaults for missing fields", () => {
    const opts = resolveRetryOptions({ enabled: true });
    expect(opts.maxAttempts).toBe(3);
    expect(opts.delayMs).toBe(500);
    expect(opts.backoffFactor).toBe(2);
  });

  it("uses provided values when present", () => {
    const opts = resolveRetryOptions({ enabled: true, maxAttempts: 5, delayMs: 100, backoffFactor: 1 });
    expect(opts.maxAttempts).toBe(5);
    expect(opts.delayMs).toBe(100);
    expect(opts.backoffFactor).toBe(1);
  });
});
