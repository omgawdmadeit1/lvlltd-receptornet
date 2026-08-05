import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--color-surface-3)] text-[var(--color-fg)]",
        primary:
          "border-transparent bg-[color-mix(in_oklab,var(--color-primary)_22%,transparent)] text-[var(--color-primary)]",
        agonist:
          "border-transparent bg-[color-mix(in_oklab,var(--color-agonist)_20%,transparent)] text-[var(--color-agonist)]",
        antagonist:
          "border-transparent bg-[color-mix(in_oklab,var(--color-antagonist)_20%,transparent)] text-[var(--color-antagonist)]",
        partial:
          "border-transparent bg-[color-mix(in_oklab,var(--color-partial)_20%,transparent)] text-[var(--color-partial)]",
        synergy:
          "border-transparent bg-[color-mix(in_oklab,var(--color-synergy)_20%,transparent)] text-[var(--color-synergy)]",
        warn:
          "border-transparent bg-[color-mix(in_oklab,var(--color-warn)_20%,transparent)] text-[var(--color-warn)]",
        outline: "border-[var(--color-border)] text-[var(--color-muted)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
