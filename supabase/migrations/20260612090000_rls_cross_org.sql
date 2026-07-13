-- Correctifs d'isolation multi-tenant (audit 2026-06-11, critique n°1).
-- Les tables profs / prof_matieres / affectations n'ont pas d'organisation_id :
-- le scoping passe par l'organisation de l'utilisateur lié.
-- coefficients_matiere et incidents avaient des policies d'écriture sans
-- filtre d'organisation/établissement, et incidents référençait une
-- permission inexistante (eleves.modifier au lieu de eleves.gerer).

-- Helper security definer : l'utilisateur p_user_id appartient-il à l'org courante ?
-- (évite que les policies dépendent des RLS de la table utilisateurs)
create or replace function orety.user_in_current_org(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, orety
as $$
  select exists (
    select 1
    from utilisateurs cible, utilisateurs moi
    where cible.id = p_user_id
      and moi.id = auth.uid()
      and cible.organisation_id is not null
      and cible.organisation_id = moi.organisation_id
  );
$$;

-- ─── profs ────────────────────────────────────────────────────────────────

drop policy if exists "profs_select" on profs;
create policy "profs_select"
  on profs for select
  using (
    utilisateur_id = auth.uid()
    or orety.is_super_admin()
    or (
      orety.has_permission('profs.lire')
      and orety.user_in_current_org(profs.utilisateur_id)
    )
  );

drop policy if exists "profs_write" on profs;
create policy "profs_write"
  on profs for all
  using (
    orety.is_super_admin()
    or (
      orety.has_permission('profs.gerer')
      and orety.user_in_current_org(profs.utilisateur_id)
    )
  )
  with check (
    orety.is_super_admin()
    or (
      orety.has_permission('profs.gerer')
      and orety.user_in_current_org(profs.utilisateur_id)
    )
  );

-- ─── prof_matieres ────────────────────────────────────────────────────────

drop policy if exists "prof_matieres_select" on prof_matieres;
create policy "prof_matieres_select"
  on prof_matieres for select
  using (
    utilisateur_id = auth.uid()
    or orety.is_super_admin()
    or (
      orety.has_permission('profs.lire')
      and orety.user_in_current_org(prof_matieres.utilisateur_id)
    )
  );

drop policy if exists "prof_matieres_write" on prof_matieres;
create policy "prof_matieres_write"
  on prof_matieres for all
  using (
    orety.is_super_admin()
    or (
      orety.has_permission('profs.gerer')
      and orety.user_in_current_org(prof_matieres.utilisateur_id)
    )
  )
  with check (
    orety.is_super_admin()
    or (
      orety.has_permission('profs.gerer')
      and orety.user_in_current_org(prof_matieres.utilisateur_id)
    )
  );

-- ─── affectations ─────────────────────────────────────────────────────────

drop policy if exists "affectations_select" on affectations;
create policy "affectations_select"
  on affectations for select
  using (
    utilisateur_id = auth.uid()
    or orety.is_super_admin()
    or (
      orety.has_permission('affectations.lire')
      and orety.user_in_current_org(affectations.utilisateur_id)
    )
  );

drop policy if exists "affectations_write" on affectations;
create policy "affectations_write"
  on affectations for all
  using (
    orety.is_super_admin()
    or (
      orety.has_permission('affectations.gerer')
      and orety.user_in_current_org(affectations.utilisateur_id)
    )
  )
  with check (
    orety.is_super_admin()
    or (
      orety.has_permission('affectations.gerer')
      and orety.user_in_current_org(affectations.utilisateur_id)
    )
  );

-- ─── coefficients_matiere ────────────────────────────────────────────────
-- Aligne l'écriture sur la lecture : scoping établissement via la matière.

drop policy if exists "coefficients_write" on coefficients_matiere;
create policy "coefficients_write"
  on coefficients_matiere for all
  using (
    orety.is_super_admin()
    or (
      orety.has_permission('structure_scolaire.gerer')
      and exists (
        select 1 from matieres m
        where m.id = coefficients_matiere.matiere_id
          and orety.can_access_etab(m.etablissement_id)
      )
    )
  )
  with check (
    orety.is_super_admin()
    or (
      orety.has_permission('structure_scolaire.gerer')
      and exists (
        select 1 from matieres m
        where m.id = coefficients_matiere.matiere_id
          and orety.can_access_etab(m.etablissement_id)
      )
    )
  );

-- ─── incidents ────────────────────────────────────────────────────────────
-- eleves.modifier n'existe pas (clause morte) → eleves.gerer ;
-- ajout du scoping organisation + établissement présent sur la table.

drop policy if exists incidents_staff_read on public.incidents;
create policy incidents_staff_read on public.incidents
  for select using (
    (orety.has_permission('eleves.lire') or orety.has_permission('incidents.lire'))
    and orety.is_same_org(organisation_id)
    and orety.can_access_etab(etablissement_id)
  );

drop policy if exists incidents_staff_write on public.incidents;
create policy incidents_staff_write on public.incidents
  for all using (
    (orety.has_permission('incidents.gerer') or orety.has_permission('eleves.gerer'))
    and orety.is_same_org(organisation_id)
    and orety.can_access_etab(etablissement_id)
  )
  with check (
    (orety.has_permission('incidents.gerer') or orety.has_permission('eleves.gerer'))
    and orety.is_same_org(organisation_id)
    and orety.can_access_etab(etablissement_id)
  );
