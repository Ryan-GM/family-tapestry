import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { FamilyTree, GenderOption, Person, Relationship, RelationshipType } from "@/lib/genealogy";

export type TreeRole = "owner" | "editor" | "viewer";

export type TreeMember = {
  id: string;
  tree_id: string;
  user_id: string | null;
  invited_email: string | null;
  role: TreeRole;
  created_at: string;
};

export type TreeBundle = {
  tree: FamilyTree;
  persons: Person[];
  relationships: Relationship[];
  genders: GenderOption[];
  members: TreeMember[];
  role: TreeRole;
  canEdit: boolean;
};

export const treesQuery = () =>
  queryOptions({
    queryKey: ["family-trees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_trees")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as FamilyTree[];
    },
  });

export const treeBundleQuery = (treeId: string) =>
  queryOptions({
    queryKey: ["family-tree", treeId],
    queryFn: async (): Promise<TreeBundle> => {
      const [{ data: user }, tree, persons, relationships, genders, members] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("family_trees").select("*").eq("id", treeId).maybeSingle(),
        supabase.from("persons").select("*").eq("tree_id", treeId).order("created_at"),
        supabase.from("relationships").select("*").eq("tree_id", treeId),
        supabase.from("gender_options").select("*").eq("tree_id", treeId).order("sort_order"),
        supabase.from("tree_members").select("*").eq("tree_id", treeId),
      ]);
      if (tree.error) throw tree.error;
      if (!tree.data) throw new Error("This family tree was not found, or you don't have access to it.");
      if (persons.error) throw persons.error;
      if (relationships.error) throw relationships.error;

      const treeRow = tree.data as unknown as FamilyTree;
      const memberRows = (members.data ?? []) as unknown as TreeMember[];
      const uid = user.user?.id ?? null;
      const role: TreeRole =
        treeRow.owner_id === uid ? "owner" : (memberRows.find((m) => m.user_id === uid)?.role ?? "viewer");

      return {
        tree: treeRow,
        persons: (persons.data ?? []) as unknown as Person[],
        relationships: (relationships.data ?? []) as unknown as Relationship[],
        genders: (genders.data ?? []) as unknown as GenderOption[],
        members: memberRows,
        role,
        canEdit: role === "owner" || role === "editor",
      };
    },
  });

export type PersonDraft = {
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  first_name_unknown: boolean;
  last_name_unknown: boolean;
  gender: string;
  birth_precision: string;
  birth_date: string | null;
  birth_year: number | null;
  death_precision: string;
  death_date: string | null;
  death_year: number | null;
  is_deceased: boolean;
  birthplace: string | null;
  residence: string | null;
  occupation: string | null;
  notes: string | null;
  photo_url: string | null;
};

export async function createPerson(treeId: string, draft: PersonDraft): Promise<Person> {
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("persons")
    .insert({ ...draft, tree_id: treeId, created_by: auth.user?.id ?? null } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Person;
}

export async function updatePerson(personId: string, draft: Partial<PersonDraft>): Promise<void> {
  const { error } = await supabase
    .from("persons")
    .update(draft as never)
    .eq("id", personId);
  if (error) throw error;
}

export async function deletePerson(personId: string): Promise<void> {
  const { error } = await supabase.from("persons").delete().eq("id", personId);
  if (error) throw error;
}

export async function createRelationships(
  treeId: string,
  edges: Array<{ person_a: string; person_b: string; relationship_type: RelationshipType; start_date?: string | null }>,
): Promise<void> {
  if (!edges.length) return;
  const { error } = await supabase
    .from("relationships")
    .insert(edges.map((e) => ({ ...e, tree_id: treeId })) as never);
  if (error) throw error;
}

export async function deleteRelationship(id: string): Promise<void> {
  const { error } = await supabase.from("relationships").delete().eq("id", id);
  if (error) throw error;
}

export async function createTree(input: {
  name: string;
  description?: string | null;
  startMode?: string | null;
}): Promise<FamilyTree> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("You need to be signed in.");
  const { data, error } = await supabase
    .from("family_trees")
    .insert({
      name: input.name,
      description: input.description ?? null,
      start_mode: input.startMode ?? null,
      owner_id: auth.user.id,
    } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as FamilyTree;
}

export async function setRootPerson(treeId: string, personId: string): Promise<void> {
  const { error } = await supabase
    .from("family_trees")
    .update({ root_person_id: personId } as never)
    .eq("id", treeId);
  if (error) throw error;
}

export async function deleteTree(treeId: string): Promise<void> {
  const { error } = await supabase.from("family_trees").delete().eq("id", treeId);
  if (error) throw error;
}

export async function inviteMember(treeId: string, email: string, role: TreeRole): Promise<void> {
  const { error } = await supabase
    .from("tree_members")
    .insert({ tree_id: treeId, invited_email: email.trim().toLowerCase(), role } as never);
  if (error) throw error;
}

export async function updateMemberRole(memberId: string, role: TreeRole): Promise<void> {
  const { error } = await supabase
    .from("tree_members")
    .update({ role } as never)
    .eq("id", memberId);
  if (error) throw error;
}

export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase.from("tree_members").delete().eq("id", memberId);
  if (error) throw error;
}

export async function addGenderOption(treeId: string, label: string, icon: string): Promise<void> {
  const value = label.trim().toLowerCase().replace(/\s+/g, "_");
  const { error } = await supabase
    .from("gender_options")
    .insert({ tree_id: treeId, value, label: label.trim(), icon, sort_order: 90 } as never);
  if (error) throw error;
}
