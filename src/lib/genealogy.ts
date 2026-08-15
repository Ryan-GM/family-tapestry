/**
 * Core genealogy domain model.
 *
 * The tree is stored as a graph: people are records, relationships are edges.
 * Nothing here assumes a fixed root — any person can be the viewing focus, and
 * the layout is derived on the fly from the relationship edges.
 */

export type RelationshipType = "parent" | "spouse" | "sibling" | "relative";

/** How much we actually know about a date. */
export type DatePrecision = "exact" | "approx" | "year" | "unknown" | "unrecorded";

export type Person = {
  id: string;
  tree_id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  first_name_unknown: boolean;
  last_name_unknown: boolean;
  gender: string;
  birth_precision: DatePrecision | string;
  birth_date: string | null;
  birth_year: number | null;
  death_precision: DatePrecision | string;
  death_date: string | null;
  death_year: number | null;
  is_deceased: boolean;
  birthplace: string | null;
  residence: string | null;
  occupation: string | null;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Relationship = {
  id: string;
  tree_id: string;
  /** For "parent": person_a is the parent of person_b. Otherwise symmetric. */
  person_a: string;
  person_b: string;
  relationship_type: RelationshipType | string;
  label: string | null;
  start_date: string | null;
  end_date: string | null;
};

export type GenderOption = {
  id: string;
  tree_id: string;
  value: string;
  label: string;
  icon: string;
  sort_order: number;
};

export type FamilyTree = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  start_mode: string | null;
  root_person_id: string | null;
  created_at: string;
  updated_at: string;
};

/* ------------------------------------------------------------------ naming */

export function fullName(p: Person): string {
  const first = p.first_name?.trim() || (p.first_name_unknown ? "[Name unknown]" : "Unnamed");
  const last = p.last_name?.trim() || (p.last_name_unknown ? "[Surname unknown]" : "");
  return [first, p.middle_name?.trim() || null, last].filter(Boolean).join(" ");
}

export function shortName(p: Person): string {
  const first = p.first_name?.trim() || (p.first_name_unknown ? "[Unknown]" : "Unnamed");
  const last = p.last_name?.trim() || (p.last_name_unknown ? "[?]" : "");
  return [first, last].filter(Boolean).join(" ");
}

export function initials(p: Person): string {
  const a = p.first_name?.trim()?.[0] ?? "?";
  const b = p.last_name?.trim()?.[0] ?? "";
  return (a + b).toUpperCase();
}

/* ------------------------------------------------------------------- dates */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatISO(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y) return iso;
  if (!m || !d) return String(y);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export type DateFacts = {
  precision: DatePrecision;
  date: string | null;
  year: number | null;
};

/** Human label. Distinguishes "explicitly unknown" from "not recorded yet". */
export function formatDateFacts(f: DateFacts, opts?: { compact?: boolean }): string {
  switch (f.precision) {
    case "exact":
      return f.date ? (opts?.compact ? String(new Date(f.date).getFullYear()) : formatISO(f.date)) : "Unknown";
    case "approx":
      return f.year ? `~${f.year}` : "~ Unknown";
    case "year":
      return f.year ? String(f.year) : "Unknown";
    case "unknown":
      return "Unknown";
    default:
      return "Not recorded";
  }
}

export function birthFacts(p: Person): DateFacts {
  return { precision: (p.birth_precision as DatePrecision) ?? "unrecorded", date: p.birth_date, year: p.birth_year };
}

export function deathFacts(p: Person): DateFacts {
  return { precision: (p.death_precision as DatePrecision) ?? "unrecorded", date: p.death_date, year: p.death_year };
}

/** Best-effort year for sorting/timeline purposes. */
export function yearOf(f: DateFacts): number | null {
  if (f.precision === "exact" && f.date) return Number(f.date.slice(0, 4));
  if ((f.precision === "approx" || f.precision === "year") && f.year) return f.year;
  return null;
}

export function isUnknownDate(f: DateFacts): boolean {
  return f.precision === "unknown" || (f.precision !== "unrecorded" && yearOf(f) === null);
}

export function lifespanLabel(p: Person): string {
  const b = formatDateFacts(birthFacts(p), { compact: true });
  const d = deathFacts(p);
  if (!p.is_deceased && d.precision === "unrecorded") return b;
  return `${b} – ${formatDateFacts(d, { compact: true })}`;
}

/* ------------------------------------------------------------------- graph */

export type Graph = {
  byId: Map<string, Person>;
  parentsOf: Map<string, string[]>;
  childrenOf: Map<string, string[]>;
  spousesOf: Map<string, string[]>;
  siblingEdges: Map<string, string[]>;
  relativeEdges: Map<string, string[]>;
};

function push(map: Map<string, string[]>, key: string, value: string) {
  const list = map.get(key);
  if (list) {
    if (!list.includes(value)) list.push(value);
  } else map.set(key, [value]);
}

export function buildGraph(persons: Person[], relationships: Relationship[]): Graph {
  const g: Graph = {
    byId: new Map(persons.map((p) => [p.id, p])),
    parentsOf: new Map(),
    childrenOf: new Map(),
    spousesOf: new Map(),
    siblingEdges: new Map(),
    relativeEdges: new Map(),
  };
  for (const r of relationships) {
    if (!g.byId.has(r.person_a) || !g.byId.has(r.person_b)) continue;
    if (r.relationship_type === "parent") {
      push(g.parentsOf, r.person_b, r.person_a);
      push(g.childrenOf, r.person_a, r.person_b);
    } else if (r.relationship_type === "spouse") {
      push(g.spousesOf, r.person_a, r.person_b);
      push(g.spousesOf, r.person_b, r.person_a);
    } else if (r.relationship_type === "sibling") {
      push(g.siblingEdges, r.person_a, r.person_b);
      push(g.siblingEdges, r.person_b, r.person_a);
    } else {
      push(g.relativeEdges, r.person_a, r.person_b);
      push(g.relativeEdges, r.person_b, r.person_a);
    }
  }
  return g;
}

/** Siblings = explicit sibling edges + people sharing at least one parent. */
export function siblingsOf(g: Graph, id: string): string[] {
  const out = new Set(g.siblingEdges.get(id) ?? []);
  for (const parent of g.parentsOf.get(id) ?? []) {
    for (const child of g.childrenOf.get(parent) ?? []) if (child !== id) out.add(child);
  }
  return [...out];
}

export function ancestorsOf(g: Graph, id: string): Set<string> {
  const out = new Set<string>();
  const stack = [...(g.parentsOf.get(id) ?? [])];
  while (stack.length) {
    const cur = stack.pop()!;
    if (out.has(cur)) continue;
    out.add(cur);
    stack.push(...(g.parentsOf.get(cur) ?? []));
  }
  return out;
}

export function descendantsOf(g: Graph, id: string, stopAt?: Set<string>): Set<string> {
  const out = new Set<string>();
  const stack = [...(g.childrenOf.get(id) ?? [])];
  while (stack.length) {
    const cur = stack.pop()!;
    if (out.has(cur)) continue;
    out.add(cur);
    if (stopAt?.has(cur)) continue;
    stack.push(...(g.childrenOf.get(cur) ?? []));
  }
  return out;
}

export function generationCount(g: Graph): number {
  if (g.byId.size === 0) return 0;
  const depth = new Map<string, number>();
  const visit = (id: string, seen: Set<string>): number => {
    if (depth.has(id)) return depth.get(id)!;
    if (seen.has(id)) return 1;
    seen.add(id);
    const kids = g.childrenOf.get(id) ?? [];
    const d = kids.length ? 1 + Math.max(...kids.map((k) => visit(k, seen))) : 1;
    seen.delete(id);
    depth.set(id, d);
    return d;
  };
  let max = 1;
  for (const id of g.byId.keys()) max = Math.max(max, visit(id, new Set()));
  return max;
}

/** Connected components (any relationship type) = family branches. */
export function branchCount(g: Graph): number {
  const seen = new Set<string>();
  let count = 0;
  for (const id of g.byId.keys()) {
    if (seen.has(id)) continue;
    count += 1;
    const stack = [id];
    while (stack.length) {
      const cur = stack.pop()!;
      if (seen.has(cur)) continue;
      seen.add(cur);
      stack.push(
        ...(g.parentsOf.get(cur) ?? []),
        ...(g.childrenOf.get(cur) ?? []),
        ...(g.spousesOf.get(cur) ?? []),
        ...(g.siblingEdges.get(cur) ?? []),
        ...(g.relativeEdges.get(cur) ?? []),
      );
    }
  }
  return count;
}

/* ------------------------------------------------------------------ layout */

export const CARD_W = 212;
export const CARD_H = 104;
const COUPLE_GAP = 28;
const UNIT_GAP = 40;
const ROW_H = 210;

export type LayoutNode = {
  person: Person;
  x: number;
  y: number;
  generation: number;
  hasHiddenDescendants: boolean;
  childCount: number;
};

export type LayoutEdge = {
  id: string;
  kind: "parent" | "spouse" | "sibling" | "relative";
  path: string;
};

export type LayoutResult = {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
  minX: number;
  minY: number;
};

export type LayoutOptions = {
  focusId: string | null;
  showSpouses: boolean;
  showAncestors: boolean;
  showDescendants: boolean;
  collapsed: Set<string>;
};

export function layoutTree(
  persons: Person[],
  relationships: Relationship[],
  opts: LayoutOptions,
): { graph: Graph; layout: LayoutResult } {
  const graph = buildGraph(persons, relationships);
  const focusId = opts.focusId && graph.byId.has(opts.focusId) ? opts.focusId : (persons[0]?.id ?? null);

  /* --- 1. visibility -------------------------------------------------- */
  const hidden = new Set<string>();
  if (focusId) {
    if (!opts.showAncestors) for (const id of ancestorsOf(graph, focusId)) hidden.add(id);
    if (!opts.showDescendants) for (const id of descendantsOf(graph, focusId)) hidden.add(id);
    for (const collapsedId of opts.collapsed) {
      if (hidden.has(collapsedId)) continue;
      for (const id of descendantsOf(graph, collapsedId)) hidden.add(id);
    }
    hidden.delete(focusId);
  }
  if (!opts.showSpouses) {
    for (const p of persons) {
      if (p.id === focusId || hidden.has(p.id)) continue;
      const spouseOnly =
        (graph.spousesOf.get(p.id)?.length ?? 0) > 0 &&
        (graph.parentsOf.get(p.id)?.length ?? 0) === 0 &&
        (graph.childrenOf.get(p.id)?.length ?? 0) === 0 &&
        siblingsOf(graph, p.id).length === 0;
      if (spouseOnly) hidden.add(p.id);
    }
  }
  const visible = persons.filter((p) => !hidden.has(p.id));
  const visibleIds = new Set(visible.map((p) => p.id));
  if (!visible.length) {
    return { graph, layout: { nodes: [], edges: [], width: 0, height: 0, minX: 0, minY: 0 } };
  }

  /* --- 2. generations ------------------------------------------------- */
  const gen = new Map<string, number>();
  const seed = (start: string) => {
    gen.set(start, 0);
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift()!;
      const level = gen.get(cur)!;
      const put = (id: string, value: number) => {
        if (!visibleIds.has(id) || gen.has(id)) return;
        gen.set(id, value);
        queue.push(id);
      };
      for (const parent of graph.parentsOf.get(cur) ?? []) put(parent, level - 1);
      for (const child of graph.childrenOf.get(cur) ?? []) put(child, level + 1);
      for (const spouse of graph.spousesOf.get(cur) ?? []) put(spouse, level);
      for (const sib of siblingsOf(graph, cur)) put(sib, level);
      for (const rel of graph.relativeEdges.get(cur) ?? []) put(rel, level);
    }
  };
  if (focusId && visibleIds.has(focusId)) seed(focusId);
  for (const p of visible) if (!gen.has(p.id)) seed(p.id);

  /* --- 3. couple units ------------------------------------------------ */
  type Unit = {
    id: string;
    members: string[];
    generation: number;
    x: number;
    width: number;
    children: string[];
  };
  const unitOf = new Map<string, string>();
  const units = new Map<string, Unit>();
  for (const p of visible) {
    if (unitOf.has(p.id)) continue;
    const members = [p.id];
    if (opts.showSpouses) {
      for (const spouse of graph.spousesOf.get(p.id) ?? []) {
        if (visibleIds.has(spouse) && !unitOf.has(spouse) && gen.get(spouse) === gen.get(p.id)) members.push(spouse);
      }
    }
    const unit: Unit = {
      id: `u-${p.id}`,
      members,
      generation: gen.get(p.id) ?? 0,
      x: 0,
      width: members.length * CARD_W + (members.length - 1) * COUPLE_GAP,
      children: [],
    };
    units.set(unit.id, unit);
    for (const m of members) unitOf.set(m, unit.id);
  }

  const parentUnitOf = new Map<string, string>();
  for (const unit of units.values()) {
    for (const member of unit.members) {
      for (const parent of graph.parentsOf.get(member) ?? []) {
        const pu = unitOf.get(parent);
        if (!pu || pu === unit.id) continue;
        if (!parentUnitOf.has(unit.id) && units.get(pu)!.generation < unit.generation) {
          parentUnitOf.set(unit.id, pu);
          units.get(pu)!.children.push(unit.id);
        }
        break;
      }
      if (parentUnitOf.has(unit.id)) break;
    }
  }

  /* --- 4. x positions (post-order over the unit forest) --------------- */
  let cursor = 0;
  const placed = new Set<string>();
  const place = (unitId: string) => {
    if (placed.has(unitId)) return;
    placed.add(unitId);
    const unit = units.get(unitId)!;
    const kids = unit.children.filter((c) => !placed.has(c));
    if (!kids.length) {
      unit.x = cursor + unit.width / 2;
      cursor += unit.width + UNIT_GAP;
      return;
    }
    for (const kid of kids) place(kid);
    const xs = unit.children.map((c) => units.get(c)!.x);
    unit.x = xs.reduce((a, b) => a + b, 0) / xs.length;
  };
  const roots = [...units.values()]
    .filter((u) => !parentUnitOf.has(u.id))
    .sort((a, b) => a.generation - b.generation);
  for (const root of roots) place(root.id);
  for (const unit of units.values()) place(unit.id);

  // resolve overlaps generation by generation
  const byGen = new Map<number, Unit[]>();
  for (const unit of units.values()) {
    const list = byGen.get(unit.generation) ?? [];
    list.push(unit);
    byGen.set(unit.generation, list);
  }
  for (const list of byGen.values()) {
    list.sort((a, b) => a.x - b.x);
    let prevRight = -Infinity;
    for (const unit of list) {
      const left = unit.x - unit.width / 2;
      if (left < prevRight + UNIT_GAP) unit.x = prevRight + UNIT_GAP + unit.width / 2;
      prevRight = unit.x + unit.width / 2;
    }
  }

  /* --- 5. nodes ------------------------------------------------------- */
  const pos = new Map<string, { x: number; y: number }>();
  const nodes: LayoutNode[] = [];
  for (const unit of units.values()) {
    const y = unit.generation * ROW_H;
    unit.members.forEach((memberId, i) => {
      const x = unit.x - unit.width / 2 + i * (CARD_W + COUPLE_GAP);
      pos.set(memberId, { x, y });
      const person = graph.byId.get(memberId)!;
      const kids = graph.childrenOf.get(memberId) ?? [];
      nodes.push({
        person,
        x,
        y,
        generation: unit.generation,
        childCount: kids.length,
        hasHiddenDescendants: kids.length > 0 && kids.some((k) => !visibleIds.has(k)),
      });
    });
  }

  /* --- 6. edges ------------------------------------------------------- */
  const edges: LayoutEdge[] = [];
  const cx = (id: string) => pos.get(id)!.x + CARD_W / 2;
  const top = (id: string) => pos.get(id)!.y;
  const bottom = (id: string) => pos.get(id)!.y + CARD_H;

  for (const r of relationships) {
    const a = r.person_a;
    const b = r.person_b;
    if (!pos.has(a) || !pos.has(b)) continue;
    if (r.relationship_type === "parent") {
      const partner = (graph.spousesOf.get(a) ?? []).find((s) => pos.has(s) && (graph.parentsOf.get(b) ?? []).includes(s));
      const startX = partner ? (cx(a) + cx(partner)) / 2 : cx(a);
      const startY = partner ? (bottom(a) + bottom(partner)) / 2 - CARD_H / 2 : bottom(a);
      if (partner && a > partner && (graph.parentsOf.get(b) ?? []).includes(partner)) continue; // draw once per couple
      const midY = (startY + top(b)) / 2;
      edges.push({
        id: r.id,
        kind: "parent",
        path: `M ${startX} ${startY} L ${startX} ${midY} L ${cx(b)} ${midY} L ${cx(b)} ${top(b)}`,
      });
    } else if (r.relationship_type === "spouse") {
      const [l, rr] = pos.get(a)!.x <= pos.get(b)!.x ? [a, b] : [b, a];
      const y = pos.get(l)!.y + CARD_H / 2;
      edges.push({
        id: r.id,
        kind: "spouse",
        path: `M ${pos.get(l)!.x + CARD_W} ${y} L ${pos.get(rr)!.x} ${pos.get(rr)!.y + CARD_H / 2}`,
      });
    } else {
      const [l, rr] = pos.get(a)!.x <= pos.get(b)!.x ? [a, b] : [b, a];
      const y1 = pos.get(l)!.y + CARD_H / 2;
      const y2 = pos.get(rr)!.y + CARD_H / 2;
      const x1 = pos.get(l)!.x + CARD_W;
      const x2 = pos.get(rr)!.x;
      const dx = Math.max(40, (x2 - x1) / 2);
      edges.push({
        id: r.id,
        kind: r.relationship_type === "sibling" ? "sibling" : "relative",
        path: `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`,
      });
    }
  }

  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs) - 80;
  const minY = Math.min(...ys) - 80;
  const width = Math.max(...xs) + CARD_W + 80 - minX;
  const height = Math.max(...ys) + CARD_H + 80 - minY;

  return { graph, layout: { nodes, edges, width, height, minX, minY } };
}

/* ---------------------------------------------------------------- timeline */

export type TimelineEvent = {
  id: string;
  year: number;
  label: string;
  detail: string;
  kind: "birth" | "death" | "union";
  personIds: string[];
};

export function buildTimeline(persons: Person[], relationships: Relationship[]): TimelineEvent[] {
  const byId = new Map(persons.map((p) => [p.id, p]));
  const events: TimelineEvent[] = [];
  for (const p of persons) {
    const b = yearOf(birthFacts(p));
    if (b) {
      events.push({
        id: `b-${p.id}`,
        year: b,
        kind: "birth",
        label: `${shortName(p)} is born`,
        detail: [p.birthplace, formatDateFacts(birthFacts(p))].filter(Boolean).join(" · "),
        personIds: [p.id],
      });
    }
    const d = yearOf(deathFacts(p));
    if (d) {
      events.push({
        id: `d-${p.id}`,
        year: d,
        kind: "death",
        label: `${shortName(p)} dies`,
        detail: formatDateFacts(deathFacts(p)),
        personIds: [p.id],
      });
    }
  }
  for (const r of relationships) {
    if (r.relationship_type !== "spouse" || !r.start_date) continue;
    const a = byId.get(r.person_a);
    const b = byId.get(r.person_b);
    if (!a || !b) continue;
    events.push({
      id: `m-${r.id}`,
      year: Number(r.start_date.slice(0, 4)),
      kind: "union",
      label: `${shortName(a)} & ${shortName(b)} marry`,
      detail: r.label ?? "Marriage",
      personIds: [a.id, b.id],
    });
  }
  return events.sort((x, y) => x.year - y.year);
}

/* ------------------------------------------------------------------ search */

export function matchesQuery(p: Person, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return false;
  const haystack = [
    fullName(p),
    p.occupation,
    p.birthplace,
    p.residence,
    p.gender,
    String(yearOf(birthFacts(p)) ?? ""),
    String(yearOf(deathFacts(p)) ?? ""),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

/* ------------------------------------------------- relationship vocabulary */

export type AddRelationKind =
  | "father"
  | "mother"
  | "parent"
  | "spouse"
  | "son"
  | "daughter"
  | "child"
  | "sibling"
  | "relative";

export const ADD_RELATION_LABELS: Record<AddRelationKind, string> = {
  father: "Father",
  mother: "Mother",
  parent: "Parent",
  spouse: "Spouse / Partner",
  son: "Son",
  daughter: "Daughter",
  child: "Child",
  sibling: "Sibling",
  relative: "Relative (unknown link)",
};

/** Gender pre-fill implied by the chosen relationship, if any. */
export function impliedGender(kind: AddRelationKind): string | null {
  if (kind === "father" || kind === "son") return "male";
  if (kind === "mother" || kind === "daughter") return "female";
  return null;
}

/**
 * Edges to create when adding `newId` as `kind` of `anchorId`.
 * Everything stays in the graph model — no duplicated person records.
 */
export function edgesForRelation(
  kind: AddRelationKind,
  anchorId: string,
  newId: string,
  graph: Graph,
): Array<{ person_a: string; person_b: string; relationship_type: RelationshipType }> {
  const edges: Array<{ person_a: string; person_b: string; relationship_type: RelationshipType }> = [];
  switch (kind) {
    case "father":
    case "mother":
    case "parent":
      edges.push({ person_a: newId, person_b: anchorId, relationship_type: "parent" });
      // the new parent's partner also parents the anchor's known siblings? keep it minimal:
      for (const spouse of graph.spousesOf.get(anchorId) ?? []) void spouse;
      break;
    case "spouse":
      edges.push({ person_a: anchorId, person_b: newId, relationship_type: "spouse" });
      break;
    case "son":
    case "daughter":
    case "child": {
      edges.push({ person_a: anchorId, person_b: newId, relationship_type: "parent" });
      for (const spouse of graph.spousesOf.get(anchorId) ?? []) {
        edges.push({ person_a: spouse, person_b: newId, relationship_type: "parent" });
      }
      break;
    }
    case "sibling": {
      const parents = graph.parentsOf.get(anchorId) ?? [];
      if (parents.length) {
        for (const parent of parents) edges.push({ person_a: parent, person_b: newId, relationship_type: "parent" });
      } else {
        edges.push({ person_a: anchorId, person_b: newId, relationship_type: "sibling" });
      }
      break;
    }
    case "relative":
      edges.push({ person_a: anchorId, person_b: newId, relationship_type: "relative" });
      break;
  }
  return edges;
}

export function relationshipSummary(graph: Graph, id: string) {
  const parents = (graph.parentsOf.get(id) ?? []).map((p) => graph.byId.get(p)!).filter(Boolean);
  const children = (graph.childrenOf.get(id) ?? []).map((p) => graph.byId.get(p)!).filter(Boolean);
  const spouses = (graph.spousesOf.get(id) ?? []).map((p) => graph.byId.get(p)!).filter(Boolean);
  const siblings = siblingsOf(graph, id)
    .map((p) => graph.byId.get(p)!)
    .filter(Boolean);
  const relatives = (graph.relativeEdges.get(id) ?? []).map((p) => graph.byId.get(p)!).filter(Boolean);
  return { parents, children, spouses, siblings, relatives };
}
