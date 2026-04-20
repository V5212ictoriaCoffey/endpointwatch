import {
  createTraceStore,
  startTrace,
  endTrace,
  getTrace,
  activeTraces,
  traceSummary,
  generateId,
} from "./traceid";

describe("generateId", () => {
  it("returns hex string of correct length", () => {
    expect(generateId(8)).toHaveLength(16);
    expect(generateId(16)).toHaveLength(32);
  });

  it("generates unique ids", () => {
    expect(generateId()).not.toBe(generateId());
  });
});

describe("createTraceStore", () => {
  it("creates empty store", () => {
    const s = createTraceStore();
    expect(s.active.size).toBe(0);
    expect(s.completed).toHaveLength(0);
  });
});

describe("startTrace / endTrace", () => {
  it("adds and removes from active", () => {
    const s = createTraceStore();
    const ctx = startTrace(s);
    expect(s.active.has(ctx.traceId)).toBe(true);
    endTrace(s, ctx.traceId);
    expect(s.active.has(ctx.traceId)).toBe(false);
    expect(s.completed).toHaveLength(1);
  });

  it("stores parentId when provided", () => {
    const s = createTraceStore();
    const ctx = startTrace(s, "parent-abc");
    expect(ctx.parentId).toBe("parent-abc");
  });

  it("caps completed at maxCompleted", () => {
    const s = createTraceStore(3);
    for (let i = 0; i < 5; i++) {
      const c = startTrace(s);
      endTrace(s, c.traceId);
    }
    expect(s.completed).toHaveLength(3);
  });

  it("returns undefined for unknown traceId", () => {
    const s = createTraceStore();
    expect(endTrace(s, "nope")).toBeUndefined();
  });
});

describe("getTrace", () => {
  it("finds active trace", () => {
    const s = createTraceStore();
    const ctx = startTrace(s);
    expect(getTrace(s, ctx.traceId)).toEqual(ctx);
  });

  it("finds completed trace", () => {
    const s = createTraceStore();
    const ctx = startTrace(s);
    endTrace(s, ctx.traceId);
    expect(getTrace(s, ctx.traceId)?.traceId).toBe(ctx.traceId);
  });
});

describe("activeTraces", () => {
  it("returns all active", () => {
    const s = createTraceStore();
    startTrace(s);
    startTrace(s);
    expect(activeTraces(s)).toHaveLength(2);
  });
});

describe("traceSummary", () => {
  it("formats summary string", () => {
    const s = createTraceStore(100);
    expect(traceSummary(s)).toContain("active=0");
    expect(traceSummary(s)).toContain("maxCompleted=100");
  });
});
