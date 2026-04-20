import { describe, it, expect } from "vitest";
import {
  groupBy,
  groupAll,
  formatGroup,
  type Groupable,
} from "./grouping";
import {
  parseGroupingConfig,
  applyGroupingDefaults,
  groupingConfigSummary,
} from "./grouping.config";

const items: Groupable[] = [
  { url: "https://api.example.com/health", tags: ["prod", "core"], labels: { env: "prod" } },
  { url: "https://api.example.com/status", tags: ["prod"], labels: { env: "prod", team: "platform" } },
  { url: "https://staging.example.com/health", tags: ["staging"], labels: { env: "staging" } },
  { url: "https://other.io/ping", tags: [], labels: {} },
];

describe("groupBy", () => {
  it("groups by tag", () => {
    const g = groupBy(items, "tag", "prod");
    expect(g.key).toBe("prod");
    expect(g.urls).toHaveLength(2);
    expect(g.urls).toContain("https://api.example.com/health");
  });

  it("groups by label key=value", () => {
    const g = groupBy(items, "label", "env=staging");
    expect(g.urls).toHaveLength(1);
    expect(g.urls[0]).toBe("https://staging.example.com/health");
  });

  it("groups by urlPrefix", () => {
    const g = groupBy(items, "urlPrefix", "https://api.example.com");
    expect(g.urls).toHaveLength(2);
  });

  it("returns empty urls when no match", () => {
    const g = groupBy(items, "tag", "nonexistent");
    expect(g.urls).toHaveLength(0);
  });
});

describe("groupAll", () => {
  it("collects all unique tags", () => {
    const groups = groupAll(items, "tag");
    const keys = groups.map((g) => g.key);
    expect(keys).toContain("prod");
    expect(keys).toContain("staging");
    expect(keys).toContain("core");
  });

  it("collects all unique url origins", () => {
    const groups = groupAll(items, "urlPrefix");
    expect(groups.map((g) => g.key)).toContain("https://api.example.com");
  });
});

describe("formatGroup", () => {
  it("formats with count and urls", () => {
    const g = groupBy(items, "tag", "prod");
    const out = formatGroup(g);
    expect(out).toContain("[prod]");
    expect(out).toContain("2 endpoints");
  });

  it("uses singular for one endpoint", () => {
    const g = groupBy(items, "tag", "staging");
    expect(formatGroup(g)).toContain("1 endpoint");
  });
});

describe("parseGroupingConfig", () => {
  it("parses valid config", () => {
    const opts = parseGroupingConfig({ by: "label", value: "env=prod" });
    expect(opts.by).toBe("label");
    expect(opts.value).toBe("env=prod");
  });

  it("throws on invalid by", () => {
    expect(() => parseGroupingConfig({ by: "invalid" })).toThrow();
  });
});

describe("applyGroupingDefaults", () => {
  it("defaults by to tag", () => {
    const opts = applyGroupingDefaults({});
    expect(opts.by).toBe("tag");
  });
});

describe("groupingConfigSummary", () => {
  it("includes by and value", () => {
    const s = groupingConfigSummary({ by: "urlPrefix", value: "https://api" });
    expect(s).toContain("urlPrefix");
    expect(s).toContain("https://api");
  });
});
