/**
 * Persistence helpers for CheckpointStore — read/write JSON to disk.
 */

import fs from "fs";
import path from "path";
import {
  CheckpointStore,
  CheckpointEntry,
  createCheckpointStore,
  markSaved,
} from "./checkpoint";

interface SerializedStore {
  savedAt: number | null;
  entries: CheckpointEntry[];
}

export function serializeCheckpointStore(store: CheckpointStore): string {
  const payload: SerializedStore = {
    savedAt: store.savedAt,
    entries: Array.from(store.entries.values()),
  };
  return JSON.stringify(payload, null, 2);
}

export function deserializeCheckpointStore(raw: string): CheckpointStore {
  const store = createCheckpointStore();
  try {
    const parsed: SerializedStore = JSON.parse(raw);
    store.savedAt = parsed.savedAt ?? null;
    for (const entry of parsed.entries ?? []) {
      store.entries.set(entry.url, entry);
    }
  } catch {
    // return empty store on parse failure
  }
  return store;
}

export function saveCheckpointStore(
  store: CheckpointStore,
  filePath: string
): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, serializeCheckpointStore(store), "utf-8");
  markSaved(store);
}

export function loadCheckpointStore(filePath: string): CheckpointStore {
  if (!fs.existsSync(filePath)) {
    return createCheckpointStore();
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return deserializeCheckpointStore(raw);
}
