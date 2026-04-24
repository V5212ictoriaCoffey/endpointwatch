import { describe, it, expect } from "vitest";
import {
  scoreItem,
  resolvePriority,
  triageItems,
  formatTriage,
  TriageItem,
} from "./triage";

const NOW = 1_700_000_000_000;

function makeItem(overrides: Partial<TriageItem> = {}): TriageItem {
  return {
    id: "item-1",
    url: "https://api.example.com/health",
    alertLevel: "high",
    openedAt: NOW - 10 * 60_000, // 10 minutes ago
    failureCount: 3,
    ...overrides,
  };
}

describe("scoreItem", () => {
  it("returns higher score for critical level", () => {
    const critical = scoreItem(makeItem({ alertLevel: "critical" }), NOW);
    const low = scoreItem(makeItem({ alertLevel: "low" }), NOW);
    expect(critical).toBeGreaterThan(low);
  });

  it("increases score with age", () => {
    const old = scoreItem(makeItem({ openedAt: NOW - 60 * 60_000 }), NOW);
    const recent = scoreItem(makeItem({ openedAt: NOW - 60_000 }), NOW);
    expect(old).toBeGreaterThan(recent);
  });

  it("increases score with failure count", () => {
    const many = scoreItem(makeItem({ failureCount: 20 }), NOW);
    const few = scoreItem(makeItem({ failureCount: 1 }), NOW);
    expect(many).toBeGreaterThan(few);
  });
});

describe("resolvePriority", () => {
  it("maps score >= 120 to critical", () => {
    expect(resolvePriority(130)).toBe("critical");
  });

  it("maps score >= 70 to high", () => {
    expect(resolvePriority(80)).toBe("high");
  });

  it("maps score >= 35 to medium", () => {
    expect(resolvePriority(40)).toBe("medium");
  });

  it("maps low score to low", () => {
    expect(resolvePriority(10)).toBe("low");
  });
});

describe("triageItems", () => {
  it("returns results sorted by score descending", () => {
    const items: TriageItem[] = [
      makeItem({ id: "a", alertLevel: "low", failureCount: 0 }),
      makeItem({ id: "b", alertLevel: "critical", failureCount: 10 }),
      makeItem({ id: "c", alertLevel: "medium", failureCount: 2 }),
    ];
    const results = triageItems(items, NOW);
    expect(results[0].item.id).toBe("b");
    expect(results[results.length - 1].item.id).toBe("a");
  });

  it("returns empty array for no items", () => {
    expect(triageItems([], NOW)).toEqual([]);
  });

  it("attaches ageMs to each result", () => {
    const item = makeItem({ openedAt: NOW - 5 * 60_000 });
    const [result] = triageItems([item], NOW);
    expect(result.ageMs).toBe(5 * 60_000);
  });
});

describe("formatTriage", () => {
  it("returns placeholder for empty list", () => {
    expect(formatTriage([])).toBe("No active triage items.");
  });

  it("includes url and priority in output", () => {
    const items = [makeItem({ alertLevel: "critical", failureCount: 5 })];
    const results = triageItems(items, NOW);
    const output = formatTriage(results);
    expect(output).toContain("CRITICAL");
    expect(output).toContain("api.example.com");
  });
});
