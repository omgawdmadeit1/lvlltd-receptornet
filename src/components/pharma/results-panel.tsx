import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  ChevronDown,
  FlaskConical,
  Link2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  actionLabel,
  classificationLabel,
  formatActivity,
  formatAffinityNm,
  formatPct,
  formatPValue,
} from "@/lib/pharma/engine";
import type { AnalysisResult, ReceptorResult } from "@/lib/pharma/types";
import { ActivityBar, BindingBar } from "@/components/pharma/activity-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ResultsPanelProps {
  result: AnalysisResult | null;
}

function classVariant(
  c: ReceptorResult["netClassification"],
): "agonist" | "antagonist" | "partial" | "default" | "synergy" {
  switch (c) {
    case "agonist-dominant":
      return "agonist";
    case "partial-agonist":
      return "partial";
    case "antagonist-dominant":
    case "inverse-dominant":
    case "inhibited":
      return "antagonist";
    case "modulated":
      return "synergy";
    default:
      return "default";
  }
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  const [familyFilter, setFamilyFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const families = useMemo(() => {
    if (!result) return [];
    return [...new Set(result.receptors.map((r) => r.receptor.family))].sort();
  }, [result]);

  const filtered = useMemo(() => {
    if (!result) return [];
    if (familyFilter === "all") return result.receptors;
    return result.receptors.filter((r) => r.receptor.family === familyFilter);
  }, [result, familyFilter]);

  const chartData = useMemo(() => {
    return filtered.slice(0, 14).map((r) => ({
      name: r.receptor.shortName,
      activity: Math.round(r.netActivity * 100),
      binding: Math.round(r.totalBinding * 100),
      fill:
        r.netActivity >= 0.08
          ? "var(--color-agonist)"
          : r.netActivity <= -0.08
            ? "var(--color-antagonist)"
            : "var(--color-partial)",
    }));
  }, [filtered]);

  if (!result || result.receptors.length === 0) {
    return (
      <Card className="flex min-h-[320px] flex-col items-center justify-center border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-2)] text-[var(--color-muted)]">
            <FlaskConical className="size-6" />
          </div>
          <div>
            <p className="font-medium">Receptor map empty</p>
            <p className="mt-1 max-w-sm text-sm text-[var(--color-muted)]">
              Select one or more drugs to compute competitive occupancy from
              quantitative Ki/Kd/IC₅₀ values and net agonist / antagonist activity.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat
          label="Receptors hit"
          value={String(result.summary.receptorCount)}
          icon={<Activity className="size-3.5" />}
        />
        <Stat
          label="Agonist-dominant"
          value={String(result.summary.agonistDominant)}
          tone="agonist"
        />
        <Stat
          label="Antagonist / inhibited"
          value={String(result.summary.antagonistDominant)}
          tone="antagonist"
        />
        <Stat
          label="High binding"
          value={String(result.summary.highBinding)}
          tone="primary"
        />
        <Stat
          label="Synergies"
          value={String(result.summary.synergyCount)}
          tone="synergy"
        />
        <Stat
          label="Risk interactions"
          value={String(result.summary.riskCount)}
          tone="warn"
        />
      </div>

      {result.synergies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="size-4 text-[var(--color-synergy)]" />
              Interactions & synergies
            </CardTitle>
            <CardDescription>
              Pairwise rules applied to functional activity at shared targets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.synergies.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "rounded-[var(--radius-md)] border px-3 py-2.5",
                  s.severity === "high"
                    ? "border-[color-mix(in_oklab,var(--color-danger)_40%,var(--color-border))] bg-[color-mix(in_oklab,var(--color-danger)_8%,transparent)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface-2)]",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {s.severity === "high" ? (
                    <AlertTriangle className="size-3.5 text-[var(--color-danger)]" />
                  ) : null}
                  <span className="text-sm font-medium">{s.title}</span>
                  <Badge
                    variant={
                      s.type === "risk"
                        ? "warn"
                        : s.type === "antagonistic"
                          ? "antagonist"
                          : s.type === "synergistic"
                            ? "synergy"
                            : "default"
                    }
                  >
                    {s.type} · ×{s.multiplier.toFixed(2)}
                  </Badge>
                  <Badge variant="outline">{s.severity}</Badge>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
                  {s.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="table">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="table">Receptor table</TabsTrigger>
            <TabsTrigger value="chart">Activity chart</TabsTrigger>
            <TabsTrigger value="affinity">Affinity table</TabsTrigger>
          </TabsList>
          <div className="flex flex-wrap gap-1.5">
            <FilterChip
              active={familyFilter === "all"}
              onClick={() => setFamilyFilter("all")}
              label="All families"
            />
            {families.map((f) => (
              <FilterChip
                key={f}
                active={familyFilter === f}
                onClick={() => setFamilyFilter(f)}
                label={f}
              />
            ))}
          </div>
        </div>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Net functional activity</CardTitle>
              <CardDescription>
                Positive = agonist-like tone · Negative = antagonist / inhibitory
                tone (top {Math.min(14, filtered.length)} receptors).
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[360px] pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                >
                  <CartesianGrid
                    stroke="var(--color-border)"
                    strokeDasharray="3 3"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    domain={[-100, 100]}
                    tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                    axisLine={{ stroke: "var(--color-border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={72}
                    tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-surface-2)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "var(--color-fg)" }}
                    formatter={(value: number, name: string) => {
                      if (name === "activity") return [`${value}`, "Net activity"];
                      return [`${value}%`, "Binding"];
                    }}
                  />
                  <Bar dataKey="activity" radius={[0, 4, 4, 0]} maxBarSize={16}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="affinity">
          <Card>
            <CardHeader>
              <CardTitle>Quantitative binding constants</CardTitle>
              <CardDescription>
                Literature-approximate Ki / Kd / IC₅₀ / EC₅₀ (nM) and derived p-values
                for each drug–receptor pair in the current regimen. Lower nM = tighter
                binding.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[10px] uppercase tracking-wide text-[var(--color-subtle)]">
                    <th className="px-2 py-2 font-medium">Drug</th>
                    <th className="px-2 py-2 font-medium">Receptor</th>
                    <th className="px-2 py-2 font-medium">Action</th>
                    <th className="px-2 py-2 font-medium">Metric</th>
                    <th className="px-2 py-2 font-medium tabular-nums">Value (nM)</th>
                    <th className="px-2 py-2 font-medium tabular-nums">pValue</th>
                    <th className="px-2 py-2 font-medium tabular-nums">C_free (nM)</th>
                    <th className="px-2 py-2 font-medium tabular-nums">C/K</th>
                    <th className="px-2 py-2 font-medium tabular-nums">Occupancy</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.flatMap((r) =>
                    r.contributions.map((c) => (
                      <tr
                        key={`${r.receptorId}-${c.drugId}`}
                        className="border-b border-[var(--color-border)]/60 hover:bg-[var(--color-surface-2)]"
                      >
                        <td className="px-2 py-2 font-medium">{c.drugName}</td>
                        <td className="px-2 py-2 text-[var(--color-muted)]">
                          {r.receptor.shortName}
                        </td>
                        <td className="px-2 py-2">
                          <Badge
                            variant={
                              c.functional >= 0 ? "agonist" : "antagonist"
                            }
                            className="text-[10px]"
                          >
                            {actionLabel(c.action)}
                          </Badge>
                        </td>
                        <td className="px-2 py-2 font-mono text-[var(--color-muted)]">
                          {c.metric}
                        </td>
                        <td className="px-2 py-2 font-mono tabular-nums text-[var(--color-primary)]">
                          {formatAffinityNm(c.valueNm, c.metric)}
                        </td>
                        <td className="px-2 py-2 font-mono tabular-nums">
                          {formatPValue(c.valueNm, c.metric)}
                        </td>
                        <td className="px-2 py-2 font-mono tabular-nums text-[var(--color-muted)]">
                          {c.freeConcNm < 1
                            ? c.freeConcNm.toPrecision(2)
                            : c.freeConcNm < 100
                              ? c.freeConcNm.toFixed(1)
                              : Math.round(c.freeConcNm).toLocaleString()}
                        </td>
                        <td className="px-2 py-2 font-mono tabular-nums text-[var(--color-muted)]">
                          {c.weight < 0.01
                            ? c.weight.toExponential(1)
                            : c.weight.toPrecision(3)}
                        </td>
                        <td className="px-2 py-2 font-mono tabular-nums">
                          {formatPct(c.occupancy)}
                        </td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="size-4 text-[var(--color-primary)]" />
                Per-receptor activity
              </CardTitle>
              <CardDescription>
                Occupancy from multi-ligand Langmuir (C/Ki competitive), plus net
                agonist / antagonist classification. Best Ki shown per row.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="hidden grid-cols-[1fr_110px_100px_120px_1fr] gap-3 px-3 text-[10px] uppercase tracking-wide text-[var(--color-subtle)] sm:grid">
                <span>Receptor</span>
                <span>Best Ki</span>
                <span>Binding</span>
                <span>Net activity</span>
                <span>Classification</span>
              </div>

              {filtered.map((r) => {
                const open = expanded === r.receptorId;
                return (
                  <div
                    key={r.receptorId}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)]"
                  >
                    <button
                      type="button"
                      className="grid w-full grid-cols-1 gap-3 p-3 text-left sm:grid-cols-[1fr_110px_100px_120px_1fr] sm:items-center"
                      onClick={() =>
                        setExpanded(open ? null : r.receptorId)
                      }
                      aria-expanded={open}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {r.receptor.shortName}
                          </span>
                          {r.synergyMultiplier !== 1 && (
                            <Badge variant="synergy">
                              ×{r.synergyMultiplier.toFixed(2)}
                            </Badge>
                          )}
                          <ChevronDown
                            className={cn(
                              "ml-auto size-4 shrink-0 text-[var(--color-subtle)] transition-transform duration-150 sm:hidden",
                              open && "rotate-180",
                            )}
                          />
                        </div>
                        <p className="truncate text-xs text-[var(--color-muted)]">
                          {r.receptor.name} · {r.receptor.family}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase text-[var(--color-subtle)] sm:hidden">
                          Best Ki{" "}
                        </span>
                        <span className="font-mono text-xs tabular-nums text-[var(--color-primary)]">
                          {formatAffinityNm(r.bestKiNm, r.bestKiMetric)}
                        </span>
                        <p className="hidden text-[10px] text-[var(--color-subtle)] sm:block">
                          {formatPValue(r.bestKiNm, r.bestKiMetric)}
                        </p>
                      </div>

                      <div>
                        <div className="mb-1 flex items-center justify-between sm:block">
                          <span className="text-[10px] uppercase text-[var(--color-subtle)] sm:hidden">
                            Binding
                          </span>
                          <span className="text-xs tabular-nums text-[var(--color-fg)]">
                            {formatPct(r.totalBinding)}
                          </span>
                        </div>
                        <BindingBar value={r.totalBinding} />
                      </div>

                      <div>
                        <div className="mb-1 flex items-center justify-between sm:block">
                          <span className="text-[10px] uppercase text-[var(--color-subtle)] sm:hidden">
                            Net activity
                          </span>
                          <span
                            className={cn(
                              "text-xs font-medium tabular-nums",
                              r.netActivity > 0.08
                                ? "text-[var(--color-agonist)]"
                                : r.netActivity < -0.08
                                  ? "text-[var(--color-antagonist)]"
                                  : "text-[var(--color-partial)]",
                            )}
                          >
                            {formatActivity(r.netActivity)}
                          </span>
                        </div>
                        <ActivityBar value={r.netActivity} />
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={classVariant(r.netClassification)}>
                          {classificationLabel(r.netClassification)}
                        </Badge>
                        <ChevronDown
                          className={cn(
                            "ml-auto hidden size-4 shrink-0 text-[var(--color-subtle)] transition-transform duration-150 sm:block",
                            open && "rotate-180",
                          )}
                        />
                      </div>
                    </button>

                    {open && (
                      <div className="border-t border-[var(--color-border)] px-3 py-3">
                        <p className="mb-2 text-xs text-[var(--color-muted)]">
                          {r.receptor.description}
                        </p>
                        <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[var(--color-subtle)]">
                          Drug contributions (quantitative affinity)
                        </p>
                        <div className="space-y-2">
                          {r.contributions.map((c) => (
                            <div
                              key={c.drugId}
                              className="rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2.5 py-2 text-xs"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">{c.drugName}</span>
                                <Badge variant="outline" className="text-[10px]">
                                  {actionLabel(c.action)}
                                </Badge>
                                <span className="font-mono tabular-nums text-[var(--color-primary)]">
                                  {formatAffinityNm(c.valueNm, c.metric)}
                                </span>
                                <span className="font-mono tabular-nums text-[var(--color-muted)]">
                                  {formatPValue(c.valueNm, c.metric)}
                                </span>
                              </div>
                              <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[var(--color-muted)] sm:grid-cols-4">
                                <span className="tabular-nums">
                                  C_free {c.freeConcNm < 10 ? c.freeConcNm.toPrecision(2) : Math.round(c.freeConcNm)} nM
                                </span>
                                <span className="tabular-nums">
                                  C/K {c.weight < 0.01 ? c.weight.toExponential(1) : c.weight.toPrecision(3)}
                                </span>
                                <span className="tabular-nums">
                                  Occ {formatPct(c.occupancy)} · Eff {Math.round(c.efficacy * 100)}%
                                </span>
                                <span className="tabular-nums">
                                  Act{" "}
                                  <span
                                    className={
                                      c.functional >= 0
                                        ? "text-[var(--color-agonist)]"
                                        : "text-[var(--color-antagonist)]"
                                    }
                                  >
                                    {formatActivity(c.functional)}
                                  </span>
                                </span>
                              </div>
                              {(c.note || c.source) && (
                                <p className="mt-1 text-[10px] text-[var(--color-subtle)]">
                                  {[c.note, c.source].filter(Boolean).join(" · ")}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        {r.activeSynergies.length > 0 && (
                          <p className="mt-2 text-xs text-[var(--color-synergy)]">
                            Synergy applied:{" "}
                            {r.activeSynergies.map((s) => s.title).join("; ")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  tone?: "agonist" | "antagonist" | "primary" | "synergy" | "warn";
}) {
  const color =
    tone === "agonist"
      ? "text-[var(--color-agonist)]"
      : tone === "antagonist"
        ? "text-[var(--color-antagonist)]"
        : tone === "primary"
          ? "text-[var(--color-primary)]"
          : tone === "synergy"
            ? "text-[var(--color-synergy)]"
            : tone === "warn"
              ? "text-[var(--color-warn)]"
              : "text-[var(--color-fg)]";

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--color-subtle)]">
        {icon}
        {label}
      </div>
      <p className={cn("mt-1 text-xl font-semibold tabular-nums", color)}>
        {value}
      </p>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs transition-colors duration-150",
        active
          ? "border-[var(--color-primary)] bg-[color-mix(in_oklab,var(--color-primary)_16%,transparent)] text-[var(--color-primary)]"
          : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)]",
      )}
    >
      {label}
    </button>
  );
}
