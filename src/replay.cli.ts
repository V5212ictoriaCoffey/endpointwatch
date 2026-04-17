import { createStore, addEntry } from './history';
import { replayEntries, formatReplay, ReplayOptions } from './replay';
import { parseReplayConfig, applyReplayDefaults } from './replay.config';

export interface ReplayCLIArgs {
  from?: string;
  to?: string;
  limit?: string;
  url?: string;
  json?: boolean;
}

export function parseReplayCLIArgs(argv: string[]): ReplayCL: ReplayCLIArgs = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--from') args.from = argv[++i];
    else if (argv[i] === '--to') args.to = argv[++i];
    else if (argv[i] === '--limit') args.limit = argv[++i];
    else if (argv[i] === '--url') args.url = argv[++i];
    else if (argv[i] === '--json') args.json = true;
  }
  return args;
}

export function buildReplayOptions(args: ReplayCLIArgs): ReplayOptions {
  const raw: Record<string, unknown> = {};
  if (args.from) raw.from = args.from;
  if (args.to) raw.to = args.to;
  if (args.limit) raw.limit = parseInt(args.limit, 10);
  if (args.url) raw.endpointUrl = args.url;
  const config = parseReplayConfig(raw);
  return applyReplayDefaults(config);
}

export function runReplayCLI(
  store: ReturnType<typeof createStore>,
  argv: string[]
): string {
  const args = parseReplayCLIArgs(argv);
  const options = buildReplayOptions(args);
  const result = replayEntries(store, options);

  if (args.json) {
    return JSON.stringify(result, null, 2);
  }

  return formatReplay(result);
}
