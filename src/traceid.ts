import { randomBytes } from "crypto";

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentId?: string;
  startedAt: number;
}

export interface TraceStore {
  active: Map<string, TraceContext>;
  completed: TraceContext[];
  maxCompleted: number;
}

export function createTraceStore(maxCompleted = 500): TraceStore {
  return { active: new Map(), completed: [], maxCompleted };
}

export function generateId(bytes = 8): string {
  return randomBytes(bytes).toString("hex");
}

export function startTrace(store: TraceStore, parentId?: string): TraceContext {
  const ctx: TraceContext = {
    traceId: generateId(16),
    spanId: generateId(8),
    parentId,
    startedAt: Date.now(),
  };
  store.active.set(ctx.traceId, ctx);
  return ctx;
}

export function endTrace(store: TraceStore, traceId: string): TraceContext | undefined {
  const ctx = store.active.get(traceId);
  if (!ctx) return undefined;
  store.active.delete(traceId);
  store.completed.push(ctx);
  if (store.completed.length > store.maxCompleted) {
    store.completed.splice(0, store.completed.length - store.maxCompleted);
  }
  return ctx;
}

export function getTrace(store: TraceStore, traceId: string): TraceContext | undefined {
  return store.active.get(traceId) ?? store.completed.find((c) => c.traceId === traceId);
}

export function activeTraces(store: TraceStore): TraceContext[] {
  return Array.from(store.active.values());
}

export function traceSummary(store: TraceStore): string {
  return `active=${store.active.size} completed=${store.completed.length} maxCompleted=${store.maxCompleted}`;
}
