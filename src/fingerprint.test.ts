import {
  computeFingerprint,
  createFingerprintStore,
  recordFingerprint,
  resolveFingerprint,
  clearFingerprint,
  fingerprintSummary,
  FingerprintInput,
} from "./fingerprint";

function makeInput(overrides: Partial<FingerprintInput> = {}): FingerprintInput {
  return {
    url: "https://example.com/api/health",
    status: 500,
    alertLevel: "critical",
    tags: ["prod", "api"],
    ...overrides,
  };
}

describe("computeFingerprint", () => {
  it("returns a 16-char hex string", () => {
    const fp = computeFingerprint(makeInput());
    expect(fp).toHaveLength(16);
    expect(fp).toMatch(/^[0-9a-f]+$/);
  });

  it("is stable for the same input", () => {
    const a = computeFingerprint(makeInput());
    const b = computeFingerprint(makeInput());
    expect(a).toBe(b);
  });

  it("differs when url changes", () => {
    const a = computeFingerprint(makeInput({ url: "https://a.com" }));
    const b = computeFingerprint(makeInput({ url: "https://b.com" }));
    expect(a).not.toBe(b);
  });

  it("is tag-order independent", () => {
    const a = computeFingerprint(makeInput({ tags: ["api", "prod"] }));
    const b = computeFingerprint(makeInput({ tags: ["prod", "api"] }));
    expect(a).toBe(b);
  });

  it("handles missing optional fields", () => {
    const fp = computeFingerprint({ url: "https://example.com" });
    expect(fp).toHaveLength(16);
  });
});

describe("FingerprintStore", () => {
  it("records and resolves a fingerprint", () => {
    const store = createFingerprintStore();
    const input = makeInput();
    const fp = recordFingerprint(store, input);
    const entry = resolveFingerprint(store, fp);
    expect(entry).toBeDefined();
    expect(entry!.fingerprint).toBe(fp);
    expect(entry!.input.url).toBe(input.url);
  });

  it("does not duplicate entries for the same input", () => {
    const store = createFingerprintStore();
    const input = makeInput();
    recordFingerprint(store, input);
    recordFingerprint(store, input);
    expect(store.entries.size).toBe(1);
  });

  it("clears a fingerprint", () => {
    const store = createFingerprintStore();
    const fp = recordFingerprint(store, makeInput());
    expect(clearFingerprint(store, fp)).toBe(true);
    expect(resolveFingerprint(store, fp)).toBeUndefined();
  });

  it("returns false when clearing unknown fingerprint", () => {
    const store = createFingerprintStore();
    expect(clearFingerprint(store, "nonexistent")).toBe(false);
  });

  it("fingerprintSummary reports count", () => {
    const store = createFingerprintStore();
    recordFingerprint(store, makeInput({ url: "https://a.com" }));
    recordFingerprint(store, makeInput({ url: "https://b.com" }));
    const summary = fingerprintSummary(store);
    expect(summary).toContain("2");
  });
});
