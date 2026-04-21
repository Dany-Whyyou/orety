-- =============================================================================
-- Élèves & inscriptions
-- =============================================================================
-- Chaque élève a une "cle_parentale" qui est le pseudo d'un utilisateur avec
-- role = 'parent'. Plusieurs enfants partageant la même clé = gérés par le
-- même adulte (fratrie OU groupe de garde).
-- =============================================================================

create type sexe_eleve as enum ('M', 'F');

create type statut_inscription as enum (
  'inscrit',
  'reinscrit',
  'transfere',
  'abandonne',
  'exclu',
  'diplome'
);

-- -----------------------------------------------------------------------------
-- Élèves (profil durable, indépendant de l'année)
-- -----------------------------------------------------------------------------
create table eleves (
  id                  uuid primary key default gen_random_uuid(),
  etablissement_id    uuid not null references etablissements(id) on delete restrict,
  matricule           text not null,
  nom                 text not null,
  prenom              text not null,
  date_naissance      date,
  lieu_naissance      text,
  sexe                sexe_eleve,
  nationalite         text default 'Gabonaise',
  adresse             text,
  photo_url           text,
  cle_parentale       citext not null,                    -- FK logique vers utilisateurs.pseudo (role='parent')
  infos_medicales     text,
  infos_allergies     text,
  personne_urgence    text,                               -- nom libre
  tel_urgence         text,
  actif               boolean not null default true,
  cree_le             timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (etablissement_id, matricule),
  constraint fk_eleves_cle_parentale
    foreign key (cle_parentale) references utilisateurs(pseudo) on update cascade
);

create index idx_eleves_etab on eleves(etablissement_id);
create index idx_eleves_cle_parentale on eleves(cle_parentale);
create index idx_eleves_nom_trgm on eleves using gin ((nom || ' ' || prenom) gin_trgm_ops);

create trigger trg_eleves_updated
  before update on eleves
  for each row execute function orety.set_updated_at();

comment on table eleves is
  'Élève. Attaché à un établissement "de base". Peut changer de classe chaque année via inscriptions.';
comment on column eleves.cle_parentale is
  'Pseudo du compte parent qui suit cet élève. Plusieurs élèves partageant la même clé = gérés par le même adulte.';

-- -----------------------------------------------------------------------------
-- Inscriptions (élève × classe × année)
-- -----------------------------------------------------------------------------
create table inscriptions (
  id                   uuid primary key default gen_random_uuid(),
  eleve_id             uuid not null references eleves(id) on delete cascade,
  classe_id            uuid not null references classes(id) on delete cascade,
  annee_scolaire_id    uuid not null references annees_scolaires(id) on delete cascade,
  date_inscription     date not null default current_date,
  statut               statut_inscription not null default 'inscrit',
  observations         text,
  numero_ordre         smallint,                         -- ordre alphabétique ou d'inscription dans la classe
  cree_le              timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (eleve_id, annee_scolaire_id)
);

create index idx_inscriptions_eleve on inscriptions(eleve_id);
create index idx_inscriptions_classe on inscriptions(classe_id);
create index idx_inscriptions_annee on inscriptions(annee_scolaire_id);
create index idx_inscriptions_statut on inscriptions(statut);

create trigger trg_inscriptions_updated
  before update on inscriptions
  for each row execute function orety.set_updated_at();

comment on table inscriptions is
  'Inscription d''un élève dans une classe pour une année. 1 inscription active par année.';
