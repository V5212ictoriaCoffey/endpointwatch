import {
  createMaintenanceStore,
  addWindow,
  removeWindow,
  isInMaintenance,
  pruneExpired,
  getActiveWindows,
  maintenanceSummary,
  MaintenanceWindow,
} from "./maintenance";

const NOW = 1_700_000_000_000;

function makeWindow(
  overrides: Partial<MaintenanceWindow> = {}
): MaintenanceWindow {
  return {
    id: "win-1",
    url: "https://api.example.com/health",
    startsAt: NOW - 1000,
    endsAt: NOW + 60_000,
    ...overrides,
  };
}

describe("maintenance", () => {
  it("creates an empty store", () => {
    const store = createMaintenanceStore();
    expect(store.windows).toHaveLength(0);
  });

  it("adds a window", () => {
    const store = createMaintenanceStore();
    addWindow(store, makeWindow());
    expect(store.windows).toHaveLength(1);
  });

  it("removes a window by id", () => {
    const store = createMaintenanceStore();
    addWindow(store, makeWindow({ id: "win-1" }));
    const removed = removeWindow(store, "win-1");
    expect(removed).toBe(true);
    expect(store.windows).toHaveLength(0);
  });

  it("returns false when removing unknown id", () => {
    const store = createMaintenanceStore();
    expect(removeWindow(store, "nope")).toBe(false);
  });

  it("detects active maintenance for matching url", () => {
    const store = createMaintenanceStore();
    addWindow(store, makeWindow());
    expect(isInMaintenance(store, "https://api.example.com/health", NOW)).toBe(true);
  });

  it("returns false when url does not match", () => {
    const store = createMaintenanceStore();
    addWindow(store, makeWindow());
    expect(isInMaintenance(store, "https://other.example.com", NOW)).toBe(false);
  });

  it("returns false when outside window time range", () => {
    const store = createMaintenanceStore();
    addWindow(store, makeWindow({ startsAt: NOW + 5000, endsAt: NOW + 10_000 }));
    expect(isInMaintenance(store, "https://api.example.com/health", NOW)).toBe(false);
  });

  it("prunes expired windows", () => {
    const store = createMaintenanceStore();
    addWindow(store, makeWindow({ endsAt: NOW - 1 }));
    addWindow(store, makeWindow({ id: "win-2", endsAt: NOW + 10_000 }));
    const pruned = pruneExpired(store, NOW);
    expect(pruned).toBe(1);
    expect(store.windows).toHaveLength(1);
  });

  it("returns active windows", () => {
    const store = createMaintenanceStore();
    addWindow(store, makeWindow());
    addWindow(store, makeWindow({ id: "win-future", startsAt: NOW + 5000, endsAt: NOW + 10_000 }));
    expect(getActiveWindows(store, NOW)).toHaveLength(1);
  });

  it("formats a summary string", () => {
    const store = createMaintenanceStore();
    addWindow(store, makeWindow());
    const summary = maintenanceSummary(store);
    expect(summary).toMatch(/maintenance:/);
    expect(summary).toMatch(/1 active/);
  });
});
