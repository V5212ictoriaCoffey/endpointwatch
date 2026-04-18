/**
 * Timeout utilities for endpoint monitoring requests.
 * Provides configurable per-request timeouts with AbortController support.
 */

export interface TimeoutOptions {
  /** Timeout in milliseconds (default: 5000) */
  timeoutMs: number;
}

export interface TimeoutHandle {
  signal: AbortSignal;
  clear: () => void;
}

const DEFAULT_TIMEOUT_MS = 5000;
const MIN_TIMEOUT_MS = 100;
const MAX_TIMEOUT_MS = 60_000;

/**
 * Creates an AbortSignal that fires after the given timeout.
 * Returns a handle with the signal and a clear() to cancel the timer.
 */
export function createTimeoutHandle(timeoutMs: number): TimeoutHandle {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

/**
 * Parses and validates timeout configuration from a raw config object.
 */
export function parseTimeoutOptions(
  raw: Record<string, unknown>
): TimeoutOptions {
  const raw_ms = raw["timeoutMs"] ?? raw["timeout_ms"];
  let timeoutMs = DEFAULT_TIMEOUT_MS;

  if (raw_ms !== undefined) {
    const parsed = Number(raw_ms);
    if (!Number.isFinite(parsed) || parsed < MIN_TIMEOUT_MS || parsed > MAX_TIMEOUT_MS) {
      throw new RangeError(
        `timeoutMs must be between ${MIN_TIMEOUT_MS} and ${MAX_TIMEOUT_MS}, got: ${raw_ms}`
      );
    }
    timeoutMs = parsed;
  }

  return { timeoutMs };
}

/**
 * Returns a human-readable summary of the timeout configuration.
 */
export function timeoutSummary(opts: TimeoutOptions): string {
  return `timeout=${opts.timeoutMs}ms`;
}

/**
 * Wraps a promise with a timeout. Rejects with a TimeoutError if the promise
 * does not settle within the specified number of milliseconds.
 */
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const handle = createTimeoutHandle(timeoutMs);
  const timeoutPromise = new Promise<never>((_, reject) => {
    handle.signal.addEventListener("abort", () =>
      reject(new Error(`Request timed out after ${timeoutMs}ms`))
    );
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    handle.clear();
  }
}
