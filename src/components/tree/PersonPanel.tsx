import { CalendarClock, MapPin, Pencil, Plus, Trash2, Users } from "lucide-react";

import { GenderIcon, genderLabel } from "@/components/tree/GenderIcon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  birthFacts,
  deathFacts,
  formatDateFacts,
  fullName,
  isUnknownDate,
  relationshipSummary,
  shortName,
  type GenderOption,
  type Graph,
  type Person,
} from "@/lib/genealogy";
import { cn } from "@/lib/utils";

function Row({ label, value, unknown }: { label: string; value: string; unknown?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right", unknown && "text-unknown")}>{value}</span>
    </div>
  );
}

export function PersonPanel({
  person,
  graph,
  genders,
  canEdit,
  onClose,
  onEdit,
  onAddRelative,
  onFocus,
  onSelect,
  onDelete,
  onViewTimeline,
}: {
  person: Person;
  graph: Graph;
  genders: GenderOption[];
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
  onAddRelative: () => void;
  onFocus: () => void;
  onSelect: (id: string) => void;
  onDelete: () => void;
  onViewTimeline: () => void;
}) {
  const family = relationshipSummary(graph, person.id);
  const birth = birthFacts(person);
  const death = deathFacts(person);

  const group = (label: string, people: Person[]) =>
    people.length ? (
      <div className="py-1.5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {people.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs transition-colors hover:border-primary hover:text-primary"
            >
              {shortName(p)}
            </button>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <aside className="animate-rise flex h-full w-full flex-col overflow-hidden border-l border-border bg-surface md:w-[360px]">
      <div className="flex items-start gap-3 p-4">
        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2 text-muted-foreground">
          {person.photo_url ? (
            <img src={person.photo_url} alt={fullName(person)} className="size-full object-cover" />
          ) : (
            <Users className="size-6" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-xl">{fullName(person)}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <GenderIcon gender={person.gender} genders={genders} className="text-primary" />
            {genderLabel(person.gender, genders)}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close details">
          ✕
        </Button>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto p-4">
        <Row label="Born" value={formatDateFacts(birth)} unknown={isUnknownDate(birth)} />
        {(person.is_deceased || death.precision !== "unrecorded") && (
          <Row label="Died" value={formatDateFacts(death)} unknown={isUnknownDate(death)} />
        )}
        {person.birthplace && <Row label="Birthplace" value={person.birthplace} />}
        {person.residence && <Row label="Residence" value={person.residence} />}
        {person.occupation && <Row label="Occupation" value={person.occupation} />}

        <Separator className="my-3" />
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Family</p>
        <div className="mt-2">
          {group("Parents", family.parents)}
          {group("Spouses / partners", family.spouses)}
          {group("Siblings", family.siblings)}
          {group("Children", family.children)}
          {group("Relatives (link unconfirmed)", family.relatives)}
          {!family.parents.length &&
            !family.spouses.length &&
            !family.siblings.length &&
            !family.children.length &&
            !family.relatives.length && (
              <p className="text-sm text-muted-foreground">No relatives connected yet.</p>
            )}
        </div>

        {person.notes && (
          <>
            <Separator className="my-3" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Biography</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{person.notes}</p>
          </>
        )}
      </div>

      <Separator />
      <div className="grid grid-cols-2 gap-2 p-3">
        <Button variant="secondary" onClick={onFocus}>
          <MapPin /> View family
        </Button>
        <Button variant="secondary" onClick={onViewTimeline}>
          <CalendarClock /> Timeline
        </Button>
        {canEdit && (
          <>
            <Button variant="outline" onClick={onEdit}>
              <Pencil /> Edit
            </Button>
            <Button onClick={onAddRelative}>
              <Plus /> Add relative
            </Button>
            <Button variant="ghost" className="col-span-2 text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 /> Remove from tree
            </Button>
          </>
        )}
      </div>
    </aside>
  );
}
