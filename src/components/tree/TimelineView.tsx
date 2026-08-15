import { Baby, Cross, Heart } from "lucide-react";

import { buildTimeline, type Person, type Relationship } from "@/lib/genealogy";

const ICONS = { birth: Baby, death: Cross, union: Heart };

export function TimelineView({
  persons,
  relationships,
  onSelect,
}: {
  persons: Person[];
  relationships: Relationship[];
  onSelect: (id: string) => void;
}) {
  const events = buildTimeline(persons, relationships);

  if (!events.length) {
    return (
      <div className="grid h-full place-items-center p-8 text-center text-sm text-muted-foreground">
        Add a birth year, death year or marriage date and the family timeline will build itself.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-8 sm:px-10">
      <div className="mx-auto max-w-2xl">
        <h2 className="font-display text-2xl">Family timeline</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {events.length} recorded moments between {events[0]?.year} and {events[events.length - 1]?.year}.
        </p>
        <ol className="mt-8 space-y-1 border-l border-border pl-6">
          {events.map((event) => {
            const Icon = ICONS[event.kind];
            return (
              <li key={event.id} className="animate-fade-in relative py-3">
                <span className="absolute -left-[34px] grid size-6 place-items-center rounded-full border border-border bg-surface-2 text-primary">
                  <Icon className="size-3.5" />
                </span>
                <button
                  type="button"
                  onClick={() => onSelect(event.personIds[0]!)}
                  className="text-left transition-colors hover:text-primary"
                >
                  <span className="font-display text-lg text-brass">{event.year}</span>
                  <span className="ml-3 text-sm">{event.label}</span>
                  {event.detail && <span className="mt-0.5 block text-xs text-muted-foreground">{event.detail}</span>}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
