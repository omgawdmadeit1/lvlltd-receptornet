import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FlaskConical, Info, Sparkles } from "lucide-react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import {
  DRUG_MAP,
  PRESETS,
  presetToSelection,
  type PresetCocktail,
} from "@/lib/pharma/drugs";
import { analyzeCocktail } from "@/lib/pharma/engine";
import type { Drug, SelectedDrug } from "@/lib/pharma/types";
import { CocktailPanel } from "@/components/pharma/cocktail-panel";
import { DrugPicker } from "@/components/pharma/drug-picker";
import { ExamplesGallery } from "@/components/pharma/examples-gallery";
import { ResultsPanel } from "@/components/pharma/results-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [selected, setSelected] = useState<SelectedDrug[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const result = useMemo(
    () => (selected.length > 0 ? analyzeCocktail(selected) : null),
    [selected],
  );

  function addDrug(drug: Drug) {
    setActivePresetId(null);
    setSelected((prev) => {
      if (prev.some((s) => s.drugId === drug.id)) return prev;
      return [...prev, { drugId: drug.id, doseMg: drug.defaultDoseMg }];
    });
  }

  function removeDrug(drugId: string) {
    setActivePresetId(null);
    setSelected((prev) => prev.filter((s) => s.drugId !== drugId));
  }

  function changeDose(drugId: string, doseMg: number) {
    setActivePresetId(null);
    setSelected((prev) =>
      prev.map((s) => (s.drugId === drugId ? { ...s, doseMg } : s)),
    );
  }

  function clearAll() {
    setActivePresetId(null);
    setSelected([]);
  }

  function loadPreset(preset: PresetCocktail) {
    setActivePresetId(preset.id);
    setSelected(presetToSelection(preset));
    // Scroll results into view on mobile
    requestAnimationFrame(() => {
      document.getElementById("analysis-workspace")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  const activePreset = PRESETS.find((p) => p.id === activePresetId) ?? null;

  return (
    <div className="min-h-[calc(100dvh-var(--grok-banner-h,0px))] bg-[var(--color-bg)] text-[var(--color-fg)]">
      <header className="sticky top-[var(--grok-banner-h,0px)] z-30 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg)_88%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[color-mix(in_oklab,var(--color-primary)_18%,transparent)] text-[var(--color-primary)]">
              <FlaskConical className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">
                ReceptorNet
              </h1>
              <p className="hidden text-xs text-[var(--color-muted)] sm:block">
                Quantitative Ki/Kd occupancy analyzer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AuthSlot />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="mb-6 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-primary)]">
                <Sparkles className="size-3.5" />
                Ki · Occupancy · Agonism · Synergy
              </p>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Total receptor activity from a drug list
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
                Pick specific named drugs (Zoloft, Narcan, OxyContin, Abilify…) or
                load a full example regimen. ReceptorNet nets competitive occupancy
                from quantitative Ki/Kd/IC₅₀ values and flags synergies.
              </p>
            </div>
            <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-xs text-[var(--color-muted)] lg:max-w-xs">
              <Info className="mt-0.5 size-3.5 shrink-0 text-[var(--color-partial)]" />
              <span>
                Affinity values are literature-approximate for education — not a
                clinical decision tool. Verify with primary sources and a
                clinician.
              </span>
            </div>
          </div>
        </section>

        <div className="mb-6">
          <ExamplesGallery
            onLoad={loadPreset}
            activePresetId={activePresetId}
          />
        </div>

        {activePreset && (
          <div className="mb-4 rounded-[var(--radius-md)] border border-[color-mix(in_oklab,var(--color-primary)_35%,var(--color-border))] bg-[color-mix(in_oklab,var(--color-primary)_8%,transparent)] px-4 py-3 text-sm">
            <span className="font-medium text-[var(--color-fg)]">
              Loaded: {activePreset.name}
            </span>
            <span className="text-[var(--color-muted)]"> — </span>
            <span className="font-mono text-xs text-[var(--color-primary)]">
              {activePreset.drugsLabel}
            </span>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {activePreset.highlight}
            </p>
          </div>
        )}

        <div
          id="analysis-workspace"
          className="grid scroll-mt-24 grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5"
        >
          <Card className="lg:col-span-4 xl:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle>Drug library</CardTitle>
              <CardDescription>
                {Object.keys(DRUG_MAP).length} named drugs with quantitative
                Ki/Kd/IC₅₀ profiles.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[min(520px,60vh)]">
              <DrugPicker
                selectedIds={selected.map((s) => s.drugId)}
                onAdd={addDrug}
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-4 xl:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle>Your regimen</CardTitle>
              <CardDescription>
                Adjust doses; free concentration scales with dose factor.
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[min(520px,60vh)] overflow-y-auto">
              <CocktailPanel
                selected={selected}
                onChangeDose={changeDose}
                onRemove={removeDrug}
                onClear={clearAll}
              />
            </CardContent>
          </Card>

          <div className="lg:col-span-4 xl:col-span-6">
            <ResultsPanel result={result} />
          </div>
        </div>

        <section className="mt-8 border-t border-[var(--color-border)] pt-6">
          <h3 className="text-sm font-semibold">How activity is calculated</h3>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs leading-relaxed text-[var(--color-muted)] sm:text-sm">
            <li>
              Each binding has a quantitative constant{" "}
              <span className="font-mono text-[var(--color-fg)]">valueNm</span>{" "}
              (Ki, Kd, IC₅₀, or EC₅₀ in nM) and an estimated free concentration{" "}
              <span className="font-mono text-[var(--color-fg)]">C_free</span> at
              the chosen dose.
            </li>
            <li>
              Weight{" "}
              <span className="font-mono text-[var(--color-fg)]">
                wᵢ = C_free,i / valueNm_i
              </span>
              . Competitive occupancy:{" "}
              <span className="font-mono text-[var(--color-fg)]">
                θᵢ = wᵢ / (1 + Σw)
              </span>{" "}
              (multi-ligand Langmuir).
            </li>
            <li>
              Functional activity = occupancy × efficacy × action sign (agonist
              +, antagonist/inhibitor −, partial ~0.55).
            </li>
            <li>
              pKi / pKd = −log₁₀(M) is shown for readability; lower nM (higher
              p-value) means tighter binding.
            </li>
            <li>
              Documented pairwise synergies scale net activity at listed
              receptors. Classification labels the dominant tone.
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
}

function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--color-surface-3)]" />
    );
  }
  return (
    <>
      <SignedOut>
        <Link
          to="/login"
          className="inline-flex h-8 items-center justify-center rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-xs font-medium text-[var(--color-fg)] hover:bg-[var(--color-surface-3)]"
        >
          Sign in
        </Link>
      </SignedOut>
      <SignedIn>
        <div className="flex items-center gap-2">
          <span className="hidden max-w-[120px] truncate text-xs text-[var(--color-muted)] sm:inline">
            {user?.displayName ?? user?.primaryEmail}
          </span>
          <UserButton />
        </div>
      </SignedIn>
    </>
  );
}
