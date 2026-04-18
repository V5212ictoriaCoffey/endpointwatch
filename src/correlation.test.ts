import { describe, it, expect } from "vitest";
import {
  groupByWindow,
  findCorrelated,
  formatCorrelation,
  CorrelationEntry,
} from "./correlation";

const base = 1700000000000;

function makeEntry(
  endpointId: string,
  offsetMs: number,
  alertLevel = "critical"
): CorrelationEntry {
  return { endpointId, alertLevel, timestamp: base + offsetMs };
}

describe("groupByWindow", () => {
  it("groups entries within the window", () => {
    const entries = [makeEntry("a", 0), makeEntry("b", 500), makeEntry("c", 5000)];
    const groups = groupByWindow(entries, 1000);
    expect(groups).toHaveLength(2);
    expect(groups[0].endpointIds).toEqual(expect.arrayContaining(["a", "b"]));
    expect(groups[1].endpointIds).toContain("c");
  });

  it("returns empty array for no entries", () => {
    expect(groupByWindow([], 1000)).toEqual([]);
  });

  it("deduplicates endpointIds within a group", () => {
    const entries = [makeEntry("a", 0), makeEntry("a", 100)];
    const groups = groupByWindow(entries, 1000);
    expect(groups[0].endpointIds).toEqual(["a"]);
  });
});

describe("findCorrelated", () => {
  it("returns groups with at least minEndpoints", () => {
    const entries = [
      makeEntry("a", 0),
      makeEntry("b", 200),
      makeEntry("c", 10000),
    ];
    const result = findCorrelated(entries, 1000, 2);
    expect(result).toHaveLength(1);
    expect(result[0].endpointIds).toEqual(expect.arrayContaining(["a", "b"]));
  });

  it("returns empty if no group meets threshold", () => {
    const entries = [makeEntry("a", 0), makeEntry("b", 5000)];
    expect(findCorrelated(entries, 1000, 2)).toHaveLength(0);
  });
});

describe("formatCorrelation", () => {
  it("formats a correlation group", () => {
    const entries = [makeEntry("api/health", 0), makeEntry("api/users", 100)];
    const [group] = groupByWindow(entries, 1000);
    const line = formatCorrelation(group);
    expect(line).toContain("api/health");
    expect(line).toContain("api/users");
    expect(line).toContain("2 endpoints");
  });
});
