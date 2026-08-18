DROP POLICY IF EXISTS trees_select ON public.family_trees;
CREATE POLICY trees_select ON public.family_trees FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR public.can_view_tree(id, auth.uid()));
DELETE FROM public.family_trees WHERE name = 'diag2';