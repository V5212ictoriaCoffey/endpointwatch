import {
  applyFilter,
  matchesTags,
  matchesStatus,
  matchesAlertLevel,
  matchesUrlPattern,
  parseFilterOptions,
  Filterable,
} from "./filter";
import { AlertLevel } from "./alerting";

function makeItem(overrides: Partial<Filterable> = {}): Filterable {
  return {
    url: "https://api.example.com/health",
    tags: ["prod", "api"],
    statusCode: 200,
    alertLevel: AlertLevel.None,
    ...overrides,
  };
}

describe("matchesTags", () => {
  it("returns true when no tags filter", () => {
    expect(matchesTags(makeItem(), [])).toBe(true);
  });

  it("returns true when all tags match", () => {
    expect(matchesTags(makeItem(), ["prod"])).toBe(true);
  });

  it("returns false when a tag is missing", () => {
    expect(matchesTags(makeItem(), ["prod", "internal"])).toBe(false);
  });

  it("returns false when item has no tags", () => {
    expect(matchesTags(makeItem({ tags: [] }), ["prod"])).toBe(false);
  });
});

describe("matchesStatus", () => {
  it("returns true when no status filter", () => {
    expect(matchesStatus(makeItem(), [])).toBe(true);
  });

  it("returns true when status matches", () => {
    expect(matchesStatus(makeItem({ statusCode: 404 }), [404, 500])).toBe(true);
  });

  it("returns false when status does not match", () => {
    expect(matchesStatus(makeItem({ statusCode: 200 }), [404])).toBe(false);
  });
});

describe("matchesAlertLevel", () => {
  it("returns true when no alert level filter", () => {
    expect(matchesAlertLevel(makeItem(), [])).toBe(true);
  });

  it("returns true when alert level matches", () => {
    expect(
      matchesAlertLevel(makeItem({ alertLevel: AlertLevel.Critical }), [
        AlertLevel.Critical,
      ])
    ).toBe(true);
  });

  it("returns false when alert level does not match", () => {
    expect(
      matchesAlertLevel(makeItem({ alertLevel: AlertLevel.None }), [
        AlertLevel.Warning,
      ])
    ).toBe(false);
  });
});

describe("matchesUrlPattern", () => {
  it("returns true when no pattern", () => {
    expect(matchesUrlPattern(makeItem(), "")).toBe(true);
  });

  it("matches by regex", () => {
    expect(matchesUrlPattern(makeItem(), "api\\.example")).toBe(true);
  });

  it("falls back to substring match on invalid regex", () => {
    expect(matchesUrlPattern(makeItem(), "example.com")).toBe(true);
  });
});

describe("applyFilter", () => {
  const items: Filterable[] = [
    makeItem({ url: "https://a.com", tags: ["prod"], statusCode: 200, alertLevel: AlertLevel.None }),
    makeItem({ url: "https://b.com", tags: ["staging"], statusCode: 500, alertLevel: AlertLevel.Critical }),
    makeItem({ url: "https://c.com", tags: ["prod", "api"], statusCode: 200, alertLevel: AlertLevel.Warning }),
  ];

  it("returns all items with empty filter", () => {
    expect(applyFilter(items, {})).toHaveLength(3);
  });

  it("filters by tag", () => {
    expect(applyFilter(items, { tags: ["prod"] })).toHaveLength(2);
  });

  it("filters by status", () => {
    expect(applyFilter(items, { status: [500] })).toHaveLength(1);
  });

  it("filters by alertLevel", () => {
    expect(applyFilter(items, { alertLevel: [AlertLevel.Critical] })).toHaveLength(1);
  });

  it("combines multiple filters", () => {
    expect(applyFilter(items, { tags: ["prod"], status: [200] })).toHaveLength(2);
  });
});

describe("parseFilterOptions", () => {
  it("parses all fields", () => {
    const result = parseFilterOptions({
      tags: ["prod"],
      status: [200],
      alertLevel: [AlertLevel.Warning],
      urlPattern: "api",
    });
    expect(result.tags).toEqual(["prod"]);
    expect(result.status).toEqual([200]);
    expect(result.alertLevel).toEqual([AlertLevel.Warning]);
    expect(result.urlPattern).toBe("api");
  });

  it("ignores non-array and non-string values", () => {
    const result = parseFilterOptions({ tags: "prod", urlPattern: 42 });
    expect(result.tags).toBeUndefined();
    expect(result.urlPattern).toBeUndefined();
  });
});
