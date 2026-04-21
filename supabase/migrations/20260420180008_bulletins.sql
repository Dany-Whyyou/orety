-- =============================================================================
-- Bulletins : périodiques & annuel
-- =============================================================================
-- Le bulletin périodique est calculé à partir des notes saisies sur la période.
-- Le bulletin annuel applique la formule de config_bulletins.formule_annuelle_json
-- sur les moyennes périodiques.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Bulletins (entête : élève × période OU annuel)
-- -----------------------------------------------------------------------------
create table bulletins (
  id                      uuid primary key default gen_random_uuid(),
  inscription_id          uuid not null references inscriptions(id) on delete cascade,
  periode_id              uuid references periodes_scolaires(id) on delete cascade,
  est_annuel              boolean not null default false,
  moyenne_generale        numeric(6,3),
  moyenne_classe          numeric(6,3),                  -- moyenne de toute la classe
  rang                    smallint,
  effectif_classe         smallint,
  appreciation_generale   text,
  decision_conseil        text,                           -- "Admis en classe supérieure", "Redouble"...
  publie                  boolean not null default false,
  publie_le               timestamptz,
  pdf_url                 text,
  cree_le                 timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  -- Un seul bulletin par élève par période (ou annuel)
  constraint unicite_bulletin_periode
    unique nulls not distinct (inscription_id, periode_id, est_annuel),
  -- Cohérence : est_annuel => periode_id NULL ; non annuel => periode_id NOT NULL
  check ((est_annuel = true and periode_id is null)
         or (est_annuel = false and periode_id is not null))
);

create index idx_bulletins_inscription on bulletins(inscription_id);
create index idx_bulletins_periode on bulletins(periode_id);

create trigger trg_bulletins_updated
  before update on bulletins
  for each row execute function orety.set_updated_at();

comment on table bulletins is
  'Bulletin de notes d''un élève (périodique ou annuel). 1 bulletin annuel par inscription.';

-- -----------------------------------------------------------------------------
-- Lignes matière du bulletin
-- -----------------------------------------------------------------------------
create table bulletin_matiere (
  id                     uuid primary key default gen_random_uuid(),
  bulletin_id            uuid not null references bulletins(id) on delete cascade,
  matiere_id             uuid not null references matieres(id) on delete restrict,
  moyenne                numeric(6,3),
  moyenne_classe         numeric(6,3),
  rang                   smallint,
  coefficient            numeric(5,2) not null,
  appreciation           text,
  prof_utilisateur_id    uuid references utilisateurs(id) on delete set null,
  cree_le                timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (bulletin_id, matiere_id)
);

create index idx_bm_bulletin on bulletin_matiere(bulletin_id);
create index idx_bm_matiere on bulletin_matiere(matiere_id);

create trigger trg_bulletin_matiere_updated
  before update on bulletin_matiere
  for each row execute function orety.set_updated_at();

comment on table bulletin_matiere is
  'Détail par matière dans un bulletin : moyenne élève, moyenne classe, rang, appréciation.';
