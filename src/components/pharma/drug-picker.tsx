import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { formatAffinityNm } from "@/lib/pharma/affinity";
import { DRUG_CATEGORIES, searchDrugs } from "@/lib/pharma/drugs";
import { RECEPTOR_MAP } from "@/lib/pharma/receptors";
import type { Drug } from "@/lib/pharma/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DrugPickerProps {
  selectedIds: string[];
  onAdd: (drug: Drug) => void;
}

export function DrugPicker({ selectedIds, onAdd }: DrugPickerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | "all">("all");

  const results = useMemo(() => {
    let list = searchDrugs(query);
    if (category !== "all") {
      list = list.filter((d) => d.category === category);
    }
    return list;
  }, [query, category]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-subtle)]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search drugs, classes, receptors…"
          className="pl-9"
          aria-label="Search pharmaceuticals"
        />
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        <CategoryChip
          active={category === "all"}
          onClick={() => setCategory("all")}
          label="All"
        />
        {DRUG_CATEGORIES.map((c) => (
          <CategoryChip
            key={c}
            active={category === c}
            onClick={() => setCategory(c)}
            label={c}
          />
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {results.length === 0 && (
          <p className="px-2 py-8 text-center text-sm text-[var(--color-muted)]">
            No drugs match that search.
          </p>
        )}
        {results.map((drug) => {
          const added = selectedIds.includes(drug.id);
          const tightest = [...drug.bindings].sort(
            (a, b) => a.valueNm - b.valueNm,
          )[0];
          const short = tightest
            ? (RECEPTOR_MAP[tightest.receptorId]?.shortName ??
              tightest.receptorId)
            : null;
          return (
            <button
              key={drug.id}
              type="button"
              disabled={added}
              onClick={() => onAdd(drug)}
              className={cn(
                "flex w-full items-start gap-3 rounded-[var(--radius-md)] border border-transparent px-3 py-2.5 text-left transition-[background-color,border-color] duration-150",
                added
                  ? "cursor-default opacity-45"
                  : "hover:border-[var(--color-border)] hover:bg-[var(--color-surface-2)]",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-[var(--color-fg)]">
                    {drug.name}
                  </span>
                  <Badge variant="outline">{drug.category}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                  {drug.class} · {drug.bindings.length} target
                  {drug.bindings.length === 1 ? "" : "s"}
                </p>
                {tightest && short && (
                  <p className="mt-1 font-mono text-[10px] tabular-nums text-[var(--color-primary)]">
                    best {short}: {formatAffinityNm(tightest.valueNm, tightest.metric)}
                  </p>
                )}
              </div>
              <span
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]",
                  added
                    ? "bg-[var(--color-surface-3)] text-[var(--color-subtle)]"
                    : "bg-[color-mix(in_oklab,var(--color-primary)_18%,transparent)] text-[var(--color-primary)]",
                )}
              >
                <Plus className="size-4" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "secondary"}
      onClick={onClick}
      className="shrink-0"
    >
      {label}
    </Button>
  );
}
