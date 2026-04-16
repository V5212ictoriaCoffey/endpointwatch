import { createTimeoutHandle } from "./timeout";
import { sleep } from "./retry";

export interface ProbeOptions {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
}

export interface ProbeResult {
  url: string;
  status: number;
  latencyMs: number;
  ok: boolean;
  error?: string;
  timestamp: string;
}

export async function probe(options: ProbeOptions): Promise<ProbeResult> {
  const { url, method = "GET", headers = {}, body, timeoutMs = 10000 } = options;
  const start = Date.now();
  const timestamp = new Date().toISOString();

  const { signal, cancel } = createTimeoutHandle(timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ?? undefined,
      signal,
    });
    cancel();
    const latencyMs = Date.now() - start;
    return { url, status: res.status, latencyMs, ok: res.ok, timestamp };
  } catch (err: unknown) {
    cancel();
    const latencyMs = Date.now() - start;
    const error = err instanceof Error ? err.message : String(err);
    return { url, status: 0, latencyMs, ok: false, error, timestamp };
  }
}

export async function probeWithRetry(
  options: ProbeOptions,
  retries = 2,
  delayMs = 500
): Promise<ProbeResult> {
  let last: ProbeResult | undefined;
  for (let i = 0; i <= retries; i++) {
    last = await probe(options);
    if (last.ok) return last;
    if (i < retries) await sleep(delayMs);
  }
  return last!;
}
