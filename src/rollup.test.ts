import { rollupEntries, rollupAll, formatRollup, DEFAULT_WINDOWS } from "./rollup";
import { HistoryEntry } from "./history";

const NOW = 1_000_000;

function makeEntry(offsetMs: number, latency: number, success: boolean): HistoryEntry {
  return {
    timestamp: NOW - offsetMs,
    latency,
    status: success ? 200 : 500,
    success,
  };
}

describe("rollupEntries", () => {
  const entries: HistoryEntry[] = [
    makeEntry(10_000, 100, true),
    makeEntry(30_000, 200, true),
    makeEntry(200_000, 150, false),
  ];

  it("includes only entries within the window", () => {
    const result = rollupEntries("http://api/health", entries, { label: "1m", durationMs: 60_000 }, NOW);
    expect(result.sampleCount).toBe(2);
  });

  it("calculates average latency for window", () => {
    const result = rollupEntries("http://api/health", entries, { label: "1m", durationMs: 60_000 }, NOW);
    expect(result.avgLatency).toBeCloseTo(150, 1);
  });

  it("calculates error rate for window", () => {
    const result = rollupEntries("http://api/health", entries, { label: "1m", durationMs: 60_000 }, NOW);
    expect(result.errorRate).toBe(0);
  });

  it("returns zero latency and full error rate for empty window", () => {
    const result = rollupEntries("http://api/health", [], { label: "1m", durationMs: 60_000 }, NOW);
    expect(result.sampleCount).toBe(0);
    expect(result.avgLatency).toBe(0);
  });
});

describe("rollupAll", () => {
  it("returns one result per window", () => {
    const results = rollupAll("http://api", [], DEFAULT_WINDOWS, NOW);
    expect(results).toHaveLength(DEFAULT_WINDOWS.length);
    expect(results.map((r) => r.window)).toEqual(["1m", "5m", "15m"]);
  });
});

describe("formatRollup", () => {
  it("formats rollup result as a readable string", () => {
    const r = rollupEntries("http://api", [], { label: "5m", durationMs: 300_000 }, NOW);
    const line = formatRollup(r);
    expect(line).toContain("window=5m");
    expect(line).toContain("samples=0");
    expect(line).toContain("avgLatency=");
    expect(line).toContain("errorRate=");
  });
});
