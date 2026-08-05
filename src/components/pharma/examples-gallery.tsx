import { useMemo, useState } from "react";
import { ArrowRight, Beaker, FlaskConical } from "lucide-react";
import { PRESETS, type PresetCocktail } from "@/lib/pharma/drugs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TAG_LABEL: Record<PresetCocktail["tag"], string> = {
  risk: "Risk",
  reversal: "Reversal",
  common: "Common",
  compare: "Compare",
  cardiovascular: "Cardio",
  cns: "CNS",
};

const TAG_VARIANT: Record<
  PresetCocktail["tag"],
  "warn" | "antagonist" | "default" | "synergy" | "primary" | "partial"
> = {
  risk: "warn",
  reversal: "antagonist",
  common: "default",
  compare: "synergy",
  cardiovascular: "primary",
  cns: "partial",
};

const FILTERS: Array<PresetCocktail["tag"] | "all"> = [
  "all",
  "risk",
  "reversal",
  "common",
  "compare",
  "cardiovascular",
  "cns",
];

interface ExamplesGalleryProps {
  onLoad: (preset: PresetCocktail) => void;
  activePresetId?: string | null;
}

export function ExamplesGallery({ onLoad, activePresetId }: ExamplesGalleryProps) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const list = useMemo(() => {
    if (filter === "all") return PRESETS;
    return PRESETS.filter((p) => p.tag === filter);
  }, [filter]);

  return (
    <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-primary)]">
            <Beaker className="size-3.5" />
            Specific drug examples
          </p>
          <h3 className="text-lg font-semibold tracking-tight">
            Named regimens with real drug brands & doses
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted)]">
            Load a teaching case in one click — each example lists the exact drugs
            (Zoloft, Narcan, OxyContin, Abilify…) and what to look for in the receptor map.
          </p>
        </div>
        <p className="text-xs tabular-nums text-[var(--color-subtle)]">
          {list.length} example{list.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Button
            key={f}
            type="button"
            size="sm"
            variant={filter === f ? "default" : "secondary"}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : TAG_LABEL[f]}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => {
          const active = activePresetId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onLoad(p)}
              className={cn(
                "flex flex-col rounded-[var(--radius-lg)] border p-4 text-left transition-[border-color,background-color,transform] duration-150",
                active
                  ? "border-[var(--color-primary)] bg-[color-mix(in_oklab,var(--color-primary)_10%,transparent)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-3)]",
              )}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant={TAG_VARIANT[p.tag]}>{TAG_LABEL[p.tag]}</Badge>
                <span className="text-[10px] uppercase tracking-wide text-[var(--color-subtle)]">
                  {p.items.length} drugs
                </span>
              </div>
              <p className="font-medium text-[var(--color-fg)]">{p.name}</p>
              <p className="mt-1 font-mono text-xs leading-relaxed text-[var(--color-primary)]">
                {p.drugsLabel}
              </p>
              <p className="mt-2 line-clamp-2 text-xs text-[var(--color-muted)]">
                {p.description}
              </p>
              <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-[var(--color-subtle)]">
                <FlaskConical className="mt-0.5 size-3 shrink-0" />
                <span>{p.highlight}</span>
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)]">
                Load example
                <ArrowRight className="size-3.5" />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
