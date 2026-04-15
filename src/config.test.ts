import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadConfig, AppConfig } from './config';

function writeTempConfig(data: object): string {
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `endpointwatch-test-${Date.now()}.json`);
  fs.writeFileSync(tmpFile, JSON.stringify(data), 'utf-8');
  return tmpFile;
}

describe('loadConfig', () => {
  it('throws if config file does not exist', () => {
    expect(() => loadConfig('/nonexistent/path/config.json')).toThrow(
      'Config file not found'
    );
  });

  it('throws if config file contains invalid JSON', () => {
    const tmpFile = path.join(os.tmpdir(), `endpointwatch-invalid-${Date.now()}.json`);
    fs.writeFileSync(tmpFile, '{ invalid json }', 'utf-8');
    expect(() => loadConfig(tmpFile)).toThrow('Failed to parse config file');
    fs.unlinkSync(tmpFile);
  });

  it('loads a valid config and applies defaults', () => {
    const raw: AppConfig = {
      endpoints: [
        { name: 'Test API', url: 'https://example.com/api/health' },
      ],
    };
    const tmpFile = writeTempConfig(raw);
    const config = loadConfig(tmpFile);

    expect(config.endpoints).toHaveLength(1);
    const ep = config.endpoints[0];
    expect(ep.method).toBe('GET');
    expect(ep.intervalSeconds).toBe(60);
    expect(ep.timeoutMs).toBe(5000);
    expect(ep.expectedStatusCode).toBe(200);
    expect(ep.alertThresholds?.latencyMs).toBe(1000);
    expect(ep.alertThresholds?.consecutiveFailures).toBe(3);

    fs.unlinkSync(tmpFile);
  });

  it('respects endpoint-level overrides over defaults', () => {
    const raw: AppConfig = {
      defaults: { intervalSeconds: 30, timeoutMs: 3000 },
      endpoints: [
        {
          name: 'Custom',
          url: 'https://example.com',
          intervalSeconds: 10,
          timeoutMs: 1000,
        },
      ],
    };
    const tmpFile = writeTempConfig(raw);
    const config = loadConfig(tmpFile);
    const ep = config.endpoints[0];

    expect(ep.intervalSeconds).toBe(10);
    expect(ep.timeoutMs).toBe(1000);

    fs.unlinkSync(tmpFile);
  });
});
