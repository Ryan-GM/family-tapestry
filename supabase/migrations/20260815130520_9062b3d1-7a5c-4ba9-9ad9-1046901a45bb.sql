CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name text,
  email text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TYPE public.tree_role AS ENUM ('owner', 'editor', 'viewer');

CREATE TABLE public.family_trees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  start_mode text,
  root_person_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_trees TO authenticated;
GRANT ALL ON public.family_trees TO service_role;

CREATE TABLE public.tree_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL REFERENCES public.family_trees ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  invited_email text,
  role public.tree_role NOT NULL DEFAULT 'viewer',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tree_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tree_members TO authenticated;
GRANT ALL ON public.tree_members TO service_role;

CREATE TABLE public.persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL REFERENCES public.family_trees ON DELETE CASCADE,
  first_name text,
  middle_name text,
  last_name text,
  last_name_unknown boolean NOT NULL DEFAULT false,
  first_name_unknown boolean NOT NULL DEFAULT false,
  gender text NOT NULL DEFAULT 'unspecified',
  birth_precision text NOT NULL DEFAULT 'unknown',
  birth_date date,
  birth_year integer,
  death_precision text NOT NULL DEFAULT 'unknown',
  death_date date,
  death_year integer,
  is_deceased boolean NOT NULL DEFAULT false,
  birthplace text,
  residence text,
  occupation text,
  notes text,
  photo_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.persons TO authenticated;
GRANT ALL ON public.persons TO service_role;
CREATE INDEX persons_tree_idx ON public.persons (tree_id);

CREATE TABLE public.relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL REFERENCES public.family_trees ON DELETE CASCADE,
  person_a uuid NOT NULL REFERENCES public.persons ON DELETE CASCADE,
  person_b uuid NOT NULL REFERENCES public.persons ON DELETE CASCADE,
  relationship_type text NOT NULL,
  label text,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.relationships TO authenticated;
GRANT ALL ON public.relationships TO service_role;
CREATE INDEX relationships_tree_idx ON public.relationships (tree_id);

CREATE TABLE public.gender_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL REFERENCES public.family_trees ON DELETE CASCADE,
  value text NOT NULL,
  label text NOT NULL,
  icon text NOT NULL DEFAULT 'user',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tree_id, value)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gender_options TO authenticated;
GRANT ALL ON public.gender_options TO service_role;

CREATE OR REPLACE FUNCTION public.tree_role_of(_tree_id uuid, _user_id uuid)
RETURNS public.tree_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.family_trees t WHERE t.id = _tree_id AND t.owner_id = _user_id) THEN 'owner'::public.tree_role
    ELSE (SELECT m.role FROM public.tree_members m WHERE m.tree_id = _tree_id AND m.user_id = _user_id LIMIT 1)
  END;
$$;

CREATE OR REPLACE FUNCTION public.can_view_tree(_tree_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.tree_role_of(_tree_id, _user_id) IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.can_edit_tree(_tree_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.tree_role_of(_tree_id, _user_id) IN ('owner'::public.tree_role, 'editor'::public.tree_role);
$$;

ALTER TABLE public.family_trees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trees_select" ON public.family_trees FOR SELECT TO authenticated USING (public.can_view_tree(id, auth.uid()));
CREATE POLICY "trees_insert" ON public.family_trees FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "trees_update" ON public.family_trees FOR UPDATE TO authenticated USING (public.can_edit_tree(id, auth.uid())) WITH CHECK (public.can_edit_tree(id, auth.uid()));
CREATE POLICY "trees_delete" ON public.family_trees FOR DELETE TO authenticated USING (owner_id = auth.uid());

ALTER TABLE public.tree_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select" ON public.tree_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.can_view_tree(tree_id, auth.uid()));
CREATE POLICY "members_write" ON public.tree_members FOR ALL TO authenticated USING (public.tree_role_of(tree_id, auth.uid()) = 'owner'::public.tree_role) WITH CHECK (public.tree_role_of(tree_id, auth.uid()) = 'owner'::public.tree_role);

ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "persons_select" ON public.persons FOR SELECT TO authenticated USING (public.can_view_tree(tree_id, auth.uid()));
CREATE POLICY "persons_write" ON public.persons FOR ALL TO authenticated USING (public.can_edit_tree(tree_id, auth.uid())) WITH CHECK (public.can_edit_tree(tree_id, auth.uid()));

ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rel_select" ON public.relationships FOR SELECT TO authenticated USING (public.can_view_tree(tree_id, auth.uid()));
CREATE POLICY "rel_write" ON public.relationships FOR ALL TO authenticated USING (public.can_edit_tree(tree_id, auth.uid())) WITH CHECK (public.can_edit_tree(tree_id, auth.uid()));

ALTER TABLE public.gender_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gender_select" ON public.gender_options FOR SELECT TO authenticated USING (public.can_view_tree(tree_id, auth.uid()));
CREATE POLICY "gender_write" ON public.gender_options FOR ALL TO authenticated USING (public.can_edit_tree(tree_id, auth.uid())) WITH CHECK (public.can_edit_tree(tree_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trees_touch BEFORE UPDATE ON public.family_trees FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER persons_touch BEFORE UPDATE ON public.persons FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.seed_tree_defaults()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.gender_options (tree_id, value, label, icon, sort_order) VALUES
    (NEW.id, 'male', 'Male', 'male', 1),
    (NEW.id, 'female', 'Female', 'female', 2),
    (NEW.id, 'non_binary', 'Non-binary', 'neutral', 3),
    (NEW.id, 'unspecified', 'Prefer not to say', 'unspecified', 4);
  INSERT INTO public.tree_members (tree_id, user_id, role) VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (tree_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trees_seed AFTER INSERT ON public.family_trees FOR EACH ROW EXECUTE FUNCTION public.seed_tree_defaults();