import { TraceStore, TraceContext, startTrace, endTrace } from "./traceid";
import { TraceConfig } from "./traceid.config";

export interface TraceRequest {
  headers: Record<string, string | undefined>;
  url: string;
}

export interface TraceResult {
  ctx: TraceContext;
  durationMs: number;
  url: string;
}

export function extractParentId(
  req: TraceRequest,
  cfg: TraceConfig
): string | undefined {
  if (!cfg.propagate) return undefined;
  return req.headers[cfg.headerName] ?? req.headers[cfg.headerName.toLowerCase()];
}

export function injectTraceHeader(
  headers: Record<string, string>,
  ctx: TraceContext,
  cfg: TraceConfig
): Record<string, string> {
  if (!cfg.propagate) return headers;
  return { ...headers, [cfg.headerName]: ctx.traceId };
}

export function withTrace(
  store: TraceStore,
  cfg: TraceConfig,
  req: TraceRequest,
  fn: (ctx: TraceContext, headers: Record<string, string>) => Promise<void>
): Promise<TraceResult> {
  if (!cfg.enabled) {
    return fn({ traceId: "", spanId: "", startedAt: Date.now() }, {}).then(() => ({
      ctx: { traceId: "", spanId: "", startedAt: Date.now() },
      durationMs: 0,
      url: req.url,
    }));
  }
  const parentId = extractParentId(req, cfg);
  const ctx = startTrace(store, parentId);
  const outHeaders = injectTraceHeader({}, ctx, cfg);
  return fn(ctx, outHeaders).then(() => {
    endTrace(store, ctx.traceId);
    return { ctx, durationMs: Date.now() - ctx.startedAt, url: req.url };
  });
}
