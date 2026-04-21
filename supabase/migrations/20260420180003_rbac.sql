-- =============================================================================
-- RBAC : permissions catalog + rôles (système & sur-mesure) + utilisateurs
-- =============================================================================
-- Architecture dynamique : les rôles ne sont pas un enum mais des lignes en DB.
-- Rôles système (is_system=true) seedés, non supprimables.
-- admin_org peut créer des rôles sur-mesure (ex: comptable, surveillant).
-- Garde-fou : un créateur ne peut jamais accorder une permission qu'il n'a pas.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Catalogue des permissions (seedé au déploiement, partagé par toutes les orgs)
-- -----------------------------------------------------------------------------
create type permission_portee as enum (
  'plateforme',          -- super_admin seulement
  'organisation',        -- toute l'organisation
  'etablissement',       -- scope 1 établissement
  'perimetre_personnel'  -- limité aux données de l'utilisateur (ses affectations, ses enfants)
);

create table permissions (
  code            text primary key,
  domaine         text not null,
  libelle         text not null,
  description     text,
  portee          permission_portee not null default 'organisation',
  cree_le         timestamptz not null default now()
);

comment on table permissions is
  'Catalogue global des permissions. Seedé, non modifiable par les utilisateurs.';
comment on column permissions.code is
  'Identifiant stable, format "domaine.action" (ex: "notes.saisir", "bulletins.publier").';
comment on column permissions.portee is
  'Portée par défaut de la permission, utilisée par les policies RLS.';

-- -----------------------------------------------------------------------------
-- Rôles
-- -----------------------------------------------------------------------------
create table roles (
  id                   uuid primary key default gen_random_uuid(),
  organisation_id      uuid references organisations(id) on delete cascade,
  code                 text not null,
  libelle              text not null,
  description          text,
  is_system            boolean not null default false,
  niveau_hierarchique  smallint not null default 0,
  couleur              text,
  actif                boolean not null default true,
  cree_le              timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (organisation_id, code)
);

create unique index idx_roles_system_code
  on roles(code) where organisation_id is null;

create index idx_roles_org on roles(organisation_id);

create trigger trg_roles_updated
  before update on roles
  for each row execute function orety.set_updated_at();

comment on table roles is
  'Rôles système (organisation_id IS NULL) et sur-mesure. is_system=true = non supprimable.';
comment on column roles.niveau_hierarchique is
  'Plus élevé = plus de pouvoir. Utile pour déterminer qui peut gérer qui.';

-- -----------------------------------------------------------------------------
-- Jonction rôle ↔ permissions
-- -----------------------------------------------------------------------------
create table role_permissions (
  role_id         uuid not null references roles(id) on delete cascade,
  permission_code text not null references permissions(code) on delete cascade,
  accordee_le     timestamptz not null default now(),
  accordee_par    uuid,                    -- utilisateur qui a attribué (audit)
  primary key (role_id, permission_code)
);

create index idx_role_permissions_perm on role_permissions(permission_code);

comment on table role_permissions is
  'Lien rôle ↔ permission. Garde-fou applicatif : un créateur ne peut accorder que ses propres permissions.';

-- -----------------------------------------------------------------------------
-- Utilisateurs (table unique pour TOUS les rôles, liée à auth.users)
-- -----------------------------------------------------------------------------
create table utilisateurs (
  id                         uuid primary key references auth.users(id) on delete cascade,
  organisation_id            uuid references organisations(id) on delete cascade,
  role_id                    uuid not null references roles(id),
  etablissement_scope_id     uuid references etablissements(id) on delete set null,
  pseudo                     citext unique not null,
  pin_hash                   text,                                 -- bcrypt, défini à la 1ère connexion
  mot_de_passe_initial_utilise boolean not null default false,
  email                      citext,                               -- email réel (optionnel, informatif)
  telephone                  text,
  nom                        text,
  prenom                     text,
  photo_url                  text,
  preferences                jsonb not null default '{}'::jsonb,
  actif                      boolean not null default true,
  dernier_login              timestamptz,
  cree_le                    timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create index idx_utilisateurs_org on utilisateurs(organisation_id);
create index idx_utilisateurs_role on utilisateurs(role_id);
create index idx_utilisateurs_scope on utilisateurs(etablissement_scope_id);
create index idx_utilisateurs_pseudo_trgm on utilisateurs using gin (pseudo gin_trgm_ops);
create index idx_utilisateurs_nom_trgm on utilisateurs using gin ((coalesce(nom,'') || ' ' || coalesce(prenom,'')) gin_trgm_ops);

create trigger trg_utilisateurs_updated
  before update on utilisateurs
  for each row execute function orety.set_updated_at();

comment on table utilisateurs is
  'Profil métier unique pour tous les comptes (admin, secretariat, prof, parent). Lié 1-1 à auth.users.';
comment on column utilisateurs.pseudo is
  'Identifiant mnémonique unique. Sert de login à l''écran, converti en email technique pour Supabase Auth.';
comment on column utilisateurs.etablissement_scope_id is
  'Pour directeur_site : l''établissement qu''il pilote. NULL pour les rôles non scopés par site.';

-- -----------------------------------------------------------------------------
-- Affiliation multi-établissements (prof/secrétariat intervenant sur N sites)
-- -----------------------------------------------------------------------------
create table utilisateur_etablissements (
  utilisateur_id    uuid not null references utilisateurs(id) on delete cascade,
  etablissement_id  uuid not null references etablissements(id) on delete cascade,
  cree_le           timestamptz not null default now(),
  primary key (utilisateur_id, etablissement_id)
);

create index idx_ue_etab on utilisateur_etablissements(etablissement_id);

comment on table utilisateur_etablissements is
  'Utilisateur (généralement prof) pouvant intervenir sur plusieurs établissements de son organisation.';
