import { parseTraceConfig, applyTraceDefaults, traceConfigSummary } from "./traceid.config";

describe("parseTraceConfig", () => {
  it("returns empty object for empty input", () => {
    expect(parseTraceConfig({})).toEqual({});
  });

  it("parses enabled flag", () => {
    expect(parseTraceConfig({ enabled: false })).toMatchObject({ enabled: false });
  });

  it("parses maxCompleted", () => {
    expect(parseTraceConfig({ maxCompleted: 200 })).toMatchObject({ maxCompleted: 200 });
  });

  it("ignores non-positive maxCompleted", () => {
    expect(parseTraceConfig({ maxCompleted: 0 })).not.toHaveProperty("maxCompleted");
    expect(parseTraceConfig({ maxCompleted: -1 })).not.toHaveProperty("maxCompleted");
  });

  it("parses headerName", () => {
    expect(parseTraceConfig({ headerName: "x-req-id" })).toMatchObject({ headerName: "x-req-id" });
  });

  it("ignores empty headerName", () => {
    expect(parseTraceConfig({ headerName: "" })).not.toHaveProperty("headerName");
  });

  it("parses propagate", () => {
    expect(parseTraceConfig({ propagate: false })).toMatchObject({ propagate: false });
  });
});

describe("applyTraceDefaults", () => {
  it("fills in defaults", () => {
    const cfg = applyTraceDefaults({});
    expect(cfg.enabled).toBe(true);
    expect(cfg.maxCompleted).toBe(500);
    expect(cfg.headerName).toBe("x-trace-id");
    expect(cfg.propagate).toBe(true);
  });

  it("overrides with provided values", () => {
    const cfg = applyTraceDefaults({ maxCompleted: 100, propagate: false });
    expect(cfg.maxCompleted).toBe(100);
    expect(cfg.propagate).toBe(false);
  });
});

describe("traceConfigSummary", () => {
  it("includes key fields", () => {
    const cfg = applyTraceDefaults({});
    const s = traceConfigSummary(cfg);
    expect(s).toContain("enabled=true");
    expect(s).toContain("header=x-trace-id");
    expect(s).toContain("propagate=true");
  });
});
