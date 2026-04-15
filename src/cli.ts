#!/usr/bin/env node
import * as path from 'path';
import { loadConfig, applyDefaults } from './config';
import { startScheduler } from './scheduler';
import { printSummary } from './summary';
import { createStore, getEntries } from './history';
import { writeReport } from './reporter';

const args = process.argv.slice(2);

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        result[key] = next;
        i++;
      } else {
        result[key] = true;
      }
    }
  }
  return result;
}

async function main() {
  const flags = parseArgs(args);

  if (flags['help'] || flags['h']) {
    console.log(`
endpointwatch — REST API uptime & latency monitor

Usage:
  endpointwatch [options]

Options:
  --config <path>   Path to config file (default: endpointwatch.json)
  --once            Run checks once and exit
  --report <path>   Write report to file after run
  --format <fmt>    Report format: json | csv (default: json)
  --help            Show this help message
`);
    process.exit(0);
  }

  const configPath = typeof flags['config'] === 'string'
    ? path.resolve(flags['config'])
    : path.resolve(process.cwd(), 'endpointwatch.json');

  let config;
  try {
    config = applyDefaults(await loadConfig(configPath));
  } catch (err) {
    console.error(`Failed to load config from ${configPath}:`, (err as Error).message);
    process.exit(1);
  }

  const store = createStore();
  const reportPath = typeof flags['report'] === 'string' ? flags['report'] : undefined;
  const format = typeof flags['format'] === 'string' ? flags['format'] : 'json';

  if (flags['once']) {
    const { runOnce } = await import('./scheduler');
    const results = await runOnce(config, store);
    printSummary(results);
    if (reportPath) {
      const entries = getEntries(store);
      await writeReport(entries, reportPath, format as 'json' | 'csv');
      console.log(`Report written to ${reportPath}`);
    }
    process.exit(0);
  }

  startScheduler(config, store);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
