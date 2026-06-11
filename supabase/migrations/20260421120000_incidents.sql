-- Incidents (signalements) : santé, comportement, sécurité, matériel, etc.

do $$ begin
  create type public.type_incident as enum (
    'sante',
    'comportement',
    'securite',
    'materiel',
    'academique',
    'autre'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.gravite_incident as enum (
    'info',
    'mineur',
    'moyen',
    'grave'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.statut_incident as enum (
    'signale',
    'en_cours',
    'traite',
    'clos'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  etablissement_id uuid not null references public.etablissements(id) on delete cascade,
  eleve_id uuid not null references public.eleves(id) on delete cascade,
  auteur_id uuid references public.utilisateurs(id) on delete set null,

  type public.type_incident not null default 'autre',
  gravite public.gravite_incident not null default 'mineur',
  statut public.statut_incident not null default 'signale',

  titre text not null,
  description text not null,
  date_incident timestamptz not null default now(),
  lieu text,

  photos jsonb not null default '[]'::jsonb,
  action_prise text,

  notifie_parent boolean not null default false,
  notifie_le timestamptz,

  cree_le timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_incidents_eleve on public.incidents(eleve_id);
create index if not exists idx_incidents_etablissement on public.incidents(etablissement_id);
create index if not exists idx_incidents_date on public.incidents(date_incident desc);
create index if not exists idx_incidents_statut on public.incidents(statut);

-- Updated_at trigger
drop trigger if exists set_incidents_updated_at on public.incidents;
create trigger set_incidents_updated_at
  before update on public.incidents
  for each row
  execute function orety.set_updated_at();

-- RLS
alter table public.incidents enable row level security;

-- Super admin: full access
drop policy if exists incidents_super_admin on public.incidents;
create policy incidents_super_admin on public.incidents
  for all using (orety.is_super_admin())
  with check (orety.is_super_admin());

-- Admin org, directeur site, secrétariat, prof : full CRUD
drop policy if exists incidents_staff_read on public.incidents;
create policy incidents_staff_read on public.incidents
  for select using (
    orety.has_permission('eleves.lire')
    or orety.has_permission('incidents.lire')
  );

drop policy if exists incidents_staff_write on public.incidents;
create policy incidents_staff_write on public.incidents
  for all using (
    orety.has_permission('incidents.gerer')
    or orety.has_permission('eleves.modifier')
  )
  with check (
    orety.has_permission('incidents.gerer')
    or orety.has_permission('eleves.modifier')
  );

-- Parent : peut voir les incidents de ses enfants (notifiés)
drop policy if exists incidents_parent_read on public.incidents;
create policy incidents_parent_read on public.incidents
  for select using (
    notifie_parent = true
    and exists (
      select 1 from public.eleves e
      join public.utilisateurs u on u.pseudo = e.cle_parentale
      where e.id = incidents.eleve_id and u.id = auth.uid()
    )
  );

-- Permissions catalog additions
insert into public.permissions (code, domaine, libelle, description, portee) values
  ('incidents.lire', 'incidents', 'Consulter les incidents', 'Voir la liste des signalements', 'etablissement'),
  ('incidents.gerer', 'incidents', 'Gérer les incidents', 'Créer, modifier, clore les signalements', 'etablissement')
on conflict (code) do nothing;

-- Grant to system roles
insert into public.role_permissions (role_id, permission_code)
select r.id, p.code
from public.roles r, public.permissions p
where r.is_system = true
  and r.code in ('super_admin', 'admin_org', 'directeur_site', 'secretariat', 'prof')
  and p.code in ('incidents.lire', 'incidents.gerer')
on conflict (role_id, permission_code) do nothing;
