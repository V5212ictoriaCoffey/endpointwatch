import { ProbeResult } from './monitor';

export interface AlertThresholds {
  maxLatencyMs?: number;
  allowedStatusCodes?: number[];
}

export interface Alert {
  url: string;
  reason: 'down' | 'latency' | 'unexpected_status';
  message: string;
  result: ProbeResult;
}

export function evaluateResult(result: ProbeResult, thresholds: AlertThresholds): Alert | null {
  if (result.status === 'down' && result.statusCode === undefined) {
    return {
      url: result.url,
      reason: 'down',
      message: `Endpoint unreachable: ${result.error ?? 'unknown error'}`,
      result,
    };
  }

  if (
    result.statusCode !== undefined &&
    thresholds.allowedStatusCodes &&
    thresholds.allowedStatusCodes.length > 0 &&
    !thresholds.allowedStatusCodes.includes(result.statusCode)
  ) {
    return {
      url: result.url,
      reason: 'unexpected_status',
      message: `Unexpected status code ${result.statusCode} (allowed: ${thresholds.allowedStatusCodes.join(', ')})`,
      result,
    };
  }

  if (thresholds.maxLatencyMs !== undefined && result.latencyMs > thresholds.maxLatencyMs) {
    return {
      url: result.url,
      reason: 'latency',
      message: `Latency ${result.latencyMs}ms exceeds threshold of ${thresholds.maxLatencyMs}ms`,
      result,
    };
  }

  return null;
}

export function evaluateAll(results: ProbeResult[], thresholds: AlertThresholds): Alert[] {
  return results.flatMap((r) => {
    const alert = evaluateResult(r, thresholds);
    return alert ? [alert] : [];
  });
}
