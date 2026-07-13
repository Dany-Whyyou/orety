-- Conformité : aucune donnée scolaire n'est supprimée physiquement.
-- Les « suppressions » du dashboard deviennent des archivages horodatés
-- (archive_le non null = archivé), afin de pouvoir répondre à un contrôle
-- de l'État même des années plus tard.

alter table eleves            add column if not exists archive_le timestamptz;
alter table utilisateurs      add column if not exists archive_le timestamptz;
alter table etablissements    add column if not exists archive_le timestamptz;
alter table annees_scolaires  add column if not exists archive_le timestamptz;
alter table niveaux           add column if not exists archive_le timestamptz;
alter table classes           add column if not exists archive_le timestamptz;
alter table matieres          add column if not exists archive_le timestamptz;
alter table types_evaluation  add column if not exists archive_le timestamptz;
alter table evaluations       add column if not exists archive_le timestamptz;
alter table bulletins         add column if not exists archive_le timestamptz;
alter table config_bulletins  add column if not exists archive_le timestamptz;
alter table annonces          add column if not exists archive_le timestamptz;
alter table public.incidents  add column if not exists archive_le timestamptz;

-- Index partiels : les listes filtrent systématiquement archive_le is null
create index if not exists idx_eleves_non_archives        on eleves(etablissement_id)      where archive_le is null;
create index if not exists idx_classes_non_archivees      on classes(niveau_id)            where archive_le is null;
create index if not exists idx_evaluations_non_archivees  on evaluations(affectation_id)   where archive_le is null;
create index if not exists idx_bulletins_non_archives     on bulletins(inscription_id)     where archive_le is null;
