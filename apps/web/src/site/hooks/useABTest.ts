
import { useState, useEffect } from "react";

export interface ABTestVariant {
  readonly id: string;
  readonly weight: number;
}

export interface ABTest {
  readonly id: string;
  readonly variants: readonly ABTestVariant[];
}

const AB_STORAGE_KEY = "itoby-ab-tests";

function getStoredVariants(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(AB_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function storeVariant(testId: string, variantId: string) {
  if (typeof window === "undefined") return;
  const stored = getStoredVariants();
  stored[testId] = variantId;
  localStorage.setItem(AB_STORAGE_KEY, JSON.stringify(stored));
}

function pickVariant(variants: readonly ABTestVariant[]): string {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (const v of variants) {
    cumulative += v.weight;
    if (rand <= cumulative) return v.id;
  }
  return variants[variants.length - 1].id;
}

export function useABTest(test: ABTest): string {
  const [variant, setVariant] = useState<string>(test.variants[0].id);

  useEffect(() => {
    const stored = getStoredVariants();
    if (stored[test.id]) {
      setVariant(stored[test.id]);
    } else {
      const picked = pickVariant(test.variants);
      storeVariant(test.id, picked);
      setVariant(picked);
    }
  }, [test.id, test.variants]);

  return variant;
}

// Predefined tests
export const AB_TESTS = {
  heroCtaText: {
    id: "hero-cta-text",
    variants: [
      { id: "original", weight: 50 },
      { id: "variant-b", weight: 50 },
    ],
  },
  ctaSectionStyle: {
    id: "cta-section-style",
    variants: [
      { id: "original", weight: 50 },
      { id: "variant-b", weight: 50 },
    ],
  },
} as const;
