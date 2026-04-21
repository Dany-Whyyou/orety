-- =============================================================================
-- Extensions Postgres nécessaires
-- =============================================================================

create extension if not exists "pgcrypto";      -- gen_random_uuid(), crypt()
create extension if not exists "citext";        -- texte insensible à la casse (pseudos, emails)
create extension if not exists "pg_trgm";       -- recherche trigram (noms, pseudos)

-- Schéma interne pour nos fonctions/triggers privés
create schema if not exists orety;

-- =============================================================================
-- Trigger générique : mise à jour auto de updated_at
-- =============================================================================
create or replace function orety.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function orety.set_updated_at is
  'Trigger BEFORE UPDATE : force updated_at = now() à chaque mise à jour.';
