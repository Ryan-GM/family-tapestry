import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PersonFormFields, emptyDraft } from "@/components/tree/PersonForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ADD_RELATION_LABELS,
  edgesForRelation,
  impliedGender,
  shortName,
  type AddRelationKind,
  type GenderOption,
  type Graph,
  type Person,
} from "@/lib/genealogy";
import { createPerson, createRelationships, type PersonDraft } from "@/lib/tree-data";

export function AddRelativeDialog({
  open,
  onOpenChange,
  treeId,
  anchor,
  persons,
  genders,
  graph,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  treeId: string;
  anchor: Person | null;
  persons: Person[];
  genders: GenderOption[];
  graph: Graph;
  onSaved: (person: Person) => void;
}) {
  const [kind, setKind] = useState<AddRelationKind>("father");
  const [anchorId, setAnchorId] = useState<string>(anchor?.id ?? "");
  const [draft, setDraft] = useState<PersonDraft>(emptyDraft());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAnchorId(anchor?.id ?? "");
    setKind("father");
    setDraft(emptyDraft("male"));
  }, [open, anchor?.id]);

  const chooseKind = (k: AddRelationKind) => {
    setKind(k);
    const g = impliedGender(k);
    setDraft((d) => ({ ...d, gender: g ?? d.gender }));
  };

  const save = async () => {
    if (!anchorId) {
      toast.error("Choose the family member to connect to.");
      return;
    }
    setSaving(true);
    try {
      const person = await createPerson(treeId, draft);
      await createRelationships(treeId, edgesForRelation(kind, anchorId, person.id, graph));
      toast.success(`${shortName(person)} added as ${ADD_RELATION_LABELS[kind].toLowerCase()}`);
      onSaved(person);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add this person.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add a family member</DialogTitle>
          <DialogDescription>
            Fill in only what you know — everything can be corrected or connected later.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Relationship</h3>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(ADD_RELATION_LABELS) as AddRelationKind[]).map((k) => (
                  <Button
                    key={k}
                    type="button"
                    size="sm"
                    variant={kind === k ? "default" : "outline"}
                    onClick={() => chooseKind(k)}
                  >
                    {ADD_RELATION_LABELS[k]}
                  </Button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label>Connect to</Label>
                <Select value={anchorId} onValueChange={setAnchorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an existing family member" />
                  </SelectTrigger>
                  <SelectContent>
                    {persons.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {shortName(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <PersonFormFields draft={draft} setDraft={setDraft} genders={genders} treeId={treeId} />
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Adding…" : "Add family member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditPersonDialog({
  open,
  onOpenChange,
  treeId,
  draft,
  setDraft,
  genders,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  treeId: string;
  draft: PersonDraft;
  setDraft: (d: PersonDraft) => void;
  genders: GenderOption[];
  onSave: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Edit person</DialogTitle>
          <DialogDescription>Update anything you have discovered since.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-4">
          <PersonFormFields draft={draft} setDraft={setDraft} genders={genders} treeId={treeId} />
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave();
                onOpenChange(false);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
