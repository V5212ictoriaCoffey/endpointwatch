import { RetryOptions, DEFAULT_RETRY_OPTIONS } from "./retry";

export interface RetryConfig {
  enabled: boolean;
  maxAttempts?: number;
  delayMs?: number;
  backoffFactor?: number;
}

export function parseRetryConfig(
  raw: Record<string, unknown> | undefined
): RetryConfig {
  if (!raw || typeof raw !== "object") {
    return { enabled: false };
  }

  const enabled =
    typeof raw["enabled"] === "boolean" ? raw["enabled"] : false;

  const maxAttempts =
    typeof raw["maxAttempts"] === "number" && raw["maxAttempts"] > 0
      ? (raw["maxAttempts"] as number)
      : undefined;

  const delayMs =
    typeof raw["delayMs"] === "number" && raw["delayMs"] >= 0
      ? (raw["delayMs"] as number)
      : undefined;

  const backoffFactor =
    typeof raw["backoffFactor"] === "number" && raw["backoffFactor"] >= 1
      ? (raw["backoffFactor"] as number)
      : undefined;

  return { enabled, maxAttempts, delayMs, backoffFactor };
}

export function resolveRetryOptions(
  config: RetryConfig
): RetryOptions {
  return {
    maxAttempts: config.maxAttempts ?? DEFAULT_RETRY_OPTIONS.maxAttempts,
    delayMs: config.delayMs ?? DEFAULT_RETRY_OPTIONS.delayMs,
    backoffFactor: config.backoffFactor ?? DEFAULT_RETRY_OPTIONS.backoffFactor,
  };
}

/**
 * Returns a RetryConfig with retry disabled, using default values for all
 * optional fields. Useful as a safe fallback when no config is provided.
 */
export function defaultRetryConfig(): RetryConfig {
  return {
    enabled: false,
    maxAttempts: DEFAULT_RETRY_OPTIONS.maxAttempts,
    delayMs: DEFAULT_RETRY_OPTIONS.delayMs,
    backoffFactor: DEFAULT_RETRY_OPTIONS.backoffFactor,
  };
}
