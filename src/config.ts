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

  validateConfig(parsed);

  return applyDefaults(parsed);
}

/**
 * Validates the parsed config object, throwing descriptive errors
 * for missing or invalid required fields.
 */
function validateConfig(config: AppConfig): void {
  if (!Array.isArray(config.endpoints) || config.endpoints.length === 0) {
    throw new Error('Config must contain a non-empty "endpoints" array.');
  }

  config.endpoints.forEach((endpoint, index) => {
    if (!endpoint.name) {
      throw new Error(`Endpoint at index ${index} is missing required field "name".`);
    }
    if (!endpoint.url) {
      throw new Error(`Endpoint "${endpoint.name}" is missing required field "url".`);
    }
  });
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
