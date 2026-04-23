import {
  createDeadLetterStore,
  addDeadLetter,
  removeDeadLetter,
  getDeadLetters,
  clearDeadLetters,
  deadLetterSummary,
  DeadLetterStore,
} from "./deadletter";

function makeStore(): DeadLetterStore {
  return createDeadLetterStore();
}

describe("createDeadLetterStore", () => {
  it("starts empty", () => {
    const store = makeStore();
    expect(store.entries.size).toBe(0);
  });
});

describe("addDeadLetter", () => {
  it("adds a new entry with attempt count of 1", () => {
    const store = makeStore();
    const entry = addDeadLetter(store, "https://example.com", { foo: 1 }, "timeout");
    expect(entry.attempts).toBe(1);
    expect(entry.url).toBe("https://example.com");
    expect(entry.reason).toBe("timeout");
    expect(store.entries.size).toBe(1);
  });

  it("increments attempts when same id is re-added", () => {
    const store = makeStore();
    const first = addDeadLetter(store, "https://example.com", {}, "err");
    const second = addDeadLetter(store, "https://example.com", {}, "err2", first.id);
    expect(second.attempts).toBe(2);
    expect(second.firstFailedAt).toBe(first.firstFailedAt);
    expect(store.entries.size).toBe(1);
  });

  it("preserves firstFailedAt across retries", () => {
    const store = makeStore();
    const first = addDeadLetter(store, "https://a.io", {}, "x");
    const second = addDeadLetter(store, "https://a.io", {}, "x", first.id);
    expect(second.firstFailedAt).toBe(first.firstFailedAt);
  });
});

describe("removeDeadLetter", () => {
  it("removes an existing entry", () => {
    const store = makeStore();
    const entry = addDeadLetter(store, "https://b.io", {}, "fail");
    const removed = removeDeadLetter(store, entry.id);
    expect(removed).toBe(true);
    expect(store.entries.size).toBe(0);
  });

  it("returns false for unknown id", () => {
    const store = makeStore();
    expect(removeDeadLetter(store, "nonexistent")).toBe(false);
  });
});

describe("getDeadLetters", () => {
  it("returns entries sorted by lastFailedAt descending", () => {
    const store = makeStore();
    addDeadLetter(store, "https://first.io", {}, "a");
    addDeadLetter(store, "https://second.io", {}, "b");
    const entries = getDeadLetters(store);
    expect(entries.length).toBe(2);
    expect(entries[0].lastFailedAt).toBeGreaterThanOrEqual(entries[1].lastFailedAt);
  });
});

describe("clearDeadLetters", () => {
  it("empties the store", () => {
    const store = makeStore();
    addDeadLetter(store, "https://c.io", {}, "err");
    clearDeadLetters(store);
    expect(store.entries.size).toBe(0);
  });
});

describe("deadLetterSummary", () => {
  it("reports empty when no entries", () => {
    const store = makeStore();
    expect(deadLetterSummary(store)).toBe("dead-letter: empty");
  });

  it("reports count and max attempts", () => {
    const store = makeStore();
    const e = addDeadLetter(store, "https://d.io", {}, "x");
    addDeadLetter(store, "https://d.io", {}, "x", e.id);
    addDeadLetter(store, "https://e.io", {}, "y");
    const summary = deadLetterSummary(store);
    expect(summary).toContain("2 entries");
    expect(summary).toContain("max attempts: 2");
  });
});
