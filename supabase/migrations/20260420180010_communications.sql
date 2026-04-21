-- =============================================================================
-- Communications : annonces & notifications
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Annonces (publication vers parents / profs / toute l'école)
-- -----------------------------------------------------------------------------
create type cible_annonce as enum (
  'organisation',     -- toute l'organisation
  'etablissement',    -- 1 site
  'classe',           -- 1 classe
  'parents',          -- tous les parents de la portée
  'profs'             -- tous les profs de la portée
);

create table annonces (
  id                  uuid primary key default gen_random_uuid(),
  organisation_id     uuid not null references organisations(id) on delete cascade,
  etablissement_id    uuid references etablissements(id) on delete cascade,
  classe_id           uuid references classes(id) on delete cascade,
  cible               cible_annonce not null default 'etablissement',
  titre               text not null,
  contenu             text not null,
  pieces_jointes      jsonb not null default '[]'::jsonb,
  auteur_id           uuid references utilisateurs(id) on delete set null,
  publiee             boolean not null default false,
  publiee_le          timestamptz,
  expire_le           timestamptz,
  cree_le             timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_annonces_org on annonces(organisation_id);
create index idx_annonces_etab on annonces(etablissement_id);
create index idx_annonces_classe on annonces(classe_id);
create index idx_annonces_publiee on annonces(publiee);

create trigger trg_annonces_updated
  before update on annonces
  for each row execute function orety.set_updated_at();

comment on table annonces is
  'Annonces publiées par l''admin vers les utilisateurs. Ciblage par org / établissement / classe.';

-- -----------------------------------------------------------------------------
-- Notifications (individuelles, push vers l'app mobile)
-- -----------------------------------------------------------------------------
create type type_notification as enum (
  'annonce',
  'note_publiee',
  'bulletin_publie',
  'observation',
  'absence',
  'activite',
  'message',
  'systeme'
);

create table notifications (
  id                  uuid primary key default gen_random_uuid(),
  destinataire_id     uuid not null references utilisateurs(id) on delete cascade,
  type                type_notification not null,
  titre               text not null,
  contenu             text,
  donnees             jsonb not null default '{}'::jsonb,
  url_action          text,
  lue                 boolean not null default false,
  lue_le              timestamptz,
  cree_le             timestamptz not null default now()
);

create index idx_notif_destinataire on notifications(destinataire_id);
create index idx_notif_non_lues on notifications(destinataire_id) where lue = false;
create index idx_notif_cree_le on notifications(cree_le desc);

comment on table notifications is
  'Notification individuelle (in-app + push). Liée à 1 destinataire.';

-- -----------------------------------------------------------------------------
-- Messages (1-1 entre utilisateurs, ex: parent ↔ prof)
-- -----------------------------------------------------------------------------
create table messages (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references organisations(id) on delete cascade,
  expediteur_id    uuid not null references utilisateurs(id) on delete cascade,
  destinataire_id  uuid not null references utilisateurs(id) on delete cascade,
  sujet            text,
  contenu          text not null,
  lu               boolean not null default false,
  lu_le            timestamptz,
  reponse_a        uuid references messages(id) on delete set null,
  cree_le          timestamptz not null default now()
);

create index idx_msg_expediteur on messages(expediteur_id);
create index idx_msg_destinataire on messages(destinataire_id);
create index idx_msg_non_lus on messages(destinataire_id) where lu = false;

comment on table messages is
  'Message 1-1 entre utilisateurs (généralement parent ↔ prof).';
