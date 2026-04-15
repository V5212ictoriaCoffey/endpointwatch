import * as fs from 'fs';
import * as path from 'path';

export interface EndpointConfig {
  name: string;
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';
  intervalSeconds?: number;
  timeoutMs?: number;
  expectedStatusCode?: number;
  alertThresholds?: {
    latencyMs?: number;
    consecutiveFailures?: number;
  };
  headers?: Record<string, string>;
}

export interface AppConfig {
  endpoints: EndpointConfig[];
  defaults?: {
    method?: string;
    intervalSeconds?: number;
    timeoutMs?: number;
    expectedStatusCode?: number;
    alertThresholds?: {
      latencyMs?: number;
      consecutiveFailures?: number;
    };
  };
}

export function loadConfig(configPath: string): AppConfig {
  const resolvedPath = path.resolve(configPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Config file not found: ${resolvedPath}`);
  }

  const raw = fs.readFileSync(resolvedPath, 'utf-8');
  let parsed: AppConfig;

  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse config file: ${(err as Error).message}`);
  }

  return applyDefaults(parsed);
}

function applyDefaults(config: AppConfig): AppConfig {
  const defaults = config.defaults ?? {};

  config.endpoints = config.endpoints.map((endpoint) => ({
    method: defaults.method ?? 'GET',
    intervalSeconds: defaults.intervalSeconds ?? 60,
    timeoutMs: defaults.timeoutMs ?? 5000,
    expectedStatusCode: defaults.expectedStatusCode ?? 200,
    alertThresholds: {
      latencyMs: defaults.alertThresholds?.latencyMs ?? 1000,
      consecutiveFailures: defaults.alertThresholds?.consecutiveFailures ?? 3,
    },
    ...endpoint,
  }));

  return config;
}
