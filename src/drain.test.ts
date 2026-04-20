import {
  createDrainStore,
  acquireDrain,
  releaseDrain,
  drainAll,
  isDraining,
  drainSummary,
} from "./drain";

describe("createDrainStore", () => {
  it("initializes with zero active and not draining", () => {
    const store = createDrainStore();
    expect(store.active).toBe(0);
    expect(store.draining).toBe(false);
  });
});

describe("acquireDrain / releaseDrain", () => {
  it("increments and decrements active count", () => {
    const store = createDrainStore();
    acquireDrain(store);
    acquireDrain(store);
    expect(store.active).toBe(2);
    releaseDrain(store);
    expect(store.active).toBe(1);
  });

  it("does not go below zero", () => {
    const store = createDrainStore();
    releaseDrain(store);
    expect(store.active).toBe(0);
  });

  it("does not acquire when draining", () => {
    const store = createDrainStore();
    store.draining = true;
    acquireDrain(store);
    expect(store.active).toBe(0);
  });
});

describe("drainAll", () => {
  it("resolves immediately when no active probes", async () => {
    const store = createDrainStore();
    await expect(drainAll(store, 1000)).resolves.toBeUndefined();
  });

  it("resolves when last probe releases", async () => {
    const store = createDrainStore();
    acquireDrain(store);
    acquireDrain(store);
    const p = drainAll(store, 1000);
    expect(isDraining(store)).toBe(true);
    releaseDrain(store);
    releaseDrain(store);
    await expect(p).resolves.toBeUndefined();
  });

  it("resolves on timeout if probes never finish", async () => {
    const store = createDrainStore();
    acquireDrain(store);
    await expect(drainAll(store, 20)).resolves.toBeUndefined();
  });
});

describe("drainSummary", () => {
  it("returns a readable summary string", () => {
    const store = createDrainStore();
    acquireDrain(store);
    const s = drainSummary(store);
    expect(s).toContain("active=1");
    expect(s).toContain("draining=false");
  });
});
