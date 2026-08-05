import type { AffinityMetric, ReceptorBinding } from "./types";

/**
 * Map a nanomolar constant onto a 0–100 relative score.
 * Ki 0.1 nM ≈ 100 · Ki 1 nM ≈ 80 · Ki 10 nM ≈ 60 · Ki 100 nM ≈ 40 · Ki 1 μM ≈ 20
 */
export function relativeAffinityFromNm(valueNm: number): number {
  if (!Number.isFinite(valueNm) || valueNm <= 0) return 50;
  const score = 20 * (5 - Math.log10(valueNm));
  return Math.max(5, Math.min(100, Math.round(score * 10) / 10));
}

/** pX = −log10(M) = 9 − log10(nM). */
export function pValueFromNm(valueNm: number): number {
  if (!Number.isFinite(valueNm) || valueNm <= 0) return 0;
  return 9 - Math.log10(valueNm);
}

export function formatAffinityNm(valueNm: number, metric: AffinityMetric = "Ki"): string {
  if (!Number.isFinite(valueNm) || valueNm <= 0) return "—";
  if (valueNm < 0.01) return `${metric} <0.01 nM`;
  if (valueNm < 1) return `${metric} ${valueNm.toPrecision(2)} nM`;
  if (valueNm < 10) return `${metric} ${valueNm.toFixed(2)} nM`;
  if (valueNm < 100) return `${metric} ${valueNm.toFixed(1)} nM`;
  if (valueNm < 1000) return `${metric} ${Math.round(valueNm)} nM`;
  if (valueNm < 1_000_000) {
    const uM = valueNm / 1000;
    return `${metric} ${uM < 10 ? uM.toFixed(2) : Math.round(uM)} μM`;
  }
  return `${metric} ${(valueNm / 1_000_000).toPrecision(2)} mM`;
}

export function formatPValue(valueNm: number, metric: AffinityMetric = "Ki"): string {
  const p = pValueFromNm(valueNm);
  if (p <= 0) return "—";
  const label =
    metric === "Kd"
      ? "pKd"
      : metric === "IC50" || metric === "pIC50"
        ? "pIC₅₀"
        : metric === "EC50"
          ? "pEC₅₀"
          : metric === "Kb"
            ? "pKb"
            : "pKi";
  return `${label} ${p.toFixed(2)}`;
}

/** Ensure every binding has relative affinity filled from valueNm. */
export function normalizeBinding(b: ReceptorBinding): ReceptorBinding {
  return {
    ...b,
    affinity: b.affinity ?? relativeAffinityFromNm(b.valueNm),
  };
}

export function metricLabel(metric: AffinityMetric): string {
  switch (metric) {
    case "Ki":
      return "Ki";
    case "Kd":
      return "Kd";
    case "IC50":
      return "IC₅₀";
    case "EC50":
      return "EC₅₀";
    case "Kb":
      return "Kb";
    case "Ki_app":
      return "Ki app";
    case "pIC50":
      return "pIC₅₀";
    default:
      return metric;
  }
}
