/**
 * grouping.ts — Group endpoints by tag, label, or URL pattern for bulk operations
 */

export interface GroupingOptions {
  by: "tag" | "label" | "urlPrefix";
  value?: string;
}

export interface EndpointGroup {
  key: string;
  urls: string[];
}

export interface Groupable {
  url: string;
  tags?: string[];
  labels?: Record<string, string>;
}

export function groupBy(
  items: Groupable[],
  by: "tag" | "label" | "urlPrefix",
  key: string
): EndpointGroup {
  let urls: string[] = [];

  if (by === "tag") {
    urls = items
      .filter((i) => Array.isArray(i.tags) && i.tags.includes(key))
      .map((i) => i.url);
  } else if (by === "label") {
    const [labelKey, labelVal] = key.split("=");
    urls = items
      .filter((i) => i.labels && i.labels[labelKey] === labelVal)
      .map((i) => i.url);
  } else if (by === "urlPrefix") {
    urls = items.filter((i) => i.url.startsWith(key)).map((i) => i.url);
  }

  return { key, urls };
}

export function groupAll(
  items: Groupable[],
  by: "tag" | "label" | "urlPrefix"
): EndpointGroup[] {
  const keys = new Set<string>();

  if (by === "tag") {
    items.forEach((i) => (i.tags ?? []).forEach((t) => keys.add(t)));
  } else if (by === "label") {
    items.forEach((i) =>
      Object.entries(i.labels ?? {}).forEach(([k, v]) => keys.add(`${k}=${v}`))
    );
  } else if (by === "urlPrefix") {
    items.forEach((i) => {
      const match = i.url.match(/^https?:\/\/[^/]+/);
      if (match) keys.add(match[0]);
    });
  }

  return Array.from(keys).map((k) => groupBy(items, by, k));
}

export function formatGroup(group: EndpointGroup): string {
  return `[${group.key}] (${group.urls.length} endpoint${
    group.urls.length !== 1 ? "s" : ""
  }): ${group.urls.join(", ") || "(none)"}`;
}
