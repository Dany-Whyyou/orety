-- =============================================================================
-- Vie scolaire : séances, présences, observations, activités
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Séances (cours concrets planifiés ou tenus)
-- -----------------------------------------------------------------------------
create table seances (
  id               uuid primary key default gen_random_uuid(),
  affectation_id   uuid not null references affectations(id) on delete cascade,
  date             date not null,
  heure_debut      time,
  heure_fin        time,
  salle            text,
  titre            text,
  tenue            boolean not null default true,     -- false = annulée / reportée
  cree_le          timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_seances_affectation on seances(affectation_id);
create index idx_seances_date on seances(date);

create trigger trg_seances_updated
  before update on seances
  for each row execute function orety.set_updated_at();

comment on table seances is
  'Séance/cours. Sert d''ancrage aux présences et rapports d''activité.';

-- -----------------------------------------------------------------------------
-- Présences
-- -----------------------------------------------------------------------------
create type statut_presence as enum (
  'present',
  'absent',
  'retard',
  'excuse',
  'renvoye'
);

create table presences (
  id             uuid primary key default gen_random_uuid(),
  seance_id      uuid not null references seances(id) on delete cascade,
  eleve_id       uuid not null references eleves(id) on delete cascade,
  statut         statut_presence not null default 'present',
  minutes_retard smallint,
  commentaire    text,
  saisie_par     uuid references utilisateurs(id),
  saisie_le      timestamptz,
  cree_le        timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (seance_id, eleve_id)
);

create index idx_presences_seance on presences(seance_id);
create index idx_presences_eleve on presences(eleve_id);
create index idx_presences_statut on presences(statut);

create trigger trg_presences_updated
  before update on presences
  for each row execute function orety.set_updated_at();

comment on table presences is
  'Pointage élève × séance. Saisi depuis l''app prof, visible parents.';

-- -----------------------------------------------------------------------------
-- Observations (remarques prof sur un élève)
-- -----------------------------------------------------------------------------
create type type_observation as enum (
  'comportement',
  'academique',
  'sante',
  'encouragement',
  'avertissement',
  'autre'
);

create table observations (
  id                       uuid primary key default gen_random_uuid(),
  eleve_id                 uuid not null references eleves(id) on delete cascade,
  prof_utilisateur_id      uuid references utilisateurs(id) on delete set null,
  matiere_id               uuid references matieres(id) on delete set null,
  periode_id               uuid references periodes_scolaires(id) on delete set null,
  type                     type_observation not null,
  titre                    text,
  contenu                  text not null,
  visible_parent           boolean not null default true,
  cree_le                  timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index idx_obs_eleve on observations(eleve_id);
create index idx_obs_prof on observations(prof_utilisateur_id);
create index idx_obs_periode on observations(periode_id);
create index idx_obs_type on observations(type);

create trigger trg_observations_updated
  before update on observations
  for each row execute function orety.set_updated_at();

comment on table observations is
  'Observation prof → élève (comportement, encouragement, avertissement...). Peut être publiée aux parents.';

-- -----------------------------------------------------------------------------
-- Activités (rapports d'activité du prof)
-- -----------------------------------------------------------------------------
create table activites (
  id                      uuid primary key default gen_random_uuid(),
  prof_utilisateur_id     uuid not null references utilisateurs(id) on delete cascade,
  classe_id               uuid references classes(id) on delete set null,
  matiere_id              uuid references matieres(id) on delete set null,
  seance_id               uuid references seances(id) on delete set null,
  date                    date not null,
  titre                   text not null,
  contenu                 text,
  pieces_jointes          jsonb not null default '[]'::jsonb,
  visible_parent          boolean not null default true,
  cree_le                 timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index idx_activites_prof on activites(prof_utilisateur_id);
create index idx_activites_classe on activites(classe_id);
create index idx_activites_date on activites(date);

create trigger trg_activites_updated
  before update on activites
  for each row execute function orety.set_updated_at();

comment on table activites is
  'Rapport d''activité écrit par un prof (contenu du cours, devoirs donnés, pièces jointes).';
