import nock from 'nock';
import { probeEndpoint, probeAll } from './monitor';

beforeAll(() => nock.disableNetConnect());
afterEach(() => nock.cleanAll());
afterAll(() => nock.enableNetConnect());

describe('probeEndpoint', () => {
  it('returns status up for a 200 response', async () => {
    nock('https://example.com').get('/health').reply(200);

    const result = await probeEndpoint({ url: 'https://example.com/health' });

    expect(result.status).toBe('up');
    expect(result.statusCode).toBe(200);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.error).toBeUndefined();
  });

  it('returns status down for a 500 response', async () => {
    nock('https://example.com').get('/health').reply(500);

    const result = await probeEndpoint({ url: 'https://example.com/health' });

    expect(result.status).toBe('down');
    expect(result.statusCode).toBe(500);
  });

  it('returns status down on network error', async () => {
    nock('https://example.com').get('/health').replyWithError('ECONNREFUSED');

    const result = await probeEndpoint({ url: 'https://example.com/health' });

    expect(result.status).toBe('down');
    expect(result.error).toMatch(/ECONNREFUSED/);
    expect(result.statusCode).toBeUndefined();
  });

  it('uses specified HTTP method', async () => {
    nock('https://example.com').head('/ping').reply(204);

    const result = await probeEndpoint({ url: 'https://example.com/ping', method: 'HEAD' });

    expect(result.status).toBe('up');
    expect(result.statusCode).toBe(204);
  });

  it('includes a timestamp in results', async () => {
    nock('https://example.com').get('/health').reply(200);

    const before = new Date();
    const result = await probeEndpoint({ url: 'https://example.com/health' });

    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});

describe('probeAll', () => {
  it('probes multiple endpoints concurrently', async () => {
    nock('https://a.example.com').get('/').reply(200);
    nock('https://b.example.com').get('/').reply(503);

    const results = await probeAll([
      { url: 'https://a.example.com/' },
      { url: 'https://b.example.com/' },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].status).toBe('up');
    expect(results[1].status).toBe('down');
  });
});
