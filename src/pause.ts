export interface PauseStore {
  paused: Set<string>;
}

export function createPauseStore(): PauseStore {
  return { paused: new Set() };
}

export function pauseEndpoint(store: PauseStore, url: string): void {
  store.paused.add(url);
}

export function resumeEndpoint(store: PauseStore, url: string): void {
  store.paused.delete(url);
}

export function isPaused(store: PauseStore, url: string): boolean {
  return store.paused.has(url);
}

export function pauseAll(store: PauseStore, urls: string[]): void {
  for (const url of urls) store.paused.add(url);
}

export function resumeAll(store: PauseStore, urls: string[]): void {
  for (const url of urls) store.paused.delete(url);
}

export function listPaused(store: PauseStore): string[] {
  return Array.from(store.paused);
}

export function pauseSummary(store: PauseStore): string {
  const count = store.paused.size;
  if (count === 0) return 'No endpoints paused.';
  return `Paused endpoints (${count}): ${listPaused(store).join(', ')}`;
}
