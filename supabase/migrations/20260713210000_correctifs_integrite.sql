-- 1) stats_agregees comptait les notes des ÉLÈVES ARCHIVÉS dans la moyenne
--    générale, alors que le taux de présence, lui, les excluait : les deux KPI
--    du dashboard étaient incohérents entre eux.
create or replace function public.stats_agregees(p_etab_ids uuid[])
returns table (
  moyenne_generale numeric,
  taux_presence numeric,
  nb_notes bigint,
  nb_presences bigint
)
language sql
stable
security definer
set search_path = public, orety
as $$
  with notes_valides as (
    select
      ((n.note + coalesce(n.bonus, 0)) / nullif(e.bareme, 0)) * 20 as note_sur_20
    from notes n
    join evaluations e on e.id = n.evaluation_id and e.archive_le is null
    join affectations a on a.id = e.affectation_id
    join classes c on c.id = a.classe_id and c.archive_le is null
    join niveaux ni on ni.id = c.niveau_id
    join eleves el on el.id = n.eleve_id and el.archive_le is null
    where ni.etablissement_id = any(p_etab_ids)
      and n.absent = false
      and n.note is not null
  ),
  presences_etab as (
    select p.statut
    from presences p
    join seances s on s.id = p.seance_id
    join affectations a on a.id = s.affectation_id
    join classes c on c.id = a.classe_id and c.archive_le is null
    join niveaux ni on ni.id = c.niveau_id
    join eleves el on el.id = p.eleve_id and el.archive_le is null
    where ni.etablissement_id = any(p_etab_ids)
  )
  select
    (select round(avg(note_sur_20), 2) from notes_valides),
    (select round(
       100.0 * count(*) filter (where statut in ('present', 'retard')) / nullif(count(*), 0),
       2)
     from presences_etab),
    (select count(*) from notes_valides),
    (select count(*) from presences_etab);
$$;

revoke all on function public.stats_agregees(uuid[]) from public, anon, authenticated;
grant execute on function public.stats_agregees(uuid[]) to service_role;

-- 2) La clôture pré-inscrivait les élèves ARCHIVÉS ayant une décision « admis »
--    dans l'année suivante.
create or replace function public.cloturer_annee(
  p_annee_id uuid,
  p_organisation_id uuid
)
returns table (
  nb_statuts integer,
  nb_desactives integer,
  nb_preinscrits integer
)
language plpgsql
security definer
set search_path = public, orety
as $$
declare
  v_prochaine_id uuid;
  v_nb_statuts integer := 0;
  v_nb_desactives integer := 0;
  v_nb_preinscrits integer := 0;
  v_sans_decision integer;
begin
  if not exists (
    select 1 from annees_scolaires
    where id = p_annee_id and organisation_id = p_organisation_id and archive_le is null
  ) then
    raise exception 'Année introuvable pour cette organisation';
  end if;

  if exists (select 1 from annees_scolaires where id = p_annee_id and archivee = true) then
    raise exception 'Année déjà clôturée';
  end if;

  select count(*) into v_sans_decision
  from inscriptions i
  join eleves e on e.id = i.eleve_id and e.archive_le is null
  where i.annee_scolaire_id = p_annee_id
    and i.statut in ('inscrit', 'reinscrit')
    and i.decision_fin_annee is null;

  if v_sans_decision > 0 then
    raise exception '% élève(s) sans décision de fin d''année', v_sans_decision;
  end if;

  update inscriptions i
  set statut = i.decision_fin_annee::text::statut_inscription
  where i.annee_scolaire_id = p_annee_id
    and i.decision_fin_annee is not null
    and i.statut in ('inscrit', 'reinscrit');
  get diagnostics v_nb_statuts = row_count;

  update eleves e
  set actif = false
  from inscriptions i
  where i.eleve_id = e.id
    and i.annee_scolaire_id = p_annee_id
    and i.decision_fin_annee in ('exclu', 'transfere', 'abandonne')
    and e.actif = true;
  get diagnostics v_nb_desactives = row_count;

  select id into v_prochaine_id
  from annees_scolaires
  where organisation_id = p_organisation_id
    and archive_le is null
    and date_debut > (select date_fin from annees_scolaires where id = p_annee_id)
  order by date_debut
  limit 1;

  if v_prochaine_id is not null then
    insert into inscriptions (eleve_id, classe_id, annee_scolaire_id, statut)
    select
      i.eleve_id,
      cible.id,
      v_prochaine_id,
      'reinscrit'::statut_inscription
    from inscriptions i
    join eleves el on el.id = i.eleve_id and el.archive_le is null  -- ← correctif
    join classes c on c.id = i.classe_id
    join niveaux n on n.id = c.niveau_id
    cross join lateral (
      select c2.id
      from classes c2
      join niveaux n2 on n2.id = c2.niveau_id
      where c2.annee_scolaire_id = v_prochaine_id
        and c2.archive_le is null
        and n2.etablissement_id = n.etablissement_id
        and n2.ordre = case
              when i.decision_fin_annee = 'redouble' then n.ordre
              else n.ordre + 1
            end
      order by c2.nom
      limit 1
    ) as cible
    where i.annee_scolaire_id = p_annee_id
      and i.decision_fin_annee in ('admis', 'redouble')
      and not exists (
        select 1 from inscriptions i2
        where i2.eleve_id = i.eleve_id
          and i2.annee_scolaire_id = v_prochaine_id
      );
    get diagnostics v_nb_preinscrits = row_count;
  end if;

  update annees_scolaires
  set archivee = true, active = false
  where id = p_annee_id;

  return query select v_nb_statuts, v_nb_desactives, v_nb_preinscrits;
end;
$$;

revoke all on function public.cloturer_annee(uuid, uuid) from public, anon, authenticated;
grant execute on function public.cloturer_annee(uuid, uuid) to service_role;
