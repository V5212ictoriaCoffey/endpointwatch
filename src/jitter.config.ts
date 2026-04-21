import type { JitterOptions, JitterStrategy } from "./jitter";

export interface RawJitterConfig {
  strategy?: string;
  minMs?: number;
  maxMs?: number;
}

const VALID_STRATEGIES: JitterStrategy[] = ["none", "full", "equal", "decorrelated"];

export const defaultJitterConfig: JitterOptions = {
  strategy: "full",
  minMs: 0,
  maxMs: 5000,
};

export function parseJitterConfig(raw: RawJitterConfig): Partial<JitterOptions> {
  const opts: Partial<JitterOptions> = {};

  if (raw.strategy !== undefined) {
    if (!VALID_STRATEGIES.includes(raw.strategy as JitterStrategy)) {
      throw new Error(
        `Invalid jitter strategy "${raw.strategy}". Must be one of: ${VALID_STRATEGIES.join(", ")}`
      );
    }
    opts.strategy = raw.strategy as JitterStrategy;
  }

  if (raw.minMs !== undefined) {
    if (raw.minMs < 0) throw new Error("jitter minMs must be >= 0");
    opts.minMs = raw.minMs;
  }

  if (raw.maxMs !== undefined) {
    if (raw.maxMs < 0) throw new Error("jitter maxMs must be >= 0");
    opts.maxMs = raw.maxMs;
  }

  if (opts.minMs !== undefined && opts.maxMs !== undefined && opts.minMs > opts.maxMs) {
    throw new Error("jitter minMs must be <= maxMs");
  }

  return opts;
}

export function applyJitterDefaults(raw: RawJitterConfig): JitterOptions {
  const parsed = parseJitterConfig(raw);
  const merged: JitterOptions = { ...defaultJitterConfig, ...parsed };
  if (merged.minMs > merged.maxMs) {
    merged.maxMs = merged.minMs;
  }
  return merged;
}

export function toJitterOptions(raw: RawJitterConfig | undefined): JitterOptions {
  if (!raw) return { ...defaultJitterConfig };
  return applyJitterDefaults(raw);
}
