import { describe, it, expect, beforeEach } from "vitest";
import {
  createRosterStore,
  addRosterEntry,
  removeRosterEntry,
  getRosterEntry,
  getActiveRecipients,
  rotateRoster,
  rosterSummary,
  type RosterEntry,
} from "./roster";
import { parseRosterConfig, applyRosterDefaults, rosterConfigSummary } from "./roster.config";

function makeEntry(overrides: Partial<RosterEntry> = {}): RosterEntry {
  return {
    id: "user-1",
    name: "Alice",
    contact: "alice@example.com",
    tags: ["infra"],
    active: true,
    ...overrides,
  };
}

describe("roster store", () => {
  let store: ReturnType<typeof createRosterStore>;

  beforeEach(() => {
    store = createRosterStore();
  });

  it("adds and retrieves an entry", () => {
    addRosterEntry(store, makeEntry());
    expect(getRosterEntry(store, "user-1")?.name).toBe("Alice");
  });

  it("removes an entry", () => {
    addRosterEntry(store, makeEntry());
    expect(removeRosterEntry(store, "user-1")).toBe(true);
    expect(getRosterEntry(store, "user-1")).toBeUndefined();
  });

  it("returns only active recipients", () => {
    addRosterEntry(store, makeEntry({ id: "u1", active: true }));
    addRosterEntry(store, makeEntry({ id: "u2", active: false }));
    const active = getActiveRecipients(store);
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe("u1");
  });

  it("filters active recipients by tag", () => {
    addRosterEntry(store, makeEntry({ id: "u1", tags: ["infra"] }));
    addRosterEntry(store, makeEntry({ id: "u2", tags: ["app"] }));
    const result = getActiveRecipients(store, ["infra"]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("u1");
  });

  it("rotates roster and returns an active entry", () => {
    addRosterEntry(store, makeEntry({ id: "u1" }));
    addRosterEntry(store, makeEntry({ id: "u2" }));
    const entry = rotateRoster(store);
    expect(entry).toBeDefined();
    expect(["u1", "u2"]).toContain(entry!.id);
  });

  it("returns undefined when no active recipients", () => {
    addRosterEntry(store, makeEntry({ active: false }));
    expect(rotateRoster(store)).toBeUndefined();
  });

  it("summarizes the store", () => {
    addRosterEntry(store, makeEntry({ id: "u1", active: true }));
    addRosterEntry(store, makeEntry({ id: "u2", active: false }));
    expect(rosterSummary(store)).toContain("1 active / 2 total");
  });
});

describe("roster config", () => {
  it("parses valid config", () => {
    const config = parseRosterConfig({
      rotationEnabled: true,
      fallbackContact: "ops@example.com",
      entries: [{ id: "u1", name: "Bob", contact: "bob@example.com", tags: ["db"], active: true }],
    });
    expect(config.entries).toHaveLength(1);
    expect(config.fallbackContact).toBe("ops@example.com");
  });

  it("applies defaults for missing fields", () => {
    const config = applyRosterDefaults({ rotationEnabled: false });
    expect(config.entries).toEqual([]);
    expect(config.rotationEnabled).toBe(false);
  });

  it("formats config summary", () => {
    const config = parseRosterConfig({ entries: [], rotationEnabled: true });
    const summary = rosterConfigSummary(config);
    expect(summary).toContain("rotationEnabled: true");
    expect(summary).toContain("entries: 0");
  });
});
