// heatmap.format.ts — ASCII/text rendering of heatmap data

import { HeatmapCell, HeatmapStore, getAllCells } from "./heatmap";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function latencyBracket(avg: number): string {
  if (avg === 0) return " . ";
  if (avg < 100) return " ░ ";
  if (avg < 300) return " ▒ ";
  if (avg < 600) return " ▓ ";
  return " █ ";
}

export function formatHeatmapRow(
  day: number,
  cells: Map<string, HeatmapCell>,
  minSamples: number
): string {
  const label = DAY_LABELS[day].padEnd(3);
  const hours = Array.from({ length: 24 }, (_, h) => {
    const key = `${day}:${h}`;
    const cell = cells.get(key);
    if (!cell || cell.count < minSamples) return " · ";
    return latencyBracket(cell.avgLatency);
  });
  return `${label} |${hours.join("")}|`;
}

export function formatHeatmap(
  store: HeatmapStore,
  minSamples = 3
): string {
  const header =
    "    |" +
    Array.from({ length: 24 }, (_, h) => String(h).padStart(2) + " ").join("") +
    "|";
  const rows = Array.from({ length: 7 }, (_, d) =>
    formatHeatmapRow(d, store.cells, minSamples)
  );
  const legend =
    "legend: · = no data  ░ = <100ms  ▒ = <300ms  ▓ = <600ms  █ = 600ms+";
  return [header, ...rows, "", legend].join("\n");
}

export function heatmapStats(store: HeatmapStore): string {
  const cells = getAllCells(store);
  if (cells.length === 0) return "heatmap: no data";
  const total = cells.reduce((s, c) => s + c.count, 0);
  const errors = cells.reduce((s, c) => s + c.errorCount, 0);
  const avgLat =
    cells.reduce((s, c) => s + c.totalLatency, 0) /
    cells.reduce((s, c) => s + c.count, 0);
  return (
    `heatmap: ${cells.length} cells, ${total} samples, ` +
    `avg latency ${avgLat.toFixed(1)}ms, errors ${errors}`
  );
}
