import {
  createDebounceStore,
  recordEvent,
  isSuppressed,
  clearDebounce,
  clearAllDebounce,
  pruneExpiredDebounce,
  debounceSummary,
} from "./debounce";

const URL_A = "https://api.example.com/health";
const URL_B = "https://api.example.com/status";

describe("createDebounceStore", () => {
  it("creates an empty store with the given options", () => {
    const store = createDebounceStore({ windowMs: 5000 });
    expect(store.entries.size).toBe(0);
    expect(store.options.windowMs).toBe(5000);
  });
});

describe("recordEvent", () => {
  it("creates a new entry on first event", () => {
    const store = createDebounceStore({ windowMs: 5000 });
    const entry = recordEvent(store, URL_A, 1000);
    expect(entry.url).toBe(URL_A);
    expect(entry.count).toBe(1);
    expect(entry.suppressed).toBe(false);
  });

  it("increments count on subsequent events within the window", () => {
    const store = createDebounceStore({ windowMs: 5000 });
    recordEvent(store, URL_A, 1000);
    const entry = recordEvent(store, URL_A, 2000);
    expect(entry.count).toBe(2);
    expect(entry.suppressed).toBe(true);
  });

  it("marks entry as not suppressed after window expires", () => {
    const store = createDebounceStore({ windowMs: 5000 });
    recordEvent(store, URL_A, 1000);
    const entry = recordEvent(store, URL_A, 7000);
    expect(entry.suppressed).toBe(false);
  });
});

describe("isSuppressed", () => {
  it("returns false for unknown url", () => {
    const store = createDebounceStore({ windowMs: 5000 });
    expect(isSuppressed(store, URL_A, 1000)).toBe(false);
  });

  it("returns true within window", () => {
    const store = createDebounceStore({ windowMs: 5000 });
    recordEvent(store, URL_A, 1000);
    expect(isSuppressed(store, URL_A, 3000)).toBe(true);
  });

  it("returns false after window expires", () => {
    const store = createDebounceStore({ windowMs: 5000 });
    recordEvent(store, URL_A, 1000);
    expect(isSuppressed(store, URL_A, 7000)).toBe(false);
  });
});

describe("clearDebounce", () => {
  it("removes a single entry", () => {
    const store = createDebounceStore({ windowMs: 5000 });
    recordEvent(store, URL_A, 1000);
    clearDebounce(store, URL_A);
    expect(store.entries.has(URL_A)).toBe(false);
  });
});

describe("clearAllDebounce", () => {
  it("clears all entries", () => {
    const store = createDebounceStore({ windowMs: 5000 });
    recordEvent(store, URL_A, 1000);
    recordEvent(store, URL_B, 1000);
    clearAllDebounce(store);
    expect(store.entries.size).toBe(0);
  });
});

describe("pruneExpiredDebounce", () => {
  it("removes entries outside the window and returns count", () => {
    const store = createDebounceStore({ windowMs: 5000 });
    recordEvent(store, URL_A, 1000);
    recordEvent(store, URL_B, 8000);
    const pruned = pruneExpiredDebounce(store, 9000);
    expect(pruned).toBe(1);
    expect(store.entries.has(URL_A)).toBe(false);
    expect(store.entries.has(URL_B)).toBe(true);
  });
});

describe("debounceSummary", () => {
  it("returns a readable summary string", () => {
    const store = createDebounceStore({ windowMs: 3000 });
    recordEvent(store, URL_A, 1000);
    recordEvent(store, URL_A, 1500);
    const summary = debounceSummary(store);
    expect(summary).toContain("debounce:");
    expect(summary).toContain("windowMs=3000");
  });
});
