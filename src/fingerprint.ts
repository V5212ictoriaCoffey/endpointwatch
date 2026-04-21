/**
 * fingerprint.ts
 * Generates stable fingerprints for alert deduplication and grouping.
 * A fingerprint is a short hash derived from url, status, and alertLevel.
 */

import { createHash } from "crypto";

export interface FingerprintInput {
  url: string;
  status?: number;
  alertLevel?: string;
  tags?: string[];
}

export interface FingerprintEntry {
  fingerprint: string;
  input: FingerprintInput;
  createdAt: number;
}

export function computeFingerprint(input: FingerprintInput): string {
  const parts = [
    input.url,
    String(input.status ?? ""),
    input.alertLevel ?? "",
    (input.tags ?? []).slice().sort().join(","),
  ];
  return createHash("sha256")
    .update(parts.join("|"))
    .digest("hex")
    .slice(0, 16);
}

export interface FingerprintStore {
  entries: Map<string, FingerprintEntry>;
}

export function createFingerprintStore(): FingerprintStore {
  return { entries: new Map() };
}

export function recordFingerprint(
  store: FingerprintStore,
  input: FingerprintInput
): string {
  const fp = computeFingerprint(input);
  if (!store.entries.has(fp)) {
    store.entries.set(fp, { fingerprint: fp, input, createdAt: Date.now() });
  }
  return fp;
}

export function resolveFingerprint(
  store: FingerprintStore,
  fingerprint: string
): FingerprintEntry | undefined {
  return store.entries.get(fingerprint);
}

export function clearFingerprint(
  store: FingerprintStore,
  fingerprint: string
): boolean {
  return store.entries.delete(fingerprint);
}

export function fingerprintSummary(store: FingerprintStore): string {
  const count = store.entries.size;
  return `FingerprintStore: ${count} unique fingerprint(s) tracked`;
}
