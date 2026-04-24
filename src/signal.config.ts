/**
 * signal.config.ts — configuration parsing for signal/shutdown behaviour
 */

export interface SignalConfig {
  signals: string[];
  timeoutMs: number;
  exitCode: number;
}

const DEFAULT_SIGNALS = ["SIGINT", "SIGTERM"];
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_EXIT_CODE = 0;

export function parseSignalConfig(raw: Record<string, unknown>): SignalConfig {
  const signals = Array.isArray(raw["signals"])
    ? (raw["signals"] as string[]).filter((s) => typeof s === "string")
    : DEFAULT_SIGNALS;

  const timeoutMs =
    typeof raw["timeoutMs"] === "number" && raw["timeoutMs"] > 0
      ? raw["timeoutMs"]
      : DEFAULT_TIMEOUT_MS;

  const exitCode =
    typeof raw["exitCode"] === "number" ? raw["exitCode"] : DEFAULT_EXIT_CODE;

  return { signals, timeoutMs, exitCode };
}

export function applySignalDefaults(
  partial: Partial<SignalConfig>
): SignalConfig {
  return {
    signals: partial.signals ?? DEFAULT_SIGNALS,
    timeoutMs: partial.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    exitCode: partial.exitCode ?? DEFAULT_EXIT_CODE,
  };
}

export function signalConfigSummary(cfg: SignalConfig): string {
  return (
    `signals: [${cfg.signals.join(", ")}], ` +
    `timeout: ${cfg.timeoutMs}ms, exitCode: ${cfg.exitCode}`
  );
}
