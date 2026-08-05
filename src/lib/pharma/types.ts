export type ReceptorAction =
  | "agonist"
  | "partial-agonist"
  | "antagonist"
  | "inverse-agonist"
  | "modulator-positive"
  | "modulator-negative"
  | "inhibitor"
  | "releaser";

/** Binding / functional constant type reported in literature. */
export type AffinityMetric =
  | "Ki"
  | "Kd"
  | "IC50"
  | "EC50"
  | "Kb"
  | "Ki_app"
  | "pIC50";

export type ReceptorFamily =
  | "Monoamine"
  | "Opioid"
  | "GABA / Glutamate"
  | "Cholinergic"
  | "Histamine"
  | "Adrenergic"
  | "Serotonergic"
  | "Cannabinoid"
  | "Dopaminergic"
  | "Peptide / Hormone"
  | "Ion channel"
  | "Enzyme / Transporter"
  | "Other";

export interface ReceptorBinding {
  receptorId: string;
  /**
   * Quantitative binding/functional constant in nanomolar (nM).
   * Lower = tighter binding. For pIC50 entries this is still stored as nM
   * (converted: 10^(9-pIC50) when pIC50 is the source scale).
   */
  valueNm: number;
  /** Which constant valueNm represents. */
  metric: AffinityMetric;
  /**
   * Relative binding strength 0–100 for quick comparison / charts
   * (derived from valueNm when omitted).
   */
  affinity?: number;
  action: ReceptorAction;
  /** Intrinsic efficacy 0–1 (1 = full agonist or full antagonist occupancy effect). */
  efficacy: number;
  /** Optional literature / assay note. */
  note?: string;
  /** Optional short source tag (e.g. PDSP, product label). */
  source?: string;
}

export interface Drug {
  id: string;
  name: string;
  aliases: string[];
  class: string;
  category: string;
  description: string;
  defaultDoseMg: number;
  doseUnit: string;
  halfLifeHours: number;
  /**
   * Approximate free plasma concentration (nM) at the default clinical dose.
   * Used with Ki for Langmuir / Cheng–Prusoff-style occupancy.
   */
  freeConcNm?: number;
  bindings: ReceptorBinding[];
}

export interface ReceptorDef {
  id: string;
  name: string;
  shortName: string;
  family: ReceptorFamily;
  description: string;
}

export interface SynergyRule {
  id: string;
  drugIds: [string, string];
  receptorIds: string[];
  /** Multiplier on net functional activity at listed receptors (>1 potentiation, <1 antagonism of effect). */
  multiplier: number;
  type: "synergistic" | "additive-plus" | "antagonistic" | "risk";
  title: string;
  description: string;
  severity: "info" | "moderate" | "high";
}

export interface SelectedDrug {
  drugId: string;
  doseMg: number;
}

export interface DrugContribution {
  drugId: string;
  drugName: string;
  occupancy: number;
  functional: number;
  action: ReceptorAction;
  /** Relative 0–100 score. */
  affinity: number;
  /** Quantitative constant in nM. */
  valueNm: number;
  metric: AffinityMetric;
  /** pKi / pKd / −log10(M) for display. */
  pValue: number;
  efficacy: number;
  /** Free conc used in occupancy model (nM). */
  freeConcNm: number;
  /** Occupancy weight C/Ki. */
  weight: number;
  note?: string;
  source?: string;
}

export interface ReceptorResult {
  receptorId: string;
  receptor: ReceptorDef;
  /** Total fractional occupancy 0–1 after competitive binding. */
  totalBinding: number;
  /** Net functional activity −1…+1 (positive = agonism-like, negative = antagonism-like). */
  netActivity: number;
  /** Dominant classification after combining all drugs. */
  netClassification:
    | "agonist-dominant"
    | "partial-agonist"
    | "antagonist-dominant"
    | "inverse-dominant"
    | "mixed"
    | "modulated"
    | "inhibited"
    | "neutral";
  contributions: DrugContribution[];
  synergyMultiplier: number;
  activeSynergies: SynergyRule[];
  /** Tightest (lowest nM) binder among contributors. */
  bestKiNm: number;
  bestKiMetric: AffinityMetric;
}

export interface AnalysisResult {
  receptors: ReceptorResult[];
  synergies: SynergyRule[];
  summary: {
    receptorCount: number;
    agonistDominant: number;
    antagonistDominant: number;
    highBinding: number;
    synergyCount: number;
    riskCount: number;
  };
}
