-- =============================================================================
-- Professeurs et affectations
-- =============================================================================
-- Le prof est un utilisateur avec role.code = 'prof'. Les données
-- pédagogiques (matricule, matières enseignables) sont dans des tables
-- satellites.
--
-- Règle métier :
--   - Primaire     : un titulaire par classe, toutes matières (affectations.matiere_id IS NULL)
--   - Collège/Lycée: un prof par matière × classe (affectations.matiere_id obligatoire)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Profil prof (satellite de utilisateurs)
-- -----------------------------------------------------------------------------
create table profs (
  utilisateur_id   uuid primary key references utilisateurs(id) on delete cascade,
  matricule        text,
  specialite       text,
  date_embauche    date,
  diplome          text,
  biographie       text,
  cree_le          timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger trg_profs_updated
  before update on profs
  for each row execute function orety.set_updated_at();

comment on table profs is
  'Informations pédagogiques du prof. Référence utilisateurs(id) 1-1.';

-- -----------------------------------------------------------------------------
-- Matières qu'un prof peut enseigner
-- -----------------------------------------------------------------------------
create table prof_matieres (
  utilisateur_id  uuid not null references utilisateurs(id) on delete cascade,
  matiere_id      uuid not null references matieres(id) on delete cascade,
  cree_le         timestamptz not null default now(),
  primary key (utilisateur_id, matiere_id)
);

create index idx_prof_matieres_matiere on prof_matieres(matiere_id);

comment on table prof_matieres is
  'Matières qu''un prof est qualifié pour enseigner (capacité, pas affectation effective).';

-- -----------------------------------------------------------------------------
-- Affectations : prof × classe [× matière] × année
-- -----------------------------------------------------------------------------
create table affectations (
  id                   uuid primary key default gen_random_uuid(),
  utilisateur_id       uuid not null references utilisateurs(id) on delete cascade,
  classe_id            uuid not null references classes(id) on delete cascade,
  matiere_id           uuid references matieres(id) on delete cascade,
  annee_scolaire_id    uuid not null references annees_scolaires(id) on delete cascade,
  heures_semaine       numeric(4,2),
  cree_le              timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Unicité prof-classe-matière-année (avec matiere_id nullable traité explicitement)
create unique index idx_affectation_unique_matiere
  on affectations(utilisateur_id, classe_id, matiere_id, annee_scolaire_id)
  where matiere_id is not null;

create unique index idx_affectation_unique_titulaire
  on affectations(utilisateur_id, classe_id, annee_scolaire_id)
  where matiere_id is null;

create index idx_affectations_prof on affectations(utilisateur_id);
create index idx_affectations_classe on affectations(classe_id);
create index idx_affectations_matiere on affectations(matiere_id);
create index idx_affectations_annee on affectations(annee_scolaire_id);

create trigger trg_affectations_updated
  before update on affectations
  for each row execute function orety.set_updated_at();

comment on table affectations is
  'Attribution concrète d''un prof à une classe [pour une matière] sur une année. matiere_id NULL = titulaire toutes-matières (primaire).';
