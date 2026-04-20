import {
  createRetryBudgetStore,
  consumeRetry,
  retryBudgetRemaining,
  resetRetryBudget,
  retryBudgetSummary,
} from "./retrybudget";

const URL = "https://api.example.com/health";

describe("createRetryBudgetStore", () => {
  it("initializes with empty budgets", () => {
    const store = createRetryBudgetStore({ maxRetries: 3, windowMs: 60_000 });
    expect(store.budgets.size).toBe(0);
    expect(store.options.maxRetries).toBe(3);
  });
});

describe("consumeRetry", () => {
  it("allows retries within budget", () => {
    const store = createRetryBudgetStore({ maxRetries: 3, windowMs: 60_000 });
    expect(consumeRetry(store, URL)).toBe(true);
    expect(consumeRetry(store, URL)).toBe(true);
    expect(consumeRetry(store, URL)).toBe(true);
  });

  it("denies retry when budget is exhausted", () => {
    const store = createRetryBudgetStore({ maxRetries: 2, windowMs: 60_000 });
    consumeRetry(store, URL);
    consumeRetry(store, URL);
    expect(consumeRetry(store, URL)).toBe(false);
  });

  it("tracks budgets independently per url", () => {
    const store = createRetryBudgetStore({ maxRetries: 1, windowMs: 60_000 });
    const url2 = "https://api.example.com/status";
    expect(consumeRetry(store, URL)).toBe(true);
    expect(consumeRetry(store, url2)).toBe(true);
    expect(consumeRetry(store, URL)).toBe(false);
    expect(consumeRetry(store, url2)).toBe(false);
  });

  it("allows retry after window expires", () => {
    const store = createRetryBudgetStore({ maxRetries: 1, windowMs: 1 });
    consumeRetry(store, URL);
    return new Promise<void>(resolve =>
      setTimeout(() => {
        expect(consumeRetry(store, URL)).toBe(true);
        resolve();
      }, 10)
    );
  });
});

describe("retryBudgetRemaining", () => {
  it("returns full budget for unknown url", () => {
    const store = createRetryBudgetStore({ maxRetries: 5, windowMs: 60_000 });
    expect(retryBudgetRemaining(store, URL)).toBe(5);
  });

  it("decrements after each consume", () => {
    const store = createRetryBudgetStore({ maxRetries: 3, windowMs: 60_000 });
    consumeRetry(store, URL);
    expect(retryBudgetRemaining(store, URL)).toBe(2);
  });
});

describe("resetRetryBudget", () => {
  it("clears usage for a url", () => {
    const store = createRetryBudgetStore({ maxRetries: 2, windowMs: 60_000 });
    consumeRetry(store, URL);
    consumeRetry(store, URL);
    resetRetryBudget(store, URL);
    expect(retryBudgetRemaining(store, URL)).toBe(2);
  });
});

describe("retryBudgetSummary", () => {
  it("returns active retry counts per url", () => {
    const store = createRetryBudgetStore({ maxRetries: 5, windowMs: 60_000 });
    consumeRetry(store, URL);
    consumeRetry(store, URL);
    const summary = retryBudgetSummary(store);
    expect(summary[URL]).toBe(2);
  });
});
