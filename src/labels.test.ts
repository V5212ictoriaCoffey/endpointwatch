import {
  parseLabels,
  normalizeLabels,
  hasLabel,
  matchesLabels,
  mergeLabels,
  formatLabels,
  labelKeys,
  labelValues,
} from './labels';

describe('parseLabels', () => {
  it('parses a valid object', () => {
    expect(parseLabels({ env: 'prod', region: 'us-east' })).toEqual({ env: 'prod', region: 'us-east' });
  });
  it('ignores non-string values', () => {
    expect(parseLabels({ env: 'prod', count: 3 })).toEqual({ env: 'prod' });
  });
  it('returns empty for null/array', () => {
    expect(parseLabels(null)).toEqual({});
    expect(parseLabels([1, 2])).toEqual({});
  });
});

describe('normalizeLabels', () => {
  it('lowercases keys and values', () => {
    expect(normalizeLabels({ ENV: 'PROD' })).toEqual({ env: 'prod' });
  });
});

describe('hasLabel', () => {
  const labels = { env: 'prod', region: 'us-east' };
  it('returns true when key exists', () => expect(hasLabel(labels, 'env')).toBe(true));
  it('returns true when key+value match', () => expect(hasLabel(labels, 'env', 'prod')).toBe(true));
  it('returns false on wrong value', () => expect(hasLabel(labels, 'env', 'staging')).toBe(false));
  it('returns false on missing key', () => expect(hasLabel(labels, 'zone')).toBe(false));
});

describe('matchesLabels', () => {
  const labels = { env: 'prod', region: 'us-east' };
  it('matches when all selector entries match', () => {
    expect(matchesLabels(labels, { env: 'prod' })).toBe(true);
  });
  it('fails when one selector entry does not match', () => {
    expect(matchesLabels(labels, { env: 'prod', region: 'eu-west' })).toBe(false);
  });
});

describe('mergeLabels', () => {
  it('merges multiple label sets', () => {
    expect(mergeLabels({ a: '1' }, { b: '2' }, { a: '3' })).toEqual({ a: '3', b: '2' });
  });
});

describe('formatLabels', () => {
  it('formats as key=value pairs', () => {
    const result = formatLabels({ env: 'prod', region: 'us' });
    expect(result).toContain('env=prod');
    expect(result).toContain('region=us');
  });
});

describe('labelKeys / labelValues', () => {
  it('returns keys', () => expect(labelKeys({ a: '1', b: '2' })).toEqual(['a', 'b']));
  it('returns values', () => expect(labelValues({ a: '1', b: '2' })).toEqual(['1', '2']));
});
