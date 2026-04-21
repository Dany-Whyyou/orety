-- =============================================================================
-- Tenancy : organisations & établissements
-- =============================================================================
-- Chaque école cliente = 1 organisation. Une organisation peut avoir N
-- établissements (sites : préprimaire, primaire, collège, lycée, ...).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enum des cycles scolaires
-- -----------------------------------------------------------------------------
create type cycle_scolaire as enum (
  'prescolaire',
  'primaire',
  'college',
  'lycee'
);

-- -----------------------------------------------------------------------------
-- Organisations (tenants du SaaS)
-- -----------------------------------------------------------------------------
create table organisations (
  id                   uuid primary key default gen_random_uuid(),
  slug                 citext unique not null,
  nom                  text not null,
  logo_url             text,
  couleur_primaire     text,                    -- hex "#RRGGBB"
  couleur_secondaire   text,
  couleur_accent       text,
  pays                 text default 'GA',       -- ISO 3166-1 alpha-2
  ville                text,
  adresse              text,
  telephone            text,
  email                citext,
  site_web             text,
  devise               text default 'XAF',      -- ISO 4217
  fuseau_horaire       text default 'Africa/Libreville',
  plan                 text default 'starter',  -- starter | pro | ...
  actif                boolean not null default true,
  cree_le              timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger trg_organisations_updated
  before update on organisations
  for each row execute function orety.set_updated_at();

comment on table organisations is
  'Client SaaS. Tenant racine. Toute donnée métier appartient à une organisation.';

-- -----------------------------------------------------------------------------
-- Établissements (sites d''une organisation)
-- -----------------------------------------------------------------------------
create table etablissements (
  id                   uuid primary key default gen_random_uuid(),
  organisation_id      uuid not null references organisations(id) on delete cascade,
  slug                 citext not null,
  nom                  text not null,
  cycle_principal      cycle_scolaire not null,
  cycles_couverts      cycle_scolaire[] not null default array[]::cycle_scolaire[],
  slogan               text,
  logo_url             text,
  couleur_primaire     text,
  couleur_secondaire   text,
  adresse              text,
  telephone            text,
  email                citext,
  photo_url            text,
  actif                boolean not null default true,
  cree_le              timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (organisation_id, slug)
);

create index idx_etablissements_org on etablissements(organisation_id);

create trigger trg_etablissements_updated
  before update on etablissements
  for each row execute function orety.set_updated_at();

comment on table etablissements is
  'Site/école physique rattaché à une organisation. Un prof peut intervenir sur plusieurs.';
comment on column etablissements.cycle_principal is
  'Cycle dominant du site (ex: primaire). Un même site peut couvrir plusieurs cycles.';
comment on column etablissements.cycles_couverts is
  'Liste des cycles effectivement accueillis par le site.';
