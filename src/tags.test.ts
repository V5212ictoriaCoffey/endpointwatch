import {
  parseTags,
  normalizeTags,
  hasTag,
  hasAllTags,
  hasAnyTag,
  mergeTags,
  tagSummary,
} from './tags';

describe('parseTags', () => {
  it('returns empty array for undefined', () => {
    expect(parseTags(undefined)).toEqual([]);
  });

  it('parses comma-separated string', () => {
    expect(parseTags('api, health, prod')).toEqual(['api', 'health', 'prod']);
  });

  it('accepts array input', () => {
    expect(parseTags(['api', ' health '])).toEqual(['api', 'health']);
  });

  it('filters empty entries', () => {
    expect(parseTags('api,,prod')).toEqual(['api', 'prod']);
  });
});

describe('normalizeTags', () => {
  it('lowercases and deduplicates', () => {
    expect(normalizeTags(['API', 'api', 'Prod'])).toEqual(['api', 'prod']);
  });
});

describe('hasTag', () => {
  it('returns true for matching tag (case-insensitive)', () => {
    expect(hasTag(['API', 'prod'], 'api')).toBe(true);
  });

  it('returns false when tag absent', () => {
    expect(hasTag(['api'], 'health')).toBe(false);
  });
});

describe('hasAllTags', () => {
  it('returns true when all required tags present', () => {
    expect(hasAllTags(['api', 'prod', 'health'], ['api', 'health'])).toBe(true);
  });

  it('returns false when any required tag missing', () => {
    expect(hasAllTags(['api'], ['api', 'prod'])).toBe(false);
  });
});

describe('hasAnyTag', () => {
  it('returns true when at least one candidate matches', () => {
    expect(hasAnyTag(['api', 'prod'], ['staging', 'prod'])).toBe(true);
  });

  it('returns false when no candidates match', () => {
    expect(hasAnyTag(['api'], ['staging', 'prod'])).toBe(false);
  });
});

describe('mergeTags', () => {
  it('merges and deduplicates multiple tag arrays', () => {
    expect(mergeTags(['API'], ['api', 'prod'])).toEqual(['api', 'prod']);
  });
});

describe('tagSummary', () => {
  it('returns placeholder for empty tags', () => {
    expect(tagSummary([])).toBe('(no tags)');
  });

  it('joins tags with comma', () => {
    expect(tagSummary(['api', 'prod'])).toBe('api, prod');
  });
});
