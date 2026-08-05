import { cn } from "@/lib/utils";

interface ActivityBarProps {
  /** −1 … +1 */
  value: number;
  className?: string;
  showLabels?: boolean;
}

/** Bidirectional bar: left = antagonism, right = agonism. */
export function ActivityBar({ value, className, showLabels }: ActivityBarProps) {
  const clamped = Math.max(-1, Math.min(1, value));
  const pct = Math.abs(clamped) * 50;

  return (
    <div className={cn("w-full", className)}>
      {showLabels && (
        <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wide text-[var(--color-subtle)]">
          <span>Antagonist</span>
          <span>Agonist</span>
        </div>
      )}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-3)]">
        <div className="absolute inset-y-0 left-1/2 w-px bg-[var(--color-border-strong)]" />
        {clamped >= 0 ? (
          <div
            className="absolute inset-y-0 left-1/2 rounded-r-full bg-[var(--color-agonist)] transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        ) : (
          <div
            className="absolute inset-y-0 right-1/2 rounded-l-full bg-[var(--color-antagonist)] transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    </div>
  );
}

interface BindingBarProps {
  value: number;
  className?: string;
}

export function BindingBar({ value, className }: BindingBarProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-3)]",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
