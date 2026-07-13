-- Les apps mobiles (prof, parent) lisent la base via PostgREST + RLS. Or AUCUNE
-- policy ne filtrait `archive_le` : un bulletin régénéré restait `publie = true`
-- et le parent voyait DEUX bulletins (l'ancien, faux, et le nouveau) ; une
-- évaluation « supprimée » restait lisible avec ses notes.
--
-- On reprend EXACTEMENT la logique des policies d'origine (20260420180012),
-- en n'ajoutant que la condition d'archivage.

create policy "eleves_select_v2"
  on eleves for select
  using (
    archive_le is null
    and (
      orety.is_super_admin()
      or orety.is_parent_of_eleve(id)
      or orety.is_affected_to_eleve(id)
      or (orety.has_permission('eleves.lire') and orety.can_access_etab(etablissement_id))
    )
  );
drop policy if exists "eleves_select" on eleves;
alter policy "eleves_select_v2" on eleves rename to "eleves_select";

create policy "evaluations_select_v2"
  on evaluations for select
  using (
    archive_le is null
    and (
      orety.is_super_admin()
      or exists (
        select 1 from affectations a
        where a.id = evaluations.affectation_id
          and a.utilisateur_id = auth.uid()
      )
      or (publiee = true and exists (
        select 1
        from affectations a
        join inscriptions i on i.classe_id = a.classe_id
        join eleves e on e.id = i.eleve_id
        where a.id = evaluations.affectation_id
          and e.archive_le is null
          and orety.is_parent_of_eleve(e.id)
      ))
      or orety.has_permission('evaluations.lire')
    )
  );
drop policy if exists "evaluations_select" on evaluations;
alter policy "evaluations_select_v2" on evaluations rename to "evaluations_select";

create policy "bulletins_select_v2"
  on bulletins for select
  using (
    archive_le is null
    and (
      orety.is_super_admin()
      or (publie = true and exists (
        select 1 from inscriptions i
        join eleves e on e.id = i.eleve_id
        where i.id = bulletins.inscription_id
          and e.archive_le is null
          and orety.is_parent_of_eleve(e.id)
      ))
      or orety.has_permission('bulletins.lire')
    )
  );
drop policy if exists "bulletins_select" on bulletins;
alter policy "bulletins_select_v2" on bulletins rename to "bulletins_select";

create policy "annonces_select_v2"
  on annonces for select
  using (
    archive_le is null
    and (
      orety.is_super_admin()
      or (publiee = true and organisation_id = orety.current_org_id())
      or orety.has_permission('annonces.gerer')
    )
  );
drop policy if exists "annonces_select" on annonces;
alter policy "annonces_select_v2" on annonces rename to "annonces_select";

-- Ceinture et bretelles : un bulletin/une évaluation archivé(e) ne doit plus
-- être marqué(e) comme publié(e) — même si une policy oubliait le filtre.
update bulletins set publie = false where archive_le is not null and publie = true;
update evaluations set publiee = false where archive_le is not null and publiee = true;
