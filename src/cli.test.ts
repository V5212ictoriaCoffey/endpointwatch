import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function writeTempConfig(data: object): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ew-cli-'));
  const file = path.join(dir, 'endpointwatch.json');
  fs.writeFileSync(file, JSON.stringify(data));
  return file;
}

describe('cli argument parser (unit)', () => {
  // We test the parseArgs logic indirectly via the help flag
  it('exits 0 with --help flag', () => {
    const result = spawnSync('ts-node', ['src/cli.ts', '--help'], {
      encoding: 'utf8',
      env: { ...process.env },
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('endpointwatch');
    expect(result.stdout).toContain('--config');
    expect(result.stdout).toContain('--once');
  });

  it('exits 1 with missing config file', () => {
    const result = spawnSync(
      'ts-node',
      ['src/cli.ts', '--config', '/nonexistent/path.json', '--once'],
      { encoding: 'utf8', env: { ...process.env } }
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Failed to load config');
  });

  it('exits 0 with --once and valid config', () => {
    const configFile = writeTempConfig({
      endpoints: [
        { name: 'test', url: 'https://httpbin.org/status/200', method: 'GET' },
      ],
      interval: 60,
      alerting: { latencyThresholdMs: 2000, errorThreshold: 1 },
    });

    const result = spawnSync(
      'ts-node',
      ['src/cli.ts', '--config', configFile, '--once'],
      { encoding: 'utf8', env: { ...process.env }, timeout: 15000 }
    );

    // Should complete without crashing
    expect(result.status).toBe(0);
  }, 20000);

  it('writes a report file when --report flag is provided', () => {
    const configFile = writeTempConfig({
      endpoints: [
        { name: 'ping', url: 'https://httpbin.org/status/200', method: 'GET' },
      ],
      interval: 60,
      alerting: { latencyThresholdMs: 3000, errorThreshold: 1 },
    });

    const reportFile = path.join(os.tmpdir(), `ew-report-${Date.now()}.json`);

    const result = spawnSync(
      'ts-node',
      ['src/cli.ts', '--config', configFile, '--once', '--report', reportFile],
      { encoding: 'utf8', env: { ...process.env }, timeout: 15000 }
    );

    expect(result.status).toBe(0);
    expect(fs.existsSync(reportFile)).toBe(true);

    const content = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
    expect(Array.isArray(content)).toBe(true);
  }, 20000);
});
