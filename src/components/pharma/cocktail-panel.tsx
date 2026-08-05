import { Minus, Plus, Trash2, X } from "lucide-react";
import { formatAffinityNm } from "@/lib/pharma/affinity";
import { DRUG_MAP } from "@/lib/pharma/drugs";
import { RECEPTOR_MAP } from "@/lib/pharma/receptors";
import type { SelectedDrug } from "@/lib/pharma/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CocktailPanelProps {
  selected: SelectedDrug[];
  onChangeDose: (drugId: string, doseMg: number) => void;
  onRemove: (drugId: string) => void;
  onClear: () => void;
}

export function CocktailPanel({
  selected,
  onChangeDose,
  onRemove,
  onClear,
}: CocktailPanelProps) {
  if (selected.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] px-4 py-12 text-center">
        <p className="text-sm font-medium text-[var(--color-fg)]">
          No drugs selected
        </p>
        <p className="max-w-xs text-xs text-[var(--color-muted)]">
          Add pharmaceuticals from the library. Net receptor occupancy uses
          quantitative Ki/Kd/IC₅₀ with free-concentration estimates.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-[var(--color-muted)]">
          <span className="font-medium tabular-nums text-[var(--color-fg)]">
            {selected.length}
          </span>{" "}
          drug{selected.length === 1 ? "" : "s"} in regimen
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          <Trash2 className="size-3.5" />
          Clear
        </Button>
      </div>

      <ul className="space-y-2">
        {selected.map((item) => {
          const drug = DRUG_MAP[item.drugId];
          if (!drug) return null;
          const topBinds = [...drug.bindings]
            .sort((a, b) => a.valueNm - b.valueNm)
            .slice(0, 3);
          return (
            <li
              key={item.drugId}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--color-fg)]">{drug.name}</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {drug.class}
                    {drug.freeConcNm != null && (
                      <span className="text-[var(--color-subtle)]">
                        {" "}
                        · C_free≈{drug.freeConcNm < 10 ? drug.freeConcNm : Math.round(drug.freeConcNm)} nM @ default
                      </span>
                    )}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {topBinds.map((b) => {
                      const short =
                        RECEPTOR_MAP[b.receptorId]?.shortName ?? b.receptorId;
                      return (
                        <Badge
                          key={b.receptorId}
                          variant="outline"
                          className="font-mono text-[10px]"
                          title={b.note}
                        >
                          {short} {formatAffinityNm(b.valueNm, b.metric)}
                        </Badge>
                      );
                    })}
                    {drug.bindings.length > 3 && (
                      <Badge variant="outline" className="text-[10px]">
                        +{drug.bindings.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={() => onRemove(item.drugId)}
                  aria-label={`Remove ${drug.name}`}
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-[var(--color-muted)]">Dose</span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="size-8"
                    onClick={() =>
                      onChangeDose(
                        item.drugId,
                        Math.max(drug.defaultDoseMg * 0.05, item.doseMg * 0.5),
                      )
                    }
                    aria-label="Halve dose"
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={Number(item.doseMg.toPrecision(4))}
                      onChange={(e) =>
                        onChangeDose(item.drugId, parseFloat(e.target.value) || 0)
                      }
                      className="h-8 w-24 pr-8 text-center tabular-nums"
                      aria-label={`${drug.name} dose`}
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--color-subtle)]">
                      {drug.doseUnit}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="size-8"
                    onClick={() => onChangeDose(item.drugId, item.doseMg * 2)}
                    aria-label="Double dose"
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
                <button
                  type="button"
                  className="ml-auto text-xs text-[var(--color-primary)] hover:underline"
                  onClick={() => onChangeDose(item.drugId, drug.defaultDoseMg)}
                >
                  Reset
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
