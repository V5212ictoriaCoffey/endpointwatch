/**
 * signal.ts — graceful shutdown signal handling for endpointwatch
 */

export type ShutdownHandler = () => Promise<void> | void;

export interface SignalStore {
  handlers: ShutdownHandler[];
  triggered: boolean;
  signal: string | null;
}

export function createSignalStore(): SignalStore {
  return { handlers: [], triggered: false, signal: null };
}

export function onShutdown(store: SignalStore, handler: ShutdownHandler): void {
  store.handlers.push(handler);
}

export function offShutdown(store: SignalStore, handler: ShutdownHandler): void {
  store.handlers = store.handlers.filter((h) => h !== handler);
}

export async function triggerShutdown(
  store: SignalStore,
  signal: string
): Promise<void> {
  if (store.triggered) return;
  store.triggered = true;
  store.signal = signal;
  for (const handler of store.handlers) {
    try {
      await handler();
    } catch {
      // best-effort: continue draining remaining handlers
    }
  }
}

export function registerSignals(
  store: SignalStore,
  signals: string[] = ["SIGINT", "SIGTERM"]
): () => void {
  const listeners: Array<[string, () => void]> = [];

  for (const sig of signals) {
    const listener = () => {
      triggerShutdown(store, sig).catch(() => {});
    };
    process.on(sig, listener);
    listeners.push([sig, listener]);
  }

  return () => {
    for (const [sig, listener] of listeners) {
      process.off(sig, listener);
    }
  };
}

export function signalSummary(store: SignalStore): string {
  if (!store.triggered) return "signal: idle";
  return `signal: shutdown triggered by ${store.signal} (${store.handlers.length} handlers ran)`;
}
