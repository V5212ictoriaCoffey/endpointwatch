export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffFactor?: number;
}

export interface RetryResult<T> {
  value: T | null;
  attempts: number;
  lastError: Error | null;
  succeeded: boolean;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  delayMs: 500,
  backoffFactor: 2,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<RetryResult<T>> {
  const opts: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const backoff = opts.backoffFactor ?? 1;

  let lastError: Error | null = null;
  let delay = opts.delayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const value = await fn();
      return { value, attempts: attempt, lastError: null, succeeded: true };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < opts.maxAttempts) {
        await sleep(delay);
        delay = Math.round(delay * backoff);
      }
    }
  }

  return {
    value: null,
    attempts: opts.maxAttempts,
    lastError,
    succeeded: false,
  };
}
