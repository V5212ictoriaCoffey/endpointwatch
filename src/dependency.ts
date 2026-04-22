/**
 * dependency.ts
 * Tracks endpoint dependencies so that failures in upstream endpoints
 * can suppress or annotate alerts for dependent downstream endpoints.
 */

export interface DependencyEdge {
  upstream: string;
  downstream: string;
}

export interface DependencyStore {
  edges: DependencyEdge[];
}

export function createDependencyStore(): DependencyStore {
  return { edges: [] };
}

export function addDependency(
  store: DependencyStore,
  upstream: string,
  downstream: string
): void {
  const exists = store.edges.some(
    (e) => e.upstream === upstream && e.downstream === downstream
  );
  if (!exists) {
    store.edges.push({ upstream, downstream });
  }
}

export function removeDependency(
  store: DependencyStore,
  upstream: string,
  downstream: string
): void {
  store.edges = store.edges.filter(
    (e) => !(e.upstream === upstream && e.downstream === downstream)
  );
}

export function getUpstreams(store: DependencyStore, url: string): string[] {
  return store.edges
    .filter((e) => e.downstream === url)
    .map((e) => e.upstream);
}

export function getDownstreams(store: DependencyStore, url: string): string[] {
  return store.edges
    .filter((e) => e.upstream === url)
    .map((e) => e.downstream);
}

export function hasFailingUpstream(
  store: DependencyStore,
  url: string,
  failingUrls: Set<string>
): boolean {
  return getUpstreams(store, url).some((u) => failingUrls.has(u));
}

export function dependencySummary(store: DependencyStore): string {
  if (store.edges.length === 0) return "No dependencies registered.";
  return store.edges
    .map((e) => `${e.upstream} -> ${e.downstream}`)
    .join("\n");
}
