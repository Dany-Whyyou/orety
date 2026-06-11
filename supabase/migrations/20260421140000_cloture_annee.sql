-- Clôture d'année scolaire : décisions, archivage, verrouillage soft

-- 1) Ajouter les valeurs à statut_inscription
alter type public.statut_inscription add value if not exists 'admis';
alter type public.statut_inscription add value if not exists 'redouble';
alter type public.statut_inscription add value if not exists 'diplome';
alter type public.statut_inscription add value if not exists 'exclu';

-- 2) Ajouter les colonnes de décision sur inscriptions
alter table public.inscriptions
  add column if not exists decision_fin_annee public.statut_inscription,
  add column if not exists decision_le timestamptz,
  add column if not exists decision_par uuid references public.utilisateurs(id) on delete set null,
  add column if not exists motif_decision text;

-- 3) Table archives_annee
create table if not exists public.archives_annee (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  annee_scolaire_id uuid not null references public.annees_scolaires(id) on delete cascade,
  etablissement_id uuid references public.etablissements(id) on delete cascade,
  cloturee_le timestamptz not null default now(),
  cloturee_par uuid references public.utilisateurs(id) on delete set null,
  -- stats agrégées
  effectif_fin_annee int not null default 0,
  nb_admis int not null default 0,
  nb_redoublants int not null default 0,
  nb_diplomes int not null default 0,
  nb_exclus int not null default 0,
  nb_transferes int not null default 0,
  moyenne_generale_etablissement numeric(5, 2),
  taux_reussite numeric(5, 2),
  donnees_agregees jsonb not null default '{}'::jsonb,
  rapport_pdf_url text,
  cree_le timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (annee_scolaire_id, etablissement_id)
);

create index if not exists idx_archives_annee_org on public.archives_annee(organisation_id);
create index if not exists idx_archives_annee_an on public.archives_annee(annee_scolaire_id);

drop trigger if exists set_archives_annee_updated_at on public.archives_annee;
create trigger set_archives_annee_updated_at
  before update on public.archives_annee
  for each row
  execute function orety.set_updated_at();

alter table public.archives_annee enable row level security;

drop policy if exists archives_super_admin on public.archives_annee;
create policy archives_super_admin on public.archives_annee
  for all using (orety.is_super_admin())
  with check (orety.is_super_admin());

drop policy if exists archives_staff_read on public.archives_annee;
create policy archives_staff_read on public.archives_annee
  for select using (
    orety.has_permission('eleves.lire')
    or orety.has_permission('rapports.lire')
  );

drop policy if exists archives_admin_write on public.archives_annee;
create policy archives_admin_write on public.archives_annee
  for all using (
    orety.has_permission('annees.gerer')
    or orety.has_permission('rapports.generer')
  )
  with check (
    orety.has_permission('annees.gerer')
    or orety.has_permission('rapports.generer')
  );

-- 4) Permissions catalog additions
insert into public.permissions (code, domaine, libelle, description, portee) values
  ('annees.cloturer', 'annees', 'Clôturer une année scolaire', 'Valider les décisions et générer le snapshot', 'organisation'),
  ('archives.consulter', 'archives', 'Consulter les archives', 'Voir les années clôturées en lecture seule', 'organisation')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_code)
select r.id, p.code
from public.roles r, public.permissions p
where r.is_system = true
  and r.code in ('super_admin', 'admin_org', 'directeur_site')
  and p.code in ('annees.cloturer', 'archives.consulter')
on conflict (role_id, permission_code) do nothing;

-- Archive consultation pour secretariat et prof
insert into public.role_permissions (role_id, permission_code)
select r.id, p.code
from public.roles r, public.permissions p
where r.is_system = true
  and r.code in ('secretariat', 'prof')
  and p.code in ('archives.consulter')
on conflict (role_id, permission_code) do nothing;

-- 5) Fonction helper : parent sans enfant actif → désactivation auto
create or replace function orety.deactivate_parent_if_no_children()
returns trigger
language plpgsql
security definer
set search_path = public, orety
as $$
declare
  v_cle text;
  v_nb_actifs int;
  v_parent_id uuid;
begin
  -- Si l'élève devient inactif (exclusion, diplômé, transféré, abandon)
  if new.actif = false and (old.actif is null or old.actif = true) then
    v_cle := new.cle_parentale;

    -- Compter les autres enfants actifs de cette clé
    select count(*) into v_nb_actifs
      from public.eleves
      where cle_parentale = v_cle
        and actif = true
        and id != new.id;

    if v_nb_actifs = 0 then
      select id into v_parent_id
        from public.utilisateurs
        where pseudo = v_cle
          and role_id = (select id from public.roles where code = 'parent' and is_system = true limit 1);
      if v_parent_id is not null then
        update public.utilisateurs set actif = false where id = v_parent_id;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_deactivate_parent on public.eleves;
create trigger trg_deactivate_parent
  after update of actif on public.eleves
  for each row
  when (new.actif is distinct from old.actif)
  execute function orety.deactivate_parent_if_no_children();
