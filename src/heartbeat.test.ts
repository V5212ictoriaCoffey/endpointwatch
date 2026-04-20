import {
  createHeartbeatStore,
  recordHeartbeat,
  getHeartbeats,
  heartbeatUptime,
  lastHeartbeat,
  clearHeartbeats,
} from './heartbeat';
import { checkHeartbeat, formatHeartbeatResult } from './heartbeat.check';
import { applyHeartbeatDefaults } from './heartbeat.config';

const url = 'https://example.com/api';
const cfg = applyHeartbeatDefaults({});

function makeEntry(ok: boolean, latencyMs = 100, timestamp = Date.now()) {
  return { url, ok, latencyMs, timestamp };
}

describe('heartbeat store', () => {
  it('records and retrieves entries', () => {
    const store = createHeartbeatStore();
    recordHeartbeat(store, makeEntry(true));
    expect(getHeartbeats(store, url)).toHaveLength(1);
  });

  it('prunes old entries outside window', () => {
    const store = createHeartbeatStore(1000);
    recordHeartbeat(store, makeEntry(true, 100, Date.now() - 2000));
    recordHeartbeat(store, makeEntry(true, 100, Date.now()));
    expect(getHeartbeats(store, url)).toHaveLength(1);
  });

  it('calculates uptime correctly', () => {
    const store = createHeartbeatStore();
    recordHeartbeat(store, makeEntry(true));
    recordHeartbeat(store, makeEntry(false));
    expect(heartbeatUptime(store, url)).toBe(0.5);
  });

  it('returns 1 for empty store', () => {
    const store = createHeartbeatStore();
    expect(heartbeatUptime(store, url)).toBe(1);
  });

  it('returns last heartbeat', () => {
    const store = createHeartbeatStore();
    recordHeartbeat(store, makeEntry(true, 50));
    recordHeartbeat(store, makeEntry(false, 200));
    expect(lastHeartbeat(store, url)?.latencyMs).toBe(200);
  });

  it('clears entries', () => {
    const store = createHeartbeatStore();
    recordHeartbeat(store, makeEntry(true));
    clearHeartbeats(store, url);
    expect(getHeartbeats(store, url)).toHaveLength(0);
  });
});

describe('checkHeartbeat', () => {
  it('flags low uptime', () => {
    const store = createHeartbeatStore();
    for (let i = 0; i < 10; i++) recordHeartbeat(store, makeEntry(i > 5));
    const result = checkHeartbeat(store, url, cfg);
    expect(result.belowThreshold).toBe(true);
  });

  it('flags too many missed', () => {
    const store = createHeartbeatStore();
    for (let i = 0; i < 5; i++) recordHeartbeat(store, makeEntry(false));
    const result = checkHeartbeat(store, url, cfg);
    expect(result.tooManyMissed).toBe(true);
  });

  it('formats result string', () => {
    const store = createHeartbeatStore();
    recordHeartbeat(store, makeEntry(true));
    const result = checkHeartbeat(store, url, cfg);
    expect(formatHeartbeatResult(result)).toContain('OK');
  });
});
