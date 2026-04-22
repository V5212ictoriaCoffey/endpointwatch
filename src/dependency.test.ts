import {
  createDependencyStore,
  addDependency,
  removeDependency,
  getUpstreams,
  getDownstreams,
  hasFailingUpstream,
  dependencySummary,
} from "./dependency";

describe("dependency", () => {
  it("starts empty", () => {
    const store = createDependencyStore();
    expect(store.edges).toHaveLength(0);
  });

  it("adds a dependency edge", () => {
    const store = createDependencyStore();
    addDependency(store, "https://a.example.com", "https://b.example.com");
    expect(store.edges).toHaveLength(1);
    expect(store.edges[0]).toEqual({
      upstream: "https://a.example.com",
      downstream: "https://b.example.com",
    });
  });

  it("does not add duplicate edges", () => {
    const store = createDependencyStore();
    addDependency(store, "https://a.example.com", "https://b.example.com");
    addDependency(store, "https://a.example.com", "https://b.example.com");
    expect(store.edges).toHaveLength(1);
  });

  it("removes a dependency edge", () => {
    const store = createDependencyStore();
    addDependency(store, "https://a.example.com", "https://b.example.com");
    removeDependency(store, "https://a.example.com", "https://b.example.com");
    expect(store.edges).toHaveLength(0);
  });

  it("returns upstreams for a url", () => {
    const store = createDependencyStore();
    addDependency(store, "https://a.example.com", "https://b.example.com");
    addDependency(store, "https://c.example.com", "https://b.example.com");
    const ups = getUpstreams(store, "https://b.example.com");
    expect(ups).toContain("https://a.example.com");
    expect(ups).toContain("https://c.example.com");
  });

  it("returns downstreams for a url", () => {
    const store = createDependencyStore();
    addDependency(store, "https://a.example.com", "https://b.example.com");
    addDependency(store, "https://a.example.com", "https://c.example.com");
    const downs = getDownstreams(store, "https://a.example.com");
    expect(downs).toContain("https://b.example.com");
    expect(downs).toContain("https://c.example.com");
  });

  it("detects a failing upstream", () => {
    const store = createDependencyStore();
    addDependency(store, "https://a.example.com", "https://b.example.com");
    const failing = new Set(["https://a.example.com"]);
    expect(hasFailingUpstream(store, "https://b.example.com", failing)).toBe(true);
  });

  it("returns false when no upstream is failing", () => {
    const store = createDependencyStore();
    addDependency(store, "https://a.example.com", "https://b.example.com");
    const failing = new Set<string>();
    expect(hasFailingUpstream(store, "https://b.example.com", failing)).toBe(false);
  });

  it("formats a summary", () => {
    const store = createDependencyStore();
    addDependency(store, "https://a.example.com", "https://b.example.com");
    const summary = dependencySummary(store);
    expect(summary).toContain("https://a.example.com -> https://b.example.com");
  });

  it("returns no-dependency message when empty", () => {
    const store = createDependencyStore();
    expect(dependencySummary(store)).toBe("No dependencies registered.");
  });
});
