export type CircuitState = "closed" | "open" | "half-open";

export interface CircuitOptions {
  failureThreshold: number;
  successThreshold: number;
  timeout: number; // ms before half-open retry
}

export interface CircuitStore {
  state: CircuitState;
  failures: number;
  successes: number;
  openedAt: number | null;
  options: CircuitOptions;
}

const defaultOptions: CircuitOptions = {
  failureThreshold: 3,
  successThreshold: 1,
  timeout: 30000,
};

export function createCircuit(options: Partial<CircuitOptions> = {}): CircuitStore {
  return {
    state: "closed",
    failures: 0,
    successes: 0,
    openedAt: null,
    options: { ...defaultOptions, ...options },
  };
}

export function isCircuitOpen(store: CircuitStore, now = Date.now()): boolean {
  if (store.state === "open") {
    if (store.openedAt !== null && now - store.openedAt >= store.options.timeout) {
      store.state = "half-open";
      store.successes = 0;
      return false;
    }
    return true;
  }
  return false;
}

export function recordSuccess(store: CircuitStore): void {
  if (store.state === "half-open") {
    store.successes += 1;
    if (store.successes >= store.options.successThreshold) {
      store.state = "closed";
      store.failures = 0;
      store.successes = 0;
      store.openedAt = null;
    }
  } else if (store.state === "closed") {
    store.failures = 0;
  }
}

export function recordFailure(store: CircuitStore, now = Date.now()): void {
  if (store.state === "half-open") {
    store.state = "open";
    store.openedAt = now;
    return;
  }
  if (store.state === "closed") {
    store.failures += 1;
    if (store.failures >= store.options.failureThreshold) {
      store.state = "open";
      store.openedAt = now;
    }
  }
}

export function circuitSummary(store: CircuitStore): string {
  return `circuit=${store.state} failures=${store.failures} successes=${store.successes}`;
}
