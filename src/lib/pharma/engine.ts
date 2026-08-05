import {
  formatAffinityNm,
  formatPValue,
  pValueFromNm,
  relativeAffinityFromNm,
} from "./affinity";
import { DRUG_MAP } from "./drugs";
import { RECEPTOR_MAP } from "./receptors";
import { findActiveSynergies } from "./synergies";
import type {
  AffinityMetric,
  AnalysisResult,
  DrugContribution,
  ReceptorAction,
  ReceptorResult,
  SelectedDrug,
  SynergyRule,
} from "./types";

/** Maps action type to signed functional direction. */
function actionSign(action: ReceptorAction): number {
  switch (action) {
    case "agonist":
    case "releaser":
    case "modulator-positive":
      return 1;
    case "partial-agonist":
      return 0.55;
    case "antagonist":
    case "inhibitor":
    case "modulator-negative":
      return -1;
    case "inverse-agonist":
      return -1.15;
    default:
      return 0;
  }
}

/**
 * Dose factor relative to the drug's default clinical dose.
 * Soft-saturates so mega-doses don't dominate unreasonably.
 */
function doseFactor(doseMg: number, defaultDoseMg: number): number {
  if (defaultDoseMg <= 0) return 1;
  const ratio = doseMg / defaultDoseMg;
  // 0.1× → ~0.2, 1× → 1, 4× → ~2.2
  return (2.2 * ratio) / (1 + 1.2 * ratio);
}

/**
 * Free concentration (nM) at the chosen dose.
 * Prefer drug-specific freeConcNm; else infer a plausible free level from
 * default dose mass (very rough educational proxy).
 */
function freeConcentrationNm(
  doseMg: number,
  defaultDoseMg: number,
  freeConcNm: number | undefined,
): number {
  const df = doseFactor(doseMg, defaultDoseMg);
  if (freeConcNm != null && freeConcNm > 0) return freeConcNm * df;
  // Fallback: ~10 nM free at std dose for mid-potency oral small molecules
  return 10 * df;
}

function classifyNet(
  net: number,
  totalBinding: number,
  contributions: DrugContribution[],
): ReceptorResult["netClassification"] {
  if (totalBinding < 0.05) return "neutral";

  const actions = new Set(contributions.map((c) => c.action));
  const hasMod =
    actions.has("modulator-positive") || actions.has("modulator-negative");
  const hasInhib = actions.has("inhibitor") || actions.has("releaser");

  if (Math.abs(net) < 0.08) {
    if (hasMod) return "modulated";
    if (hasInhib) return "inhibited";
    return "mixed";
  }

  if (net >= 0.45) return "agonist-dominant";
  if (net >= 0.12) return "partial-agonist";
  if (net <= -0.55) return "inverse-dominant";
  if (net <= -0.12) {
    if (hasInhib && !actions.has("antagonist") && !actions.has("inverse-agonist")) {
      return "inhibited";
    }
    return "antagonist-dominant";
  }
  return "mixed";
}

function synergyMultiplierForReceptor(
  receptorId: string,
  active: SynergyRule[],
): { multiplier: number; rules: SynergyRule[] } {
  const rules = active.filter(
    (s) => s.receptorIds.length === 0 || s.receptorIds.includes(receptorId),
  );
  if (rules.length === 0) return { multiplier: 1, rules: [] };

  let m = 1;
  for (const r of rules) m *= r.multiplier;
  m = Math.min(2.2, Math.max(0.08, m));
  return { multiplier: m, rules };
}

/**
 * Competitive occupancy (multi-ligand Langmuir):
 *   w_i = C_free,i / valueNm_i
 *   occupancy_i = w_i / (1 + Σ w_j)
 * Functional activity = occupancy × efficacy × actionSign, then synergy scale.
 */
export function analyzeCocktail(selected: SelectedDrug[]): AnalysisResult {
  const valid = selected
    .map((s) => {
      const drug = DRUG_MAP[s.drugId];
      if (!drug) return null;
      return { drug, doseMg: Math.max(0, s.doseMg) };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const drugIds = valid.map((v) => v.drug.id);
  const activeSynergies = findActiveSynergies(drugIds);

  const receptorIds = new Set<string>();
  for (const { drug } of valid) {
    for (const b of drug.bindings) receptorIds.add(b.receptorId);
  }

  const receptors: ReceptorResult[] = [];

  for (const receptorId of receptorIds) {
    const receptor = RECEPTOR_MAP[receptorId];
    if (!receptor) continue;

    type Entry = {
      drugId: string;
      drugName: string;
      weight: number;
      action: ReceptorAction;
      affinity: number;
      valueNm: number;
      metric: AffinityMetric;
      efficacy: number;
      freeConcNm: number;
      note?: string;
      source?: string;
    };
    const entries: Entry[] = [];

    for (const { drug, doseMg } of valid) {
      const binding = drug.bindings.find((b) => b.receptorId === receptorId);
      if (!binding) continue;
      const free = freeConcentrationNm(doseMg, drug.defaultDoseMg, drug.freeConcNm);
      const ki = Math.max(binding.valueNm, 1e-6);
      const weight = free / ki;
      entries.push({
        drugId: drug.id,
        drugName: drug.name,
        weight,
        action: binding.action,
        affinity: binding.affinity ?? relativeAffinityFromNm(binding.valueNm),
        valueNm: binding.valueNm,
        metric: binding.metric,
        efficacy: binding.efficacy,
        freeConcNm: free,
        note: binding.note,
        source: binding.source,
      });
    }

    if (entries.length === 0) continue;

    const sumW = entries.reduce((a, e) => a + e.weight, 0);
    const denom = 1 + sumW;

    const contributions: DrugContribution[] = entries.map((e) => {
      const occupancy = e.weight / denom;
      const functional = occupancy * e.efficacy * actionSign(e.action);
      return {
        drugId: e.drugId,
        drugName: e.drugName,
        occupancy,
        functional,
        action: e.action,
        affinity: e.affinity,
        valueNm: e.valueNm,
        metric: e.metric,
        pValue: pValueFromNm(e.valueNm),
        efficacy: e.efficacy,
        freeConcNm: e.freeConcNm,
        weight: e.weight,
        note: e.note,
        source: e.source,
      };
    });

    const totalBinding = Math.min(
      1,
      contributions.reduce((a, c) => a + c.occupancy, 0),
    );
    let netActivity = contributions.reduce((a, c) => a + c.functional, 0);

    const { multiplier, rules } = synergyMultiplierForReceptor(
      receptorId,
      activeSynergies,
    );
    netActivity *= multiplier;
    netActivity = Math.max(-1.25, Math.min(1.25, netActivity));

    const best = [...contributions].sort((a, b) => a.valueNm - b.valueNm)[0]!;

    receptors.push({
      receptorId,
      receptor,
      totalBinding,
      netActivity,
      netClassification: classifyNet(netActivity, totalBinding, contributions),
      contributions: contributions.sort((a, b) => b.occupancy - a.occupancy),
      synergyMultiplier: multiplier,
      activeSynergies: rules,
      bestKiNm: best.valueNm,
      bestKiMetric: best.metric,
    });
  }

  receptors.sort((a, b) => {
    const da = Math.abs(a.netActivity) * 0.7 + a.totalBinding * 0.3;
    const db = Math.abs(b.netActivity) * 0.7 + b.totalBinding * 0.3;
    return db - da;
  });

  const summary = {
    receptorCount: receptors.length,
    agonistDominant: receptors.filter(
      (r) =>
        r.netClassification === "agonist-dominant" ||
        r.netClassification === "partial-agonist",
    ).length,
    antagonistDominant: receptors.filter(
      (r) =>
        r.netClassification === "antagonist-dominant" ||
        r.netClassification === "inverse-dominant" ||
        r.netClassification === "inhibited",
    ).length,
    highBinding: receptors.filter((r) => r.totalBinding >= 0.45).length,
    synergyCount: activeSynergies.filter((s) => s.type !== "risk").length,
    riskCount: activeSynergies.filter(
      (s) => s.type === "risk" || s.severity === "high",
    ).length,
  };

  return { receptors, synergies: activeSynergies, summary };
}

export function actionLabel(action: ReceptorAction): string {
  switch (action) {
    case "agonist":
      return "Agonist";
    case "partial-agonist":
      return "Partial agonist";
    case "antagonist":
      return "Antagonist";
    case "inverse-agonist":
      return "Inverse agonist";
    case "modulator-positive":
      return "Positive modulator";
    case "modulator-negative":
      return "Negative modulator";
    case "inhibitor":
      return "Inhibitor";
    case "releaser":
      return "Releaser";
    default:
      return action;
  }
}

export function classificationLabel(
  c: ReceptorResult["netClassification"],
): string {
  switch (c) {
    case "agonist-dominant":
      return "Agonist-dominant";
    case "partial-agonist":
      return "Partial agonist";
    case "antagonist-dominant":
      return "Antagonist-dominant";
    case "inverse-dominant":
      return "Inverse-dominant";
    case "mixed":
      return "Mixed";
    case "modulated":
      return "Modulated";
    case "inhibited":
      return "Inhibited";
    case "neutral":
      return "Neutral";
    default:
      return c;
  }
}

export function formatPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function formatActivity(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${(n * 100).toFixed(0)}`;
}

export { formatAffinityNm, formatPValue, relativeAffinityFromNm, pValueFromNm };
