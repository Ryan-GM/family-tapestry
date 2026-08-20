import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AddRelativeDialog, EditPersonDialog } from "@/components/tree/AddRelativeDialog";
import { PersonFormFields, draftFromPerson, emptyDraft } from "@/components/tree/PersonForm";
import { PersonPanel } from "@/components/tree/PersonPanel";
import { SharingPanel } from "@/components/tree/SharingPanel";
import { TimelineView } from "@/components/tree/TimelineView";
import { TreeCanvas } from "@/components/tree/TreeCanvas";
import { TreeOverview } from "@/components/tree/TreeOverview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { layoutTree, matchesQuery, shortName } from "@/lib/genealogy";
import { seo } from "@/lib/site";
import {
  createPerson,
  deletePerson,
  setRootPerson,
  treeBundleQuery,
  updatePerson,
  type PersonDraft,
} from "@/lib/tree-data";

export const Route = createFileRoute("/_authenticated/trees/$treeId")({
  head: () =>
    seo({
      title: "Family tree canvas — Heirloom",
      description: "Explore, expand and edit your family tree on an interactive canvas.",
      indexable: false,
    }),
  component: TreeWorkspace,
});

function TreeWorkspace() {
  const { treeId } = Route.useParams();
  const queryClient = useQueryClient();
  const bundle = useQuery(treeBundleQuery(treeId));

  const [view, setView] = useState<"tree" | "timeline" | "overview" | "sharing">("tree");
  const [focusId, setFocusId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [showSpouses, setShowSpouses] = useState(true);
  const [showAncestors, setShowAncestors] = useState(true);
  const [showDescendants, setShowDescendants] = useState(true);
  const [query, setQuery] = useState("");
  const [centerOn, setCenterOn] = useState<{ id: string | null; nonce: number }>({ id: null, nonce: 0 });
  const [addOpen, setAddOpen] = useState(false);
  const [addAnchorId, setAddAnchorId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<PersonDraft | null>(null);
  const [firstDraft, setFirstDraft] = useState<PersonDraft>(emptyDraft());
  const [savingFirst, setSavingFirst] = useState(false);

  const persons = bundle.data?.persons ?? [];
  const relationships = bundle.data?.relationships ?? [];
  const genders = bundle.data?.genders ?? [];
  const canEdit = bundle.data?.canEdit ?? false;

  const effectiveFocus = focusId ?? bundle.data?.tree.root_person_id ?? persons[0]?.id ?? null;

  const { graph, layout } = useMemo(
    () =>
      layoutTree(persons, relationships, {
        focusId: effectiveFocus,
        showSpouses,
        showAncestors,
        showDescendants,
        collapsed,
      }),
    [persons, relationships, effectiveFocus, showSpouses, showAncestors, showDescendants, collapsed],
  );

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["family-tree", treeId] });
  const selected = persons.find((p) => p.id === selectedId) ?? null;
  const results = query.trim() ? persons.filter((p) => matchesQuery(p, query)).slice(0, 8) : [];

  const focusPerson = (id: string) => {
    setFocusId(id);
    setSelectedId(id);
    setView("tree");
    setCenterOn({ id, nonce: Date.now() });
  };

  if (bundle.isError) {
    return (
      <main className="grid min-h-screen place-items-center p-8 text-center">
        <div>
          <h1 className="font-display text-2xl">This tree isn't available</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {bundle.error instanceof Error ? bundle.error.message : "Unknown error."}
          </p>
          <Link to="/trees" className="mt-4 inline-block text-sm text-primary">
            Back to your trees
          </Link>
        </div>
      </main>
    );
  }

  if (!bundle.data) {
    return <main className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading family…</main>;
  }

  /* First person — the tree's starting point (not its origin). */
  if (!persons.length) {
    return (
      <main className="star-field min-h-screen px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <Link to="/trees" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="size-4" /> Your trees
          </Link>
          <h1 className="mt-8 font-display text-3xl">Who is the first person you know?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            They become your starting point — not the origin of the family. You can add people above and below them later.
          </p>
          <div className="surface-panel mt-6 p-5">
            <PersonFormFields draft={firstDraft} setDraft={setFirstDraft} genders={genders} treeId={treeId} onGendersChanged={refresh} />
            <Button
              className="mt-5"
              disabled={savingFirst}
              onClick={async () => {
                setSavingFirst(true);
                try {
                  const person = await createPerson(treeId, firstDraft);
                  await setRootPerson(treeId, person.id);
                  await refresh();
                  focusPerson(person.id);
                  toast.success(`${shortName(person)} added. Now add anyone connected to them.`);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not save.");
                } finally {
                  setSavingFirst(false);
                }
              }}
            >
              {savingFirst ? "Saving…" : "Add starting person"}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-2.5">
        <Link to="/trees" className="text-muted-foreground transition-colors hover:text-primary" aria-label="Back to trees">
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="font-display text-lg">{bundle.data.tree.name}</h1>
        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          {bundle.data.role}
        </span>

        <div className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search name, year, place, job…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {results.length > 0 && (
            <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-panel">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      focusPerson(p.id);
                      setQuery("");
                    }}
                  >
                    {shortName(p)}
                    <span className="ml-2 text-xs text-muted-foreground">{p.occupation ?? p.birthplace ?? ""}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList>
            <TabsTrigger value="tree">Tree</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="overview">Dashboard</TabsTrigger>
            <TabsTrigger value="sharing">Sharing</TabsTrigger>
          </TabsList>
        </Tabs>

        {canEdit && (
          <Button
            size="sm"
            onClick={() => {
              setAddAnchorId(selectedId ?? effectiveFocus);
              setAddOpen(true);
            }}
          >
            Add family member
          </Button>
        )}
      </header>

      {view === "tree" && (
        <div className="flex flex-wrap items-center gap-4 border-b border-border bg-surface/60 px-4 py-2 text-xs text-muted-foreground">
          <label className="flex items-center gap-2">
            <Switch checked={showAncestors} onCheckedChange={setShowAncestors} /> Ancestors
          </label>
          <label className="flex items-center gap-2">
            <Switch checked={showDescendants} onCheckedChange={setShowDescendants} /> Descendants
          </label>
          <label className="flex items-center gap-2">
            <Switch checked={showSpouses} onCheckedChange={setShowSpouses} /> Spouses
          </label>
          {collapsed.size > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setCollapsed(new Set())}>
              Expand all branches
            </Button>
          )}
          <span className="ml-auto">
            {layout.nodes.length} of {persons.length} people shown
          </span>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          {view === "tree" && (
            <TreeCanvas
              layout={layout}
              genders={genders}
              focusId={effectiveFocus}
              selectedId={selectedId}
              collapsed={collapsed}
              centerOn={centerOn}
              onSelect={setSelectedId}
              onToggleCollapse={(id) =>
                setCollapsed((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })
              }
              onAdd={(id) => {
                setAddAnchorId(id);
                setAddOpen(true);
              }}
            />
          )}
          {view === "timeline" && (
            <TimelineView persons={persons} relationships={relationships} onSelect={focusPerson} />
          )}
          {view === "overview" && (
            <TreeOverview persons={persons} relationships={relationships} onSelect={focusPerson} />
          )}
          {view === "sharing" && (
            <SharingPanel
              treeId={treeId}
              members={bundle.data.members}
              isOwner={bundle.data.role === "owner"}
              onChanged={refresh}
            />
          )}
        </div>

        {selected && view !== "sharing" && (
          <PersonPanel
            person={selected}
            graph={graph}
            genders={genders}
            canEdit={canEdit}
            onClose={() => setSelectedId(null)}
            onEdit={() => setEditDraft(draftFromPerson(selected))}
            onAddRelative={() => {
              setAddAnchorId(selected.id);
              setAddOpen(true);
            }}
            onFocus={() => focusPerson(selected.id)}
            onSelect={(id) => setSelectedId(id)}
            onViewTimeline={() => setView("timeline")}
            onDelete={async () => {
              await deletePerson(selected.id);
              setSelectedId(null);
              await refresh();
              toast.success("Person removed.");
            }}
          />
        )}
      </div>

      <AddRelativeDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        treeId={treeId}
        anchor={persons.find((p) => p.id === addAnchorId) ?? null}
        persons={persons}
        genders={genders}
        graph={graph}
        onSaved={async (person) => {
          await refresh();
          setSelectedId(person.id);
        }}
      />

      {editDraft && selected && (
        <EditPersonDialog
          open
          onOpenChange={(v) => !v && setEditDraft(null)}
          treeId={treeId}
          draft={editDraft}
          setDraft={setEditDraft}
          genders={genders}
          onSave={async () => {
            await updatePerson(selected.id, editDraft);
            await refresh();
            setEditDraft(null);
            toast.success("Saved.");
          }}
        />
      )}
    </main>
  );
}
