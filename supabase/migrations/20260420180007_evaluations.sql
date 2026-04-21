-- =============================================================================
-- Évaluations & notes
-- =============================================================================
-- Le prof choisit librement :
--   - le type (interro, devoir, composition...)
--   - le barème (sur 10, 20, 40...)
--   - le poids
--   - autoriser ou non un bonus
-- La moyenne est calculée en normalisant toutes les notes sur la note maximale
-- de référence (config_bulletins.note_maximale, par défaut 20).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Types d'évaluation (configurables par établissement)
-- -----------------------------------------------------------------------------
create table types_evaluation (
  id                uuid primary key default gen_random_uuid(),
  etablissement_id  uuid not null references etablissements(id) on delete cascade,
  code              text not null,                       -- "INTERRO", "DEVOIR"
  libelle           text not null,
  poids_defaut      numeric(5,2) not null default 1,
  couleur           text,
  ordre             smallint not null default 0,
  actif             boolean not null default true,
  cree_le           timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (etablissement_id, code),
  check (poids_defaut > 0)
);

create index idx_types_eval_etab on types_evaluation(etablissement_id);

create trigger trg_types_eval_updated
  before update on types_evaluation
  for each row execute function orety.set_updated_at();

comment on table types_evaluation is
  'Catalogue des types d''évaluation (interro, devoir, composition...). Poids par défaut pour la pondération.';

-- -----------------------------------------------------------------------------
-- Évaluations (une évaluation = une séance de notation pour une affectation)
-- -----------------------------------------------------------------------------
create table evaluations (
  id                  uuid primary key default gen_random_uuid(),
  affectation_id      uuid not null references affectations(id) on delete cascade,
  periode_id          uuid not null references periodes_scolaires(id) on delete cascade,
  type_evaluation_id  uuid not null references types_evaluation(id) on delete restrict,
  titre               text not null,
  description         text,
  date_evaluation     date not null,
  bareme              numeric(5,2) not null,              -- sur 10, 20, 40...
  poids               numeric(5,2) not null default 1,    -- surcharge du type si besoin
  autorise_bonus      boolean not null default false,
  bonus_max           numeric(5,2),                       -- si bonus autorisé, cap max (optionnel)
  publiee             boolean not null default false,     -- visible parents ?
  publiee_le          timestamptz,
  cree_par            uuid references utilisateurs(id),
  cree_le             timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (bareme > 0),
  check (poids > 0),
  check (bonus_max is null or bonus_max >= 0)
);

create index idx_evals_affectation on evaluations(affectation_id);
create index idx_evals_periode on evaluations(periode_id);
create index idx_evals_type on evaluations(type_evaluation_id);
create index idx_evals_date on evaluations(date_evaluation);

create trigger trg_evaluations_updated
  before update on evaluations
  for each row execute function orety.set_updated_at();

comment on table evaluations is
  'Une évaluation = un contrôle/interro/devoir donné par un prof à une classe pour une matière.';
comment on column evaluations.autorise_bonus is
  'Si true, le prof peut saisir un bonus (points additionnels) sur chaque note.';

-- -----------------------------------------------------------------------------
-- Notes (une ligne par élève × évaluation)
-- -----------------------------------------------------------------------------
create table notes (
  id              uuid primary key default gen_random_uuid(),
  evaluation_id   uuid not null references evaluations(id) on delete cascade,
  eleve_id        uuid not null references eleves(id) on delete cascade,
  note            numeric(6,2),                          -- sur bareme
  bonus           numeric(5,2) not null default 0,
  absent          boolean not null default false,        -- NB: alternatif à note NULL
  commentaire     text,
  saisie_par      uuid references utilisateurs(id),
  saisie_le       timestamptz,
  cree_le         timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (evaluation_id, eleve_id),
  check (note is null or note >= 0),
  check (bonus >= 0)
);

create index idx_notes_eval on notes(evaluation_id);
create index idx_notes_eleve on notes(eleve_id);

create trigger trg_notes_updated
  before update on notes
  for each row execute function orety.set_updated_at();

comment on table notes is
  'Note individuelle d''un élève à une évaluation. Peut inclure un bonus et un commentaire.';
