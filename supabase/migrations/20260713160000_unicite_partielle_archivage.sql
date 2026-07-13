-- L'archivage conserve les lignes : toutes les contraintes d'unicité « totales »
-- bloquent donc la recréation d'une entité archivée (recréer une classe « 6ème A »,
-- réutiliser un matricule, recréer une matière MATH…). Elles deviennent des index
-- uniques PARTIELS, ne portant que sur les lignes actives.
-- (bulletins a déjà été traité par 20260713140000.)

-- ── annees_scolaires (organisation_id, libelle) ──
alter table annees_scolaires drop constraint if exists annees_scolaires_organisation_id_libelle_key;
create unique index if not exists unicite_annee_libelle_actif
  on annees_scolaires (organisation_id, libelle) where archive_le is null;

-- ── etablissements (organisation_id, slug) ──
alter table etablissements drop constraint if exists etablissements_organisation_id_slug_key;
create unique index if not exists unicite_etab_slug_actif
  on etablissements (organisation_id, slug) where archive_le is null;

-- ── niveaux (etablissement_id, code) ──
alter table niveaux drop constraint if exists niveaux_etablissement_id_code_key;
create unique index if not exists unicite_niveau_code_actif
  on niveaux (etablissement_id, code) where archive_le is null;

-- ── classes (niveau_id, annee_scolaire_id, nom) ──
alter table classes drop constraint if exists classes_niveau_id_annee_scolaire_id_nom_key;
create unique index if not exists unicite_classe_nom_actif
  on classes (niveau_id, annee_scolaire_id, nom) where archive_le is null;

-- ── matieres (etablissement_id, code) ──
alter table matieres drop constraint if exists matieres_etablissement_id_code_key;
create unique index if not exists unicite_matiere_code_actif
  on matieres (etablissement_id, code) where archive_le is null;

-- ── types_evaluation (etablissement_id, code) ──
alter table types_evaluation drop constraint if exists types_evaluation_etablissement_id_code_key;
create unique index if not exists unicite_type_eval_code_actif
  on types_evaluation (etablissement_id, code) where archive_le is null;

-- ── eleves (etablissement_id, matricule) ──
alter table eleves drop constraint if exists eleves_etablissement_id_matricule_key;
create unique index if not exists unicite_eleve_matricule_actif
  on eleves (etablissement_id, matricule) where archive_le is null;

-- ── config_bulletins (etablissement_id, annee_scolaire_id) ──
-- Sans ça, une config archivée par erreur rend les bulletins annuels
-- définitivement impossibles (aucune config recréable).
alter table config_bulletins drop constraint if exists config_bulletins_etablissement_id_annee_scolaire_id_key;
create unique index if not exists unicite_config_bulletin_actif
  on config_bulletins (etablissement_id, annee_scolaire_id) where archive_le is null;

-- NB : utilisateurs.pseudo reste unique TOTAL — c'est volontaire :
-- eleves.cle_parentale est une FK vers utilisateurs.pseudo, un pseudo archivé
-- ne peut donc pas être réattribué sans casser le lien parental historique.
