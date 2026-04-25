import {
  createDriftStore,
  captureSnapshot,
  detectDrift,
  getDrifts,
  clearDrifts,
  formatDrift,
} from "./drift";

const URL = "https://api.example.com/health";

describe("drift", () => {
  it("returns no drifts on first capture", () => {
    const store = createDriftStore();
    const result = detectDrift(store, URL, { status: "ok", version: "1.0" });
    expect(result).toHaveLength(0);
  });

  it("detects a changed field", () => {
    const store = createDriftStore();
    detectDrift(store, URL, { status: "ok", version: "1.0" });
    const drifts = detectDrift(store, URL, { status: "ok", version: "2.0" });
    expect(drifts).toHaveLength(1);
    expect(drifts[0].field).toBe("version");
    expect(drifts[0].previous).toBe("1.0");
    expect(drifts[0].current).toBe("2.0");
  });

  it("detects a removed field", () => {
    const store = createDriftStore();
    detectDrift(store, URL, { status: "ok", version: "1.0" });
    const drifts = detectDrift(store, URL, { status: "ok" });
    expect(drifts.some((d) => d.field === "version")).toBe(true);
  });

  it("detects an added field", () => {
    const store = createDriftStore();
    detectDrift(store, URL, { status: "ok" });
    const drifts = detectDrift(store, URL, { status: "ok", newField: true });
    expect(drifts.some((d) => d.field === "newField")).toBe(true);
  });

  it("accumulates drifts in the store", () => {
    const store = createDriftStore();
    detectDrift(store, URL, { v: 1 });
    detectDrift(store, URL, { v: 2 });
    detectDrift(store, URL, { v: 3 });
    expect(getDrifts(store, URL)).toHaveLength(2);
  });

  it("captureSnapshot sets baseline without comparing", () => {
    const store = createDriftStore();
    captureSnapshot(store, URL, { v: 99 });
    const drifts = detectDrift(store, URL, { v: 99 });
    expect(drifts).toHaveLength(0);
  });

  it("getDrifts filters by url", () => {
    const store = createDriftStore();
    const other = "https://other.example.com";
    detectDrift(store, URL, { v: 1 });
    detectDrift(store, URL, { v: 2 });
    detectDrift(store, other, { v: 1 });
    detectDrift(store, other, { v: 2 });
    expect(getDrifts(store, URL)).toHaveLength(1);
    expect(getDrifts(store, other)).toHaveLength(1);
    expect(getDrifts(store)).toHaveLength(2);
  });

  it("clearDrifts removes all drifts", () => {
    const store = createDriftStore();
    detectDrift(store, URL, { v: 1 });
    detectDrift(store, URL, { v: 2 });
    clearDrifts(store);
    expect(getDrifts(store)).toHaveLength(0);
  });

  it("clearDrifts removes drifts for a specific url", () => {
    const store = createDriftStore();
    const other = "https://other.example.com";
    detectDrift(store, URL, { v: 1 });
    detectDrift(store, URL, { v: 2 });
    detectDrift(store, other, { v: 1 });
    detectDrift(store, other, { v: 2 });
    clearDrifts(store, URL);
    expect(getDrifts(store, URL)).toHaveLength(0);
    expect(getDrifts(store, other)).toHaveLength(1);
  });

  it("formatDrift returns a readable string", () => {
    const store = createDriftStore();
    detectDrift(store, URL, { v: 1 });
    const [drift] = detectDrift(store, URL, { v: 2 });
    const line = formatDrift(drift);
    expect(line).toContain("DRIFT");
    expect(line).toContain(URL);
    expect(line).toContain("v");
  });
});
