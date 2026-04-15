import { loadConfig, applyDefaults } from './config';
import { checkEndpoint } from './monitor';
import { evaluateAll } from './alerting';
import { addEntry, createStore } from './history';
import { summarizeAll, printSummary } from './summary';
import { writeReport } from './reporter';

export interface SchedulerOptions {
  configPath: string;
  outputFormat?: 'json' | 'csv';
  outputPath?: string;
  verbose?: boolean;
}

export interface SchedulerHandle {
  stop: () => void;
}

export async function runOnce(options: SchedulerOptions): Promise<void> {
  const raw = await loadConfig(options.configPath);
  const config = applyDefaults(raw);
  const store = createStore();

  for (const endpoint of config.endpoints) {
    const result = await checkEndpoint(endpoint);
    addEntry(store, endpoint.url, result);

    const alerts = evaluateAll([result], config.alerting);
    if (options.verbose && alerts.length > 0) {
      for (const alert of alerts) {
        console.warn(`[ALERT] ${alert.url}: ${alert.reason}`);
      }
    }
  }

  const summaries = summarizeAll(store, config.endpoints.map(e => e.url));

  if (options.verbose) {
    printSummary(summaries);
  }

  if (options.outputPath) {
    await writeReport(summaries, options.outputFormat ?? 'json', options.outputPath);
  }
}

export function startScheduler(
  options: SchedulerOptions,
  intervalMs: number
): SchedulerHandle {
  let active = true;

  const tick = async () => {
    if (!active) return;
    try {
      await runOnce(options);
    } catch (err) {
      console.error('[scheduler] error during run:', err);
    }
    if (active) {
      setTimeout(tick, intervalMs);
    }
  };

  setTimeout(tick, 0);

  return {
    stop: () => {
      active = false;
    },
  };
}
