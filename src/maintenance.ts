/**
 * maintenance.ts
 * Manage maintenance windows for endpoints — suppress alerts during scheduled downtime.
 */

export interface MaintenanceWindow {
  id: string;
  url: string;
  startsAt: number;
  endsAt: number;
  reason?: string;
}

export interface MaintenanceStore {
  windows: MaintenanceWindow[];
}

export function createMaintenanceStore(): MaintenanceStore {
  return { windows: [] };
}

export function addWindow(
  store: MaintenanceStore,
  window: MaintenanceWindow
): void {
  store.windows.push(window);
}

export function removeWindow(store: MaintenanceStore, id: string): boolean {
  const before = store.windows.length;
  store.windows = store.windows.filter((w) => w.id !== id);
  return store.windows.length < before;
}

export function isInMaintenance(
  store: MaintenanceStore,
  url: string,
  at: number = Date.now()
): boolean {
  return store.windows.some(
    (w) => w.url === url && at >= w.startsAt && at <= w.endsAt
  );
}

export function pruneExpired(
  store: MaintenanceStore,
  now: number = Date.now()
): number {
  const before = store.windows.length;
  store.windows = store.windows.filter((w) => w.endsAt > now);
  return before - store.windows.length;
}

export function getActiveWindows(
  store: MaintenanceStore,
  now: number = Date.now()
): MaintenanceWindow[] {
  return store.windows.filter((w) => now >= w.startsAt && now <= w.endsAt);
}

export function maintenanceSummary(store: MaintenanceStore): string {
  const total = store.windows.length;
  const active = getActiveWindows(store).length;
  return `maintenance: ${active} active / ${total} total window(s)`;
}
