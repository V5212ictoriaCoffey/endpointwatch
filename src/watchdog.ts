import { createCircuit, isCircuitOpen, recordSuccess, recordFailure } from './circuit';
import { isPaused } from './pause';
import { isMuted } from './mute';

export interface WatchdogOptions {
  maxConsecutiveFailures: number;
  cooldownMs: number;
  onTrip?: (url: string) => void;
  onRecover?: (url: string) => void;
}

export interface WatchdogStore {
  circuits: Map<string, ReturnType<typeof createCircuit>>;
  options: WatchdogOptions;
}

export const defaultWatchdogOptions: WatchdogOptions = {
  maxConsecutiveFailures: 3,
  cooldownMs: 30_000,
};

export function createWatchdog(options: Partial<WatchdogOptions> = {}): WatchdogStore {
  return {
    circuits: new Map(),
    options: { ...defaultWatchdogOptions, ...options },
  };
}

function getOrCreate(store: WatchdogStore, url: string) {
  if (!store.circuits.has(url)) {
    store.circuits.set(
      url,
      createCircuit({ threshold: store.options.maxConsecutiveFailures, cooldownMs: store.options.cooldownMs })
    );
  }
  return store.circuits.get(url)!;
}

export function watchdogAllow(store: WatchdogStore, url: string): boolean {
  if (isPaused(url) || isMuted(url)) return false;
  const circuit = getOrCreate(store, url);
  return !isCircuitOpen(circuit);
}

export function watchdogSuccess(store: WatchdogStore, url: string): void {
  const circuit = getOrCreate(store, url);
  const wasOpen = isCircuitOpen(circuit);
  recordSuccess(circuit);
  if (wasOpen && !isCircuitOpen(circuit)) {
    store.options.onRecover?.(url);
  }
}

export function watchdogFailure(store: WatchdogStore, url: string): void {
  const circuit = getOrCreate(store, url);
  recordFailure(circuit);
  if (isCircuitOpen(circuit)) {
    store.options.onTrip?.(url);
  }
}

export function watchdogSummary(store: WatchdogStore): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [url, circuit] of store.circuits) {
    out[url] = isCircuitOpen(circuit) ? 'open' : 'closed';
  }
  return out;
}
