-- Régression introduite par l'archivage : la contrainte d'unicité
-- (inscription_id, periode_id, est_annuel) portait sur TOUTES les lignes.
-- Depuis que la régénération archive l'ancien bulletin au lieu de le supprimer,
-- l'insert du nouveau violait cette contrainte → les bulletins étaient archivés
-- sans être recréés (perte de données).
-- L'unicité ne doit s'appliquer qu'aux bulletins NON archivés.

alter table bulletins drop constraint if exists unicite_bulletin_periode;

create unique index if not exists unicite_bulletin_periode_actif
  on bulletins (inscription_id, periode_id, est_annuel)
  nulls not distinct
  where archive_le is null;
