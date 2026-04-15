import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createTimeoutHandle,
  parseTimeoutOptions,
  timeoutSummary,
} from "./timeout";

describe("createTimeoutHandle", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a signal that is not yet aborted", () => {
    const handle = createTimeoutHandle(5000);
    expect(handle.signal.aborted).toBe(false);
    handle.clear();
  });

  it("aborts the signal after the timeout elapses", async () => {
    vi.useFakeTimers();
    const handle = createTimeoutHandle(200);
    expect(handle.signal.aborted).toBe(false);
    vi.advanceTimersByTime(200);
    expect(handle.signal.aborted).toBe(true);
  });

  it("does not abort when clear() is called before timeout", () => {
    vi.useFakeTimers();
    const handle = createTimeoutHandle(200);
    handle.clear();
    vi.advanceTimersByTime(500);
    expect(handle.signal.aborted).toBe(false);
  });
});

describe("parseTimeoutOptions", () => {
  it("returns default timeout when no config provided", () => {
    const opts = parseTimeoutOptions({});
    expect(opts.timeoutMs).toBe(5000);
  });

  it("parses timeoutMs from config", () => {
    const opts = parseTimeoutOptions({ timeoutMs: 3000 });
    expect(opts.timeoutMs).toBe(3000);
  });

  it("parses timeout_ms (snake_case) from config", () => {
    const opts = parseTimeoutOptions({ timeout_ms: 2500 });
    expect(opts.timeoutMs).toBe(2500);
  });

  it("throws when timeoutMs is below minimum", () => {
    expect(() => parseTimeoutOptions({ timeoutMs: 50 })).toThrow(RangeError);
  });

  it("throws when timeoutMs exceeds maximum", () => {
    expect(() => parseTimeoutOptions({ timeoutMs: 120_000 })).toThrow(RangeError);
  });

  it("throws when timeoutMs is not a number", () => {
    expect(() => parseTimeoutOptions({ timeoutMs: "fast" })).toThrow(RangeError);
  });
});

describe("timeoutSummary", () => {
  it("formats the timeout as a readable string", () => {
    expect(timeoutSummary({ timeoutMs: 4000 })).toBe("timeout=4000ms");
  });
});
