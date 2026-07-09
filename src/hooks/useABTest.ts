'use client';

import { useState, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Experiment<V extends string = string> {
  /** Unique experiment key (used for storage & analytics). */
  key: string;
  /** Ordered list of variant names. Must have ≥ 2 entries. */
  variants: readonly [V, ...V[]];
  /**
   * Weights for each variant (must sum to 1). Defaults to equal distribution.
   * Length must match `variants`.
   */
  weights?: number[];
}

// ---------------------------------------------------------------------------
// Deterministic variant assignment
// ---------------------------------------------------------------------------

/**
 * cyrb53 — a fast 53-bit hash with strong avalanche properties.
 * Replaces the previous Java-style (multiplier=31) hash, which clustered
 * short, similar-prefix strings (e.g. `weighted_exp:user_0` ...
 * `weighted_exp:user_199`) all into the same output bucket, breaking the
 * weighted-distribution guarantee of useABTest.
 *
 * Reference: https://stackoverflow.com/a/52171480 (Bryc)
 */
function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

const HASH_SPACE = 0x100000000; // 2^32

function hashToIndex(seed: string, length: number): number {
  return (cyrb53(seed) % HASH_SPACE) % length;
}

function weightedIndex(weights: number[], random: number): number {
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (random < cumulative) return i;
  }
  return weights.length - 1;
}

const STORAGE_KEY_PREFIX = 'peerx_ab_';
const USER_ID_KEY = 'peerx_ab_uid';

function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let uid = localStorage.getItem(USER_ID_KEY);
  if (!uid) {
    uid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(USER_ID_KEY, uid);
  }
  return uid;
}

function assignVariant<V extends string>(experiment: Experiment<V>): V {
  const uid = getOrCreateUserId();
  const seed = `${experiment.key}:${uid}`;

  if (experiment.weights) {
    // Weighted: convert 32-bit hash slice to [0,1) then bucket by weight
    const normalized = (cyrb53(seed) % HASH_SPACE) / 0xffffffff;
    const idx = weightedIndex(experiment.weights, normalized);
    return experiment.variants[idx];
  }

  const idx = hashToIndex(seed, experiment.variants.length);
  return experiment.variants[idx];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseABTestResult<V extends string> {
  variant: V | null;
  /** true while the variant hasn't been determined yet (SSR / first render) */
  isLoading: boolean;
}

/**
 * Assigns the current user to a variant for the given experiment.
 *
 * Assignments are deterministic and persisted in localStorage so the same
 * user always sees the same variant. Experiments can be paused by removing
 * them from the running set without a code deploy — just stop rendering
 * whichever variant corresponds to the paused state.
 *
 * @example
 * const { variant } = useABTest({ key: 'hero_headline', variants: ['control', 'variant_a'] });
 */
export function useABTest<V extends string>(
  experiment: Experiment<V>
): UseABTestResult<V> {
  const [variant, setVariant] = useState<V | null>(null);

  useEffect(() => {
    const storageKey = `${STORAGE_KEY_PREFIX}${experiment.key}`;
    const stored = localStorage.getItem(storageKey) as V | null;

    if (stored && (experiment.variants as readonly string[]).includes(stored)) {
      setVariant(stored);
      return;
    }

    const assigned = assignVariant(experiment);
    localStorage.setItem(storageKey, assigned);
    setVariant(assigned);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experiment.key]);

  return { variant, isLoading: variant === null };
}
