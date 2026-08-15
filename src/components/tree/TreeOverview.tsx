import { Cake, GitBranch, History, Layers, Users } from "lucide-react";

import {
  birthFacts,
  branchCount,
  buildGraph,
  formatDateFacts,
  generationCount,
  shortName,
  yearOf,
  type Person,
  type Relationship,
} from "@/lib/genealogy";

function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="surface-panel p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5 text-primary" /> {label}
      </div>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}

function daysToBirthday(p: Person): number | null {
  const b = p.birth_date;
  if (!b || p.is_deceased) return null;
  const now = new Date();
  const [, m, d] = b.split("-").map(Number);
  if (!m || !d) return null;
  let next = new Date(Date.UTC(now.getUTCFullYear(), m - 1, d));
  if (next.getTime() < now.getTime()) next = new Date(Date.UTC(now.getUTCFullYear() + 1, m - 1, d));
  return Math.round((next.getTime() - now.getTime()) / 86400000);
}

export function TreeOverview({
  persons,
  relationships,
  onSelect,
}: {
  persons: Person[];
  relationships: Relationship[];
  onSelect: (id: string) => void;
}) {
  const graph = buildGraph(persons, relationships);
  const withYear = persons
    .map((p) => ({ p, year: yearOf(birthFacts(p)) }))
    .filter((x): x is { p: Person; year: number } => x.year !== null)
    .sort((a, b) => a.year - b.year);
  const oldest = withYear[0]?.p ?? null;
  const ancestorsKnown = persons.filter((p) => (graph.childrenOf.get(p.id) ?? []).length > 0).length;
  const recent = [...persons].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);
  const updated = [...persons].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 5);
  const birthdays = persons
    .map((p) => ({ p, days: daysToBirthday(p) }))
    .filter((x): x is { p: Person; days: number } => x.days !== null && x.days <= 90)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  const list = (title: string, items: Person[], render: (p: Person) => string) => (
    <div className="surface-panel p-4">
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.length ? (
          items.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => onSelect(p.id)} className="text-sm transition-colors hover:text-primary">
                {shortName(p)} <span className="text-muted-foreground">· {render(p)}</span>
              </button>
            </li>
          ))
        ) : (
          <li className="text-sm text-muted-foreground">Nothing yet.</li>
        )}
      </ul>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Family members" value={persons.length} icon={Users} />
          <Stat label="Generations" value={generationCount(graph)} icon={Layers} />
          <Stat label="Known ancestors" value={ancestorsKnown} icon={History} />
          <Stat label="Family branches" value={branchCount(graph)} icon={GitBranch} />
        </div>

        <div className="surface-panel flex items-center gap-3 p-4">
          <Cake className="size-4 text-brass" />
          <div>
            <p className="text-sm font-medium">Oldest known family member</p>
            <p className="text-sm text-muted-foreground">
              {oldest ? `${shortName(oldest)} · born ${formatDateFacts(birthFacts(oldest))}` : "No birth years recorded yet."}
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {list("Recently added", recent, (p) => new Date(p.created_at).toLocaleDateString())}
          {list("Recently updated", updated, (p) => new Date(p.updated_at).toLocaleDateString())}
          <div className="surface-panel p-4">
            <h3 className="text-sm font-medium">Upcoming birthdays</h3>
            <ul className="mt-3 space-y-2">
              {birthdays.length ? (
                birthdays.map(({ p, days }) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(p.id)}
                      className="text-sm transition-colors hover:text-primary"
                    >
                      {shortName(p)} <span className="text-muted-foreground">· in {days} days</span>
                    </button>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">No full birth dates in the next 90 days.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
