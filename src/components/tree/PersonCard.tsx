import { ChevronDown, ChevronUp, Plus } from "lucide-react";

import { GenderIcon } from "@/components/tree/GenderIcon";
import {
  CARD_H,
  CARD_W,
  birthFacts,
  deathFacts,
  formatDateFacts,
  initials,
  isUnknownDate,
  shortName,
  type GenderOption,
  type LayoutNode,
} from "@/lib/genealogy";
import { cn } from "@/lib/utils";

export function PersonCard({
  node,
  genders,
  isFocus,
  isSelected,
  isCollapsed,
  onSelect,
  onToggleCollapse,
  onAdd,
}: {
  node: LayoutNode;
  genders: GenderOption[];
  isFocus: boolean;
  isSelected: boolean;
  isCollapsed: boolean;
  onSelect: () => void;
  onToggleCollapse: () => void;
  onAdd: () => void;
}) {
  const p = node.person;
  const birth = birthFacts(p);
  const death = deathFacts(p);
  const hasChildren = node.childCount > 0;

  return (
    <div
      className="absolute animate-pop"
      style={{ left: node.x, top: node.y, width: CARD_W, height: CARD_H }}
      data-person-card
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "group relative flex h-full w-full items-center gap-3 rounded-xl border bg-card px-3 text-left shadow-node transition-all duration-200",
          "hover:-translate-y-0.5 hover:border-primary/60",
          isSelected && "border-primary ring-1 ring-primary",
          isFocus && !isSelected && "border-brass/70",
        )}
      >
        <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-2 text-sm font-medium text-muted-foreground">
          {p.photo_url ? (
            <img src={p.photo_url} alt={shortName(p)} className="size-full object-cover" loading="lazy" />
          ) : (
            initials(p)
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <GenderIcon gender={p.gender} genders={genders} className="size-3.5 shrink-0 text-primary" />
            <span className="truncate text-sm font-medium">{shortName(p)}</span>
          </span>
          <span className="mt-1 block truncate text-xs text-muted-foreground">
            <span className={cn(isUnknownDate(birth) && "text-unknown")}>b. {formatDateFacts(birth, { compact: true })}</span>
            {(p.is_deceased || death.precision !== "unrecorded") && (
              <span className={cn("ml-2", isUnknownDate(death) && "text-unknown")}>
                d. {formatDateFacts(death, { compact: true })}
              </span>
            )}
          </span>
          {p.occupation && <span className="mt-0.5 block truncate text-[11px] text-muted-foreground/70">{p.occupation}</span>}
        </span>
        {isFocus && (
          <span className="absolute -top-2 left-3 rounded-full bg-brass px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brass-foreground">
            Focus
          </span>
        )}
      </button>

      <div className="absolute -right-2 -top-2 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [div:hover>&]:opacity-100">
        <button
          type="button"
          onClick={onAdd}
          title="Add a relative"
          aria-label={`Add a relative of ${shortName(p)}`}
          className="grid size-6 place-items-center rounded-full border border-border bg-surface-2 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      {hasChildren && (
        <button
          type="button"
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand branch" : "Collapse branch"}
          aria-label={isCollapsed ? `Expand branch below ${shortName(p)}` : `Collapse branch below ${shortName(p)}`}
          className="absolute -bottom-3 left-1/2 grid size-6 -translate-x-1/2 place-items-center rounded-full border border-border bg-surface-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          {isCollapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
        </button>
      )}
    </div>
  );
}
