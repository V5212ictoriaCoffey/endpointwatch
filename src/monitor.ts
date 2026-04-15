import axios, { AxiosError } from 'axios';

export interface EndpointConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export interface ProbeResult {
  url: string;
  status: 'up' | 'down';
  statusCode?: number;
  latencyMs: number;
  error?: string;
  timestamp: Date;
}

export async function probeEndpoint(endpoint: EndpointConfig): Promise<ProbeResult> {
  const method = endpoint.method ?? 'GET';
  const timeoutMs = endpoint.timeoutMs ?? 5000;
  const start = Date.now();

  try {
    const response = await axios({
      url: endpoint.url,
      method,
      timeout: timeoutMs,
      headers: endpoint.headers ?? {},
      validateStatus: () => true,
    });

    const latencyMs = Date.now() - start;
    const isUp = response.status >= 200 && response.status < 400;

    return {
      url: endpoint.url,
      status: isUp ? 'up' : 'down',
      statusCode: response.status,
      latencyMs,
      timestamp: new Date(),
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const message = err instanceof AxiosError ? err.message : String(err);

    return {
      url: endpoint.url,
      status: 'down',
      latencyMs,
      error: message,
      timestamp: new Date(),
    };
  }
}

export async function probeAll(endpoints: EndpointConfig[]): Promise<ProbeResult[]> {
  return Promise.all(endpoints.map(probeEndpoint));
}
