import {
  createCircuit,
  isCircuitOpen,
  recordSuccess,
  recordFailure,
  circuitSummary,
} from "./circuit";

describe("createCircuit", () => {
  it("defaults to closed state", () => {
    const c = createCircuit();
    expect(c.state).toBe("closed");
    expect(c.failures).toBe(0);
  });

  it("accepts custom options", () => {
    const c = createCircuit({ failureThreshold: 5 });
    expect(c.options.failureThreshold).toBe(5);
    expect(c.options.successThreshold).toBe(1);
  });
});

describe("recordFailure / isCircuitOpen", () => {
  it("opens after reaching failure threshold", () => {
    const c = createCircuit({ failureThreshold: 2 });
    recordFailure(c);
    expect(c.state).toBe("closed");
    recordFailure(c);
    expect(c.state).toBe("open");
    expect(isCircuitOpen(c)).toBe(true);
  });

  it("transitions to half-open after timeout", () => {
    const c = createCircuit({ failureThreshold: 1, timeout: 1000 });
    const past = Date.now() - 2000;
    recordFailure(c, past);
    c.openedAt = past;
    expect(isCircuitOpen(c, Date.now())).toBe(false);
    expect(c.state).toBe("half-open");
  });
});

describe("recordSuccess", () => {
  it("resets closed circuit failure count", () => {
    const c = createCircuit({ failureThreshold: 3 });
    recordFailure(c);
    recordFailure(c);
    recordSuccess(c);
    expect(c.failures).toBe(0);
    expect(c.state).toBe("closed");
  });

  it("closes circuit from half-open after success threshold", () => {
    const c = createCircuit({ failureThreshold: 1, successThreshold: 2 });
    recordFailure(c);
    c.state = "half-open";
    recordSuccess(c);
    expect(c.state).toBe("half-open");
    recordSuccess(c);
    expect(c.state).toBe("closed");
    expect(c.failures).toBe(0);
  });

  it("reopens on failure in half-open", () => {
    const c = createCircuit({ failureThreshold: 1 });
    c.state = "half-open";
    recordFailure(c);
    expect(c.state).toBe("open");
  });
});

describe("circuitSummary", () => {
  it("returns readable summary", () => {
    const c = createCircuit();
    expect(circuitSummary(c)).toBe("circuit=closed failures=0 successes=0");
  });
});
