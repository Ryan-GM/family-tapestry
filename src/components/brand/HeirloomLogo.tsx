import { cn } from "@/lib/utils";

/**
 * Heirloom brand mark — an heirloom seal: a thin ring (continuity) holding
 * three nodes joined by lineage lines (family, generations, connection).
 * Colour comes from `currentColor` + the brass token, so it reads on both the
 * dark app canvas and any light surface.
 */
export function HeirloomMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label="Heirloom"
      className={cn("size-8 text-primary", className)}
    >
      <circle cx="16" cy="16" r="14.25" fill="none" stroke="currentColor" strokeWidth="1.25" opacity="0.35" />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.75">
        <path d="M16 15V8.5" />
        <path d="M16 17.5c0 3.2-2.1 4.4-5.1 5.2" />
        <path d="M16 17.5c0 3.2 2.1 4.4 5.1 5.2" />
      </g>
      <circle cx="16" cy="8" r="2.6" fill="var(--brass)" />
      <circle cx="10.4" cy="23.6" r="2.2" fill="currentColor" />
      <circle cx="21.6" cy="23.6" r="2.2" fill="currentColor" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

/** Primary lockup: mark + wordmark. */
export function HeirloomLogo({
  className,
  markClassName,
  wordClassName,
}: {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <HeirloomMark className={cn("size-7", markClassName)} />
      <span className={cn("font-display text-lg leading-none text-gradient-brand", wordClassName)}>Heirloom</span>
    </span>
  );
}
