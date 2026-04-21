-- =============================================================================
-- Structure scolaire : années, config bulletin, périodes, niveaux, classes,
-- matières, coefficients
-- =============================================================================
-- Une année scolaire est portée par une organisation. Chaque établissement
-- configure sa fréquence de bulletin (mensuel/trimestriel/semestriel) et
-- une formule de bulletin annuel personnalisable.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Années scolaires (portées par l'organisation)
-- -----------------------------------------------------------------------------
create table annees_scolaires (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references organisations(id) on delete cascade,
  libelle          text not null,                          -- "2026-2027"
  date_debut       date not null,
  date_fin         date not null,
  active           boolean not null default false,         -- année en cours
  archivee         boolean not null default false,
  cree_le          timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organisation_id, libelle),
  check (date_fin > date_debut)
);

create index idx_annees_org on annees_scolaires(organisation_id);
create unique index idx_annees_active_par_org
  on annees_scolaires(organisation_id) where active = true;

create trigger trg_annees_updated
  before update on annees_scolaires
  for each row execute function orety.set_updated_at();

comment on table annees_scolaires is
  'Année académique. Une seule peut être active par organisation à la fois.';

-- -----------------------------------------------------------------------------
-- Configuration de bulletin (par établissement × année)
-- -----------------------------------------------------------------------------
create type frequence_bulletin as enum (
  'mensuel',
  'trimestriel',
  'semestriel'
);

create table config_bulletins (
  id                       uuid primary key default gen_random_uuid(),
  etablissement_id         uuid not null references etablissements(id) on delete cascade,
  annee_scolaire_id        uuid not null references annees_scolaires(id) on delete cascade,
  frequence                frequence_bulletin not null,
  nb_periodes              smallint not null,
  formule_annuelle_dsl     text not null,                  -- "(P1 + P2*2 + P3*2) / 5"
  formule_annuelle_json    jsonb not null,                 -- {"poids":[1,2,2], "diviseur":5}
  note_maximale            numeric(5,2) not null default 20,
  note_passage             numeric(5,2) not null default 10,
  affiche_rang             boolean not null default true,
  affiche_appreciation     boolean not null default true,
  cree_le                  timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (etablissement_id, annee_scolaire_id),
  check (nb_periodes > 0 and nb_periodes <= 12)
);

create index idx_config_bulletins_etab on config_bulletins(etablissement_id);
create index idx_config_bulletins_annee on config_bulletins(annee_scolaire_id);

create trigger trg_config_bulletins_updated
  before update on config_bulletins
  for each row execute function orety.set_updated_at();

comment on table config_bulletins is
  'Paramétrage du mode de bulletinage : fréquence + formule du bulletin annuel.';
comment on column config_bulletins.formule_annuelle_json is
  'Formule parsée pour le moteur. Forme typique: {"poids":[1,2,2], "diviseur":5}.';

-- -----------------------------------------------------------------------------
-- Périodes scolaires (découpage concret de l'année)
-- -----------------------------------------------------------------------------
create table periodes_scolaires (
  id                   uuid primary key default gen_random_uuid(),
  config_bulletin_id   uuid not null references config_bulletins(id) on delete cascade,
  numero               smallint not null,                  -- 1, 2, 3...
  libelle              text not null,                      -- "1er trimestre"
  date_debut           date not null,
  date_fin             date not null,
  cloturee             boolean not null default false,
  cree_le              timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (config_bulletin_id, numero),
  check (date_fin > date_debut)
);

create index idx_periodes_config on periodes_scolaires(config_bulletin_id);

create trigger trg_periodes_updated
  before update on periodes_scolaires
  for each row execute function orety.set_updated_at();

comment on table periodes_scolaires is
  'Périodes concrètes déduites de la config (ex: 3 trimestres, 10 mois).';

-- -----------------------------------------------------------------------------
-- Niveaux (par établissement, scopés par cycle)
-- -----------------------------------------------------------------------------
create table niveaux (
  id                uuid primary key default gen_random_uuid(),
  etablissement_id  uuid not null references etablissements(id) on delete cascade,
  cycle             cycle_scolaire not null,
  code              text not null,                         -- "6E", "CE1", "TLE"
  libelle           text not null,                         -- "6ème", "CE1", "Terminale"
  ordre             smallint not null,                     -- pour tri
  cree_le           timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (etablissement_id, code)
);

create index idx_niveaux_etab on niveaux(etablissement_id);
create index idx_niveaux_cycle on niveaux(cycle);

create trigger trg_niveaux_updated
  before update on niveaux
  for each row execute function orety.set_updated_at();

comment on table niveaux is
  'Niveau scolaire (6ème, CE1...) au sein d''un établissement et d''un cycle.';

-- -----------------------------------------------------------------------------
-- Classes (groupes d'élèves pour une année)
-- -----------------------------------------------------------------------------
create table classes (
  id                      uuid primary key default gen_random_uuid(),
  niveau_id               uuid not null references niveaux(id) on delete restrict,
  annee_scolaire_id       uuid not null references annees_scolaires(id) on delete cascade,
  nom                     text not null,                   -- "6ème A"
  code                    text,
  capacite_max            smallint,
  titulaire_utilisateur_id uuid references utilisateurs(id) on delete set null,
  salle                   text,
  cree_le                 timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (niveau_id, annee_scolaire_id, nom)
);

create index idx_classes_niveau on classes(niveau_id);
create index idx_classes_annee on classes(annee_scolaire_id);
create index idx_classes_titulaire on classes(titulaire_utilisateur_id);

create trigger trg_classes_updated
  before update on classes
  for each row execute function orety.set_updated_at();

comment on table classes is
  'Groupe-classe pour une année donnée.';
comment on column classes.titulaire_utilisateur_id is
  'Maître/maîtresse titulaire. Obligatoire en primaire (cycle du niveau), optionnel en secondaire.';

-- -----------------------------------------------------------------------------
-- Matières
-- -----------------------------------------------------------------------------
create table matieres (
  id                uuid primary key default gen_random_uuid(),
  etablissement_id  uuid not null references etablissements(id) on delete cascade,
  code              text not null,                         -- "MATH", "FR", "SVT"
  nom               text not null,
  couleur           text,
  ordre             smallint not null default 0,
  actif             boolean not null default true,
  cree_le           timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (etablissement_id, code)
);

create index idx_matieres_etab on matieres(etablissement_id);

create trigger trg_matieres_updated
  before update on matieres
  for each row execute function orety.set_updated_at();

comment on table matieres is
  'Matière enseignée dans un établissement. Les matières peuvent différer entre collège et lycée.';

-- -----------------------------------------------------------------------------
-- Coefficients (matière × niveau)
-- -----------------------------------------------------------------------------
create table coefficients_matiere (
  id           uuid primary key default gen_random_uuid(),
  matiere_id   uuid not null references matieres(id) on delete cascade,
  niveau_id    uuid not null references niveaux(id) on delete cascade,
  coefficient  numeric(5,2) not null,
  cree_le      timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (matiere_id, niveau_id),
  check (coefficient > 0)
);

create index idx_coef_matiere on coefficients_matiere(matiere_id);
create index idx_coef_niveau on coefficients_matiere(niveau_id);

create trigger trg_coef_updated
  before update on coefficients_matiere
  for each row execute function orety.set_updated_at();

comment on table coefficients_matiere is
  'Coefficient d''une matière à un niveau donné (ex: maths coef 4 en Terminale S, coef 2 en 6ème).';
