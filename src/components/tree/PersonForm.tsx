import { useState } from "react";

import { GENDER_ICON_CHOICES } from "@/components/tree/GenderIcon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { GenderOption, Person } from "@/lib/genealogy";
import { addGenderOption, type PersonDraft } from "@/lib/tree-data";

const PRECISIONS = [
  { value: "exact", label: "Exact date" },
  { value: "year", label: "Year only" },
  { value: "approx", label: "Approximate (~year)" },
  { value: "unknown", label: "Unknown" },
  { value: "unrecorded", label: "Not recorded yet" },
];

export function emptyDraft(gender = "unspecified"): PersonDraft {
  return {
    first_name: null,
    middle_name: null,
    last_name: null,
    first_name_unknown: false,
    last_name_unknown: false,
    gender,
    birth_precision: "unrecorded",
    birth_date: null,
    birth_year: null,
    death_precision: "unrecorded",
    death_date: null,
    death_year: null,
    is_deceased: false,
    birthplace: null,
    residence: null,
    occupation: null,
    notes: null,
    photo_url: null,
  };
}

export function draftFromPerson(p: Person): PersonDraft {
  return {
    first_name: p.first_name,
    middle_name: p.middle_name,
    last_name: p.last_name,
    first_name_unknown: p.first_name_unknown,
    last_name_unknown: p.last_name_unknown,
    gender: p.gender,
    birth_precision: p.birth_precision,
    birth_date: p.birth_date,
    birth_year: p.birth_year,
    death_precision: p.death_precision,
    death_date: p.death_date,
    death_year: p.death_year,
    is_deceased: p.is_deceased,
    birthplace: p.birthplace,
    residence: p.residence,
    occupation: p.occupation,
    notes: p.notes,
    photo_url: p.photo_url,
  };
}

const nullify = (v: string) => (v.trim() === "" ? null : v);

function DateFields({
  legend,
  precision,
  date,
  year,
  onChange,
}: {
  legend: string;
  precision: string;
  date: string | null;
  year: number | null;
  onChange: (patch: { precision?: string; date?: string | null; year?: number | null }) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{legend}</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        <Select value={precision} onValueChange={(v) => onChange({ precision: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRECISIONS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {precision === "exact" && (
          <Input type="date" value={date ?? ""} onChange={(e) => onChange({ date: nullify(e.target.value) })} />
        )}
        {(precision === "year" || precision === "approx") && (
          <Input
            type="number"
            inputMode="numeric"
            placeholder="e.g. 1942"
            value={year ?? ""}
            onChange={(e) => onChange({ year: e.target.value ? Number(e.target.value) : null })}
          />
        )}
      </div>
    </div>
  );
}

export function PersonFormFields({
  draft,
  setDraft,
  genders,
  treeId,
  onGendersChanged,
}: {
  draft: PersonDraft;
  setDraft: (d: PersonDraft) => void;
  genders: GenderOption[];
  treeId: string;
  onGendersChanged?: () => void;
}) {
  const [showGenderAdd, setShowGenderAdd] = useState(false);
  const [newGender, setNewGender] = useState({ label: "", icon: "user" });
  const patch = (p: Partial<PersonDraft>) => setDraft({ ...draft, ...p });

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Basic information</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="first">First name</Label>
            <Input
              id="first"
              value={draft.first_name ?? ""}
              placeholder="Optional"
              onChange={(e) => patch({ first_name: nullify(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="middle">Middle name</Label>
            <Input
              id="middle"
              value={draft.middle_name ?? ""}
              onChange={(e) => patch({ middle_name: nullify(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last">Last name</Label>
            <Input
              id="last"
              value={draft.last_name ?? ""}
              disabled={draft.last_name_unknown}
              onChange={(e) => patch({ last_name: nullify(e.target.value) })}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={draft.first_name_unknown}
              onCheckedChange={(v) => patch({ first_name_unknown: Boolean(v) })}
            />
            First name unknown
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={draft.last_name_unknown}
              onCheckedChange={(v) => patch({ last_name_unknown: Boolean(v), last_name: v ? null : draft.last_name })}
            />
            Surname unknown
          </label>
        </div>

        <div className="space-y-1.5">
          <Label>Gender</Label>
          <div className="flex gap-2">
            <Select value={draft.gender} onValueChange={(v) => patch({ gender: v })}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {genders.map((g) => (
                  <SelectItem key={g.id} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={() => setShowGenderAdd((s) => !s)}>
              Add option
            </Button>
          </div>
          {showGenderAdd && (
            <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-surface p-2">
              <Input
                className="w-40"
                placeholder="Label"
                value={newGender.label}
                onChange={(e) => setNewGender({ ...newGender, label: e.target.value })}
              />
              <Select value={newGender.icon} onValueChange={(v) => setNewGender({ ...newGender, icon: v })}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_ICON_CHOICES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                disabled={!newGender.label.trim()}
                onClick={async () => {
                  await addGenderOption(treeId, newGender.label, newGender.icon);
                  setNewGender({ label: "", icon: "user" });
                  setShowGenderAdd(false);
                  onGendersChanged?.();
                }}
              >
                Save
              </Button>
            </div>
          )}
        </div>

        <DateFields
          legend="Date of birth"
          precision={draft.birth_precision}
          date={draft.birth_date}
          year={draft.birth_year}
          onChange={(p) =>
            patch({
              birth_precision: p.precision ?? draft.birth_precision,
              birth_date: "date" in p ? p.date! : draft.birth_date,
              birth_year: "year" in p ? p.year! : draft.birth_year,
            })
          }
        />

        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={draft.is_deceased} onCheckedChange={(v) => patch({ is_deceased: Boolean(v) })} />
          This person has passed away
        </label>

        {draft.is_deceased && (
          <DateFields
            legend="Date of death"
            precision={draft.death_precision}
            date={draft.death_date}
            year={draft.death_year}
            onChange={(p) =>
              patch({
                death_precision: p.precision ?? draft.death_precision,
                death_date: "date" in p ? p.date! : draft.death_date,
                death_year: "year" in p ? p.year! : draft.death_year,
              })
            }
          />
        )}

        <div className="space-y-1.5">
          <Label htmlFor="photo">Profile photo URL</Label>
          <Input
            id="photo"
            placeholder="https://…"
            value={draft.photo_url ?? ""}
            onChange={(e) => patch({ photo_url: nullify(e.target.value) })}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Additional information</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="birthplace">Birthplace</Label>
            <Input
              id="birthplace"
              value={draft.birthplace ?? ""}
              onChange={(e) => patch({ birthplace: nullify(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="residence">Residence</Label>
            <Input
              id="residence"
              value={draft.residence ?? ""}
              onChange={(e) => patch({ residence: nullify(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="occupation">Occupation</Label>
            <Input
              id="occupation"
              value={draft.occupation ?? ""}
              onChange={(e) => patch({ occupation: nullify(e.target.value) })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Biography / notes</Label>
          <Textarea
            id="notes"
            rows={4}
            value={draft.notes ?? ""}
            placeholder="Anything you know — stories, sources, uncertainties."
            onChange={(e) => patch({ notes: nullify(e.target.value) })}
          />
        </div>
      </section>
    </div>
  );
}
