/**
 * topology.ts
 *
 * Tracks the logical topology of monitored endpoints — grouping them into
 * regions, clusters, or service tiers. Useful for understanding blast radius
 * when a set of endpoints fails and for producing structured status views.
 */

export type TopologyRole = "primary" | "replica" | "edge" | "internal" | "external";

export interface TopologyNode {
  url: string;
  region?: string;
  cluster?: string;
  tier?: string;
  role: TopologyRole;
  addedAt: number;
  meta?: Record<string, string>;
}

export interface TopologyStore {
  nodes: Map<string, TopologyNode>;
}

/** Create a new empty topology store. */
export function createTopologyStore(): TopologyStore {
  return { nodes: new Map() };
}

/** Register or update a node in the topology. */
export function upsertNode(
  store: TopologyStore,
  url: string,
  options: Partial<Omit<TopologyNode, "url" | "addedAt">>
): TopologyNode {
  const existing = store.nodes.get(url);
  const node: TopologyNode = {
    url,
    role: options.role ?? existing?.role ?? "external",
    region: options.region ?? existing?.region,
    cluster: options.cluster ?? existing?.cluster,
    tier: options.tier ?? existing?.tier,
    meta: options.meta ?? existing?.meta,
    addedAt: existing?.addedAt ?? Date.now(),
  };
  store.nodes.set(url, node);
  return node;
}

/** Remove a node from the topology. */
export function removeNode(store: TopologyStore, url: string): boolean {
  return store.nodes.delete(url);
}

/** Retrieve a single node by URL. */
export function getNode(store: TopologyStore, url: string): TopologyNode | undefined {
  return store.nodes.get(url);
}

/** Return all nodes, optionally filtered by region or cluster. */
export function getNodes(
  store: TopologyStore,
  filter?: { region?: string; cluster?: string; tier?: string; role?: TopologyRole }
): TopologyNode[] {
  const all = Array.from(store.nodes.values());
  if (!filter) return all;
  return all.filter((n) => {
    if (filter.region && n.region !== filter.region) return false;
    if (filter.cluster && n.cluster !== filter.cluster) return false;
    if (filter.tier && n.tier !== filter.tier) return false;
    if (filter.role && n.role !== filter.role) return false;
    return true;
  });
}

/** Group all nodes by a given dimension. */
export function groupNodes(
  store: TopologyStore,
  by: "region" | "cluster" | "tier" | "role"
): Map<string, TopologyNode[]> {
  const groups = new Map<string, TopologyNode[]>();
  for (const node of store.nodes.values()) {
    const key = node[by] ?? "(unset)";
    const list = groups.get(key) ?? [];
    list.push(node);
    groups.set(key, list);
  }
  return groups;
}

/** Return a summary string describing the topology. */
export function topologySummary(store: TopologyStore): string {
  const total = store.nodes.size;
  if (total === 0) return "topology: no nodes registered";

  const regions = new Set<string>();
  const clusters = new Set<string>();
  for (const n of store.nodes.values()) {
    if (n.region) regions.add(n.region);
    if (n.cluster) clusters.add(n.cluster);
  }

  const parts: string[] = [`nodes=${total}`];
  if (regions.size > 0) parts.push(`regions=${regions.size}`);
  if (clusters.size > 0) parts.push(`clusters=${clusters.size}`);
  return `topology: ${parts.join(", ")}`;
}
