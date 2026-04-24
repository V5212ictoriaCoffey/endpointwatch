import { describe, it, expect, beforeEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import {
  createCheckpointStore,
  upsertCheckpoint,
  getCheckpoint,
  removeCheckpoint,
  listCheckpoints,
  checkpointSummary,
  CheckpointEntry,
} from "./checkpoint";
import {
  serializeCheckpointStore,
  deserializeCheckpointStore,
  saveCheckpointStore,
  loadCheckpointStore,
} from "./checkpoint.persist";

function makeEntry(url: string, overrides: Partial<CheckpointEntry> = {}): CheckpointEntry {
  return {
    id: `id-${url}`,
    url,
    lastCheckedAt: 1000,
    consecutiveFailures: 0,
    lastStatus: 200,
    lastLatencyMs: 120,
    ...overrides,
  };
}

describe("checkpoint store", () => {
  let store = createCheckpointStore();

  beforeEach(() => {
    store = createCheckpointStore();
  });

  it("starts empty", () => {
    expect(listCheckpoints(store)).toHaveLength(0);
    expect(store.savedAt).toBeNull();
  });

  it("upserts and retrieves an entry", () => {
    const entry = makeEntry("https://api.example.com/health");
    upsertCheckpoint(store, entry);
    expect(getCheckpoint(store, entry.url)).toEqual(entry);
  });

  it("overwrites an existing entry", () => {
    upsertCheckpoint(store, makeEntry("https://a.com", { consecutiveFailures: 1 }));
    upsertCheckpoint(store, makeEntry("https://a.com", { consecutiveFailures: 5 }));
    expect(getCheckpoint(store, "https://a.com")?.consecutiveFailures).toBe(5);
  });

  it("removes an entry", () => {
    upsertCheckpoint(store, makeEntry("https://b.com"));
    expect(removeCheckpoint(store, "https://b.com")).toBe(true);
    expect(getCheckpoint(store, "https://b.com")).toBeUndefined();
  });

  it("returns false when removing non-existent entry", () => {
    expect(removeCheckpoint(store, "https://nope.com")).toBe(false);
  });

  it("lists all entries", () => {
    upsertCheckpoint(store, makeEntry("https://x.com"));
    upsertCheckpoint(store, makeEntry("https://y.com"));
    expect(listCheckpoints(store)).toHaveLength(2);
  });

  it("summarizes the store", () => {
    upsertCheckpoint(store, makeEntry("https://z.com"));
    const summary = checkpointSummary(store);
    expect(summary).toContain("1 endpoint(s)");
    expect(summary).toContain("never");
  });
});

describe("checkpoint persistence", () => {
  it("round-trips through serialize/deserialize", () => {
    const store = createCheckpointStore();
    upsertCheckpoint(store, makeEntry("https://api.test/ping", { consecutiveFailures: 3 }));
    const json = serializeCheckpointStore(store);
    const restored = deserializeCheckpointStore(json);
    expect(listCheckpoints(restored)).toHaveLength(1);
    expect(getCheckpoint(restored, "https://api.test/ping")?.consecutiveFailures).toBe(3);
  });

  it("returns empty store for invalid JSON", () => {
    const store = deserializeCheckpointStore("not-json{{");
    expect(listCheckpoints(store)).toHaveLength(0);
  });

  it("saves and loads from disk", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "checkpoint-"));
    const filePath = path.join(tmpDir, "state", "checkpoint.json");
    const store = createCheckpointStore();
    upsertCheckpoint(store, makeEntry("https://disk.test/health"));
    saveCheckpointStore(store, filePath);
    expect(store.savedAt).not.toBeNull();
    const loaded = loadCheckpointStore(filePath);
    expect(getCheckpoint(loaded, "https://disk.test/health")).toBeDefined();
  });

  it("returns empty store when file does not exist", () => {
    const store = loadCheckpointStore("/tmp/does-not-exist-checkpoint.json");
    expect(listCheckpoints(store)).toHaveLength(0);
  });
});
