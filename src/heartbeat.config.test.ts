import { parseHeartbeatConfig, applyHeartbeatDefaults, heartbeatConfigSummary } from './heartbeat.config';

describe('parseHeartbeatConfig', () => {
  it('parses valid fields', () => {
    const cfg = parseHeartbeatConfig({ windowMs: 30000, minUptimeRatio: 0.9, alertOnMissed: false, missedThreshold: 5 });
    expect(cfg.windowMs).toBe(30000);
    expect(cfg.minUptimeRatio).toBe(0.9);
    expect(cfg.alertOnMissed).toBe(false);
    expect(cfg.missedThreshold).toBe(5);
  });

  it('ignores invalid types', () => {
    const cfg = parseHeartbeatConfig({ windowMs: 'bad', minUptimeRatio: null });
    expect(cfg.windowMs).toBeUndefined();
    expect(cfg.minUptimeRatio).toBeUndefined();
  });
});

describe('applyHeartbeatDefaults', () => {
  it('fills missing fields with defaults', () => {
    const cfg = applyHeartbeatDefaults({});
    expect(cfg.windowMs).toBe(60_000);
    expect(cfg.minUptimeRatio).toBe(0.95);
    expect(cfg.alertOnMissed).toBe(true);
    expect(cfg.missedThreshold).toBe(3);
  });

  it('preserves provided values', () => {
    const cfg = applyHeartbeatDefaults({ windowMs: 5000 });
    expect(cfg.windowMs).toBe(5000);
  });
});

describe('heartbeatConfigSummary', () => {
  it('returns a readable string', () => {
    const cfg = applyHeartbeatDefaults({});
    const s = heartbeatConfigSummary(cfg);
    expect(s).toContain('window=');
    expect(s).toContain('minUptime=');
  });
});
