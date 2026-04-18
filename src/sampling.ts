export interface SamplingOptions {
  rate: number; // 0.0 to 1.0
  seed?: number;
}

export interface SamplingStore {
  rate: number;
  count: number;
  sampled: number;
}

export function createSamplingStore(options: SamplingOptions): SamplingStore {
  return { rate: clampRate(options.rate), count: 0, sampled: 0 };
}

function clampRate(rate: number): number {
  return Math.min(1, Math.max(0, rate));
}

export function shouldSample(store: SamplingStore): boolean {
  store.count++;
  const sample = Math.random() < store.rate;
  if (sample) store.sampled++;
  return sample;
}

export function samplingStats(store: SamplingStore): {
  count: number;
  sampled: number;
  effectiveRate: number;
} {
  return {
    count: store.count,
    sampled: store.sampled,
    effectiveRate: store.count === 0 ? 0 : store.sampled / store.count,
  };
}

export function resetSampling(store: SamplingStore): void {
  store.count = 0;
  store.sampled = 0;
}

export function samplingSummary(store: SamplingStore): string {
  const { count, sampled, effectiveRate } = samplingStats(store);
  return `sampling: rate=${store.rate} sampled=${sampled}/${count} effective=${(effectiveRate * 100).toFixed(1)}%`;
}
