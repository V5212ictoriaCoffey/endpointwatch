import { createTimeoutHandle } from './timeout';

export interface HealthCheckResult {
  url: string;
  status: number | null;
  latencyMs: number;
  ok: boolean;
  error?: string;
  timestamp: string;
}

export interface HealthCheckOptions {
  timeoutMs?: number;
  expectedStatus?: number;
  method?: string;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_METHOD = 'GET';

export async function checkEndpoint(
  url: string,
  options: HealthCheckOptions = {}
): Promise<HealthCheckResult> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    expectedStatus = 200,
    method = DEFAULT_METHOD,
  } = options;

  const timestamp = new Date().toISOString();
  const { signal, cancel } = createTimeoutHandle(timeoutMs);
  const start = Date.now();

  try {
    const response = await fetch(url, { method, signal });
    const latencyMs = Date.now() - start;
    cancel();

    return {
      url,
      status: response.status,
      latencyMs,
      ok: response.status === expectedStatus,
      timestamp,
    };
  } catch (err: unknown) {
    cancel();
    const latencyMs = Date.now() - start;
    const error = err instanceof Error ? err.message : String(err);
    return {
      url,
      status: null,
      latencyMs,
      ok: false,
      error,
      timestamp,
    };
  }
}

export function isHealthy(result: HealthCheckResult): boolean {
  return result.ok && result.status !== null;
}
