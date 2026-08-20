import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { createTree, treesQuery } from "@/lib/tree-data";
import { HeirloomLogo } from "@/components/brand/HeirloomLogo";
import { seo } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/trees/")({
  head: () =>
    seo({
      title: "Your family trees — Heirloom",
      description: "All the private family trees you own or have been invited to.",
      indexable: false,
    }),
  component: TreesPage,
});

const START_MODES = [
  { value: "myself", label: "Start with myself", hint: "The most common way in." },
  { value: "family_member", label: "Start with a family member", hint: "A parent, sibling or cousin." },
  { value: "ancestor", label: "Start with an ancestor", hint: "A grandparent or older, if that's who you know." },
  { value: "someone_else", label: "Start with someone else", hint: "Any person at all — decide the link later." },
];

function TreesPage() {
  const navigate = useNavigate();
  const trees = useQuery(treesQuery());
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startMode, setStartMode] = useState("myself");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      const tree = await createTree({ name: name.trim() || "My family", description, startMode });
      await navigate({ to: "/trees/$treeId", params: { treeId: tree.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the tree.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="star-field min-h-screen px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between">
          <Link to="/" aria-label="Heirloom home">
            <HeirloomLogo />
          </Link>
          <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut().then(() => navigate({ to: "/auth" }))}>
            Sign out
          </Button>
        </header>

        <h1 className="mt-10 font-display text-3xl">Your family trees</h1>
        <p className="mt-1 text-sm text-muted-foreground">Private by default. Invite relatives when you're ready.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {trees.data?.map((tree) => (
            <Link
              key={tree.id}
              to="/trees/$treeId"
              params={{ treeId: tree.id }}
              className="surface-panel block p-4 transition-colors hover:border-primary"
            >
              <h2 className="font-display text-xl">{tree.name}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {tree.description || "No description yet."}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Updated {new Date(tree.updated_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
          {trees.isSuccess && !trees.data.length && !creating && (
            <p className="text-sm text-muted-foreground">Nothing here yet — create your first tree below.</p>
          )}
        </div>

        {creating ? (
          <div className="surface-panel mt-6 space-y-5 p-5">
            <div>
              <h2 className="font-display text-2xl">Where would you like to start?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You don't need to know your oldest ancestor. Pick any starting point — it's only a starting point.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {START_MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setStartMode(m.value)}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    startMode === m.value ? "border-primary bg-surface-2" : "border-border hover:border-primary/60"
                  }`}
                >
                  <span className="text-sm font-medium">{m.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{m.hint}</span>
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tree-name">Tree name</Label>
              <Input id="tree-name" value={name} placeholder="The Mwangi family" onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tree-desc">Description</Label>
              <Textarea id="tree-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={create} disabled={busy}>
                {busy ? "Creating…" : "Create tree"}
              </Button>
              <Button variant="ghost" onClick={() => setCreating(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button className="mt-6" onClick={() => setCreating(true)}>
            New family tree
          </Button>
        )}
      </div>
    </main>
  );
}
