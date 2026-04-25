/**
 * flap.ts — Detects flapping endpoints (rapidly alternating between up/down states)
 */

export interface FlapState {
  url: string;
  transitions: number[];
  flapping: boolean;
  lastChecked: number;
}

export interface FlapOptions {
  windowMs: number;       // time window to observe transitions
  threshold: number;      // number of transitions to consider flapping
}

export interface FlapStore {
  states: Map<string, FlapState>;
  options: FlapOptions;
}

const defaultFlapOptions: FlapOptions = {
  windowMs: 60_000,
  threshold: 4,
};

export function createFlapStore(options: Partial<FlapOptions> = {}): FlapStore {
  return {
    states: new Map(),
    options: { ...defaultFlapOptions, ...options },
  };
}

function getOrCreate(store: FlapStore, url: string): FlapState {
  if (!store.states.has(url)) {
    store.states.set(url, { url, transitions: [], flapping: false, lastChecked: Date.now() });
  }
  return store.states.get(url)!;
}

export function recordTransition(store: FlapStore, url: string, now = Date.now()): void {
  const state = getOrCreate(store, url);
  state.transitions.push(now);
  pruneWindow(store, url, now);
  state.flapping = state.transitions.length >= store.options.threshold;
  state.lastChecked = now;
}

export function pruneWindow(store: FlapStore, url: string, now = Date.now()): void {
  const state = store.states.get(url);
  if (!state) return;
  const cutoff = now - store.options.windowMs;
  state.transitions = state.transitions.filter(t => t >= cutoff);
}

export function isFlapping(store: FlapStore, url: string): boolean {
  const state = store.states.get(url);
  return state?.flapping ?? false;
}

export function resetFlap(store: FlapStore, url: string): void {
  const state = store.states.get(url);
  if (state) {
    state.transitions = [];
    state.flapping = false;
  }
}

export function flapSummary(store: FlapStore): string {
  const flapping = [...store.states.values()].filter(s => s.flapping);
  if (flapping.length === 0) return 'No flapping endpoints detected.';
  return `Flapping endpoints (${flapping.length}): ${flapping.map(s => s.url).join(', ')}`;
}
