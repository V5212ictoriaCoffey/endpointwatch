import {
  createHeatmapStore,
  recordHeatmap,
  getHeatmapCell,
  getAllCells,
  peakCell,
} from "./heatmap";
import { parseHeatmapConfig, heatmapConfigSummary } from "./heatmap.config";
import { formatHeatmap, heatmapStats } from "./heatmap.format";

// Fixed timestamp: Wednesday 2024-01-10 14:30 UTC
const BASE_TS = new Date("2024-01-10T14:30:00Z").getTime();

describe("heatmap store", () => {
  it("records a cell and computes avgLatency", () => {
    const store = createHeatmapStore();
    recordHeatmap(store, BASE_TS, 120, false);
    recordHeatmap(store, BASE_TS, 80, false);
    const cell = getHeatmapCell(store, new Date(BASE_TS).getDay(), new Date(BASE_TS).getHours());
    expect(cell).toBeDefined();
    expect(cell!.count).toBe(2);
    expect(cell!.avgLatency).toBe(100);
    expect(cell!.errorCount).toBe(0);
  });

  it("tracks errors separately", () => {
    const store = createHeatmapStore();
    recordHeatmap(store, BASE_TS, 500, true);
    recordHeatmap(store, BASE_TS, 200, false);
    const cell = getHeatmapCell(store, new Date(BASE_TS).getDay(), new Date(BASE_TS).getHours());
    expect(cell!.errorCount).toBe(1);
    expect(cell!.count).toBe(2);
  });

  it("returns all cells", () => {
    const store = createHeatmapStore();
    const ts2 = new Date("2024-01-10T09:00:00Z").getTime();
    recordHeatmap(store, BASE_TS, 100, false);
    recordHeatmap(store, ts2, 200, false);
    expect(getAllCells(store).length).toBe(2);
  });

  it("returns the peak cell by avgLatency", () => {
    const store = createHeatmapStore();
    const ts2 = new Date("2024-01-10T09:00:00Z").getTime();
    recordHeatmap(store, BASE_TS, 100, false);
    recordHeatmap(store, ts2, 800, false);
    const peak = peakCell(store);
    expect(peak!.avgLatency).toBe(800);
  });

  it("returns undefined peakCell on empty store", () => {
    expect(peakCell(createHeatmapStore())).toBeUndefined();
  });
});

describe("heatmap config", () => {
  it("applies defaults for empty config", () => {
    const cfg = parseHeatmapConfig({});
    expect(cfg.enabled).toBe(true);
    expect(cfg.trackErrors).toBe(true);
    expect(cfg.minSamples).toBe(3);
  });

  it("parses provided values", () => {
    const cfg = parseHeatmapConfig({ enabled: false, minSamples: 10 });
    expect(cfg.enabled).toBe(false);
    expect(cfg.minSamples).toBe(10);
  });

  it("formats summary when disabled", () => {
    const cfg = parseHeatmapConfig({ enabled: false });
    expect(heatmapConfigSummary(cfg)).toContain("disabled");
  });

  it("formats summary when enabled", () => {
    const cfg = parseHeatmapConfig({});
    expect(heatmapConfigSummary(cfg)).toContain("enabled");
  });
});

describe("heatmap format", () => {
  it("renders a grid with header and legend", () => {
    const store = createHeatmapStore();
    recordHeatmap(store, BASE_TS, 250, false);
    const output = formatHeatmap(store, 1);
    expect(output).toContain("legend");
    expect(output).toContain("|");
  });

  it("heatmapStats returns no-data for empty store", () => {
    expect(heatmapStats(createHeatmapStore())).toContain("no data");
  });

  it("heatmapStats includes sample count", () => {
    const store = createHeatmapStore();
    recordHeatmap(store, BASE_TS, 150, false);
    const stats = heatmapStats(store);
    expect(stats).toContain("1 samples");
  });
});
