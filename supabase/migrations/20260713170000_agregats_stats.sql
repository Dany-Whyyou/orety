-- PostgREST plafonne toute requête à max_rows (1000). Les moyennes et taux de
-- présence du dashboard/des rapports étaient donc calculés côté JS sur 1000
-- lignes ARBITRAIRES → chiffres faux et instables d'un rafraîchissement à l'autre.
-- On calcule ces agrégats en SQL, sur l'intégralité des données.

create or replace function orety.stats_agregees(p_etab_ids uuid[])
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

comment on function orety.stats_agregees(uuid[]) is
  'Moyenne générale (/20, absents exclus) et taux de présence calculés en SQL sur toutes les lignes, sans plafond PostgREST.';

grant execute on function orety.stats_agregees(uuid[]) to authenticated, service_role;
