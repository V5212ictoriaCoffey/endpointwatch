import { describe, it, expect } from 'vitest';
import { parseQuotaConfig, applyQuotaDefaults, defaultQuotaConfig } from './quota.config';

describe('parseQuotaConfig', () => {
  it('parses valid fields', () => {
    const c = parseQuotaConfig({ maxRequests: 20, windowMs: 3000 });
    expect(c.maxRequests).toBe(20);
    expect(c.windowMs).toBe(3000);
  });

  it('ignores invalid types', () => {
    const c = parseQuotaConfig({ maxRequests: 'bad', windowMs: null });
    expect(c.maxRequests).toBeUndefined();
    expect(c.windowMs).toBeUndefined();
  });
});

describe('applyQuotaDefaults', () => {
  it('fills missing fields with defaults', () => {
    const c = applyQuotaDefaults({});
    expect(c).toEqual(defaultQuotaConfig);
  });

  it('preserves provided values', () => {
    const c = applyQuotaDefaults({ maxRequests: 5 });
    expect(c.maxRequests).toBe(5);
    expect(c.windowMs).toBe(defaultQuotaConfig.windowMs);
  });
});
