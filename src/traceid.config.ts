export interface TraceConfig {
  enabled: boolean;
  maxCompleted: number;
  headerName: string;
  propagate: boolean;
}

const defaults: TraceConfig = {
  enabled: true,
  maxCompleted: 500,
  headerName: "x-trace-id",
  propagate: true,
};

export function parseTraceConfig(raw: Record<string, unknown>): Partial<TraceConfig> {
  const cfg: Partial<TraceConfig> = {};
  if (typeof raw.enabled === "boolean") cfg.enabled = raw.enabled;
  if (typeof raw.maxCompleted === "number" && raw.maxCompleted > 0) cfg.maxCompleted = raw.maxCompleted;
  if (typeof raw.headerName === "string" && raw.headerName.length > 0) cfg.headerName = raw.headerName;
  if (typeof raw.propagate === "boolean") cfg.propagate = raw.propagate;
  return cfg;
}

export function applyTraceDefaults(partial: Partial<TraceConfig>): TraceConfig {
  return { ...defaults, ...partial };
}

export function traceConfigSummary(cfg: TraceConfig): string {
  return `enabled=${cfg.enabled} header=${cfg.headerName} propagate=${cfg.propagate} maxCompleted=${cfg.maxCompleted}`;
}
