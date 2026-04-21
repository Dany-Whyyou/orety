-- =============================================================================
-- RLS helpers : fonctions pour construire les policies
-- =============================================================================
-- Ces fonctions sont SECURITY DEFINER pour éviter les boucles de RLS quand on
-- lit la table utilisateurs/roles/role_permissions depuis une policy.
-- Elles sont placées dans le schéma "orety" (non exposé via PostgREST).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Récupère l'id de l'utilisateur courant (auth.uid())
-- -----------------------------------------------------------------------------
create or replace function orety.current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- Récupère l'organisation_id de l'utilisateur courant
-- -----------------------------------------------------------------------------
create or replace function orety.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public, orety
as $$
  select organisation_id from utilisateurs where id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- Récupère le role_id de l'utilisateur courant
-- -----------------------------------------------------------------------------
create or replace function orety.current_role_id()
returns uuid
language sql
stable
security definer
set search_path = public, orety
as $$
  select role_id from utilisateurs where id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- Récupère le code du rôle de l'utilisateur courant (ex: 'admin_org')
-- -----------------------------------------------------------------------------
create or replace function orety.current_role_code()
returns text
language sql
stable
security definer
set search_path = public, orety
as $$
  select r.code
  from utilisateurs u
  join roles r on r.id = u.role_id
  where u.id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- Scope établissement (pour directeur_site) — NULL sinon
-- -----------------------------------------------------------------------------
create or replace function orety.current_etab_scope()
returns uuid
language sql
stable
security definer
set search_path = public, orety
as $$
  select etablissement_scope_id from utilisateurs where id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- Raccourcis rôles système
-- -----------------------------------------------------------------------------
create or replace function orety.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, orety
as $$
  select exists (
    select 1
    from utilisateurs u
    join roles r on r.id = u.role_id
    where u.id = auth.uid()
      and r.code = 'super_admin'
      and r.is_system = true
  );
$$;

-- -----------------------------------------------------------------------------
-- Vérifie une permission
-- -----------------------------------------------------------------------------
create or replace function orety.has_permission(p_code text)
returns boolean
language sql
stable
security definer
set search_path = public, orety
as $$
  select exists (
    select 1
    from utilisateurs u
    join role_permissions rp on rp.role_id = u.role_id
    where u.id = auth.uid()
      and rp.permission_code = p_code
  );
$$;

-- -----------------------------------------------------------------------------
-- Vérifie qu'une ligne appartient à l'organisation de l'utilisateur courant
-- -----------------------------------------------------------------------------
create or replace function orety.is_same_org(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, orety
as $$
  select p_org_id is not null
     and p_org_id = (select organisation_id from utilisateurs where id = auth.uid());
$$;

-- -----------------------------------------------------------------------------
-- Vérifie que l'établissement appartient à l'org courante, et si un scope
-- site est défini, qu'on est sur le bon site.
-- -----------------------------------------------------------------------------
create or replace function orety.can_access_etab(p_etab_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, orety
as $$
  select
    orety.is_super_admin()
    or exists (
      select 1
      from etablissements e, utilisateurs u
      where e.id = p_etab_id
        and u.id = auth.uid()
        and e.organisation_id = u.organisation_id
        and (u.etablissement_scope_id is null or u.etablissement_scope_id = p_etab_id)
    );
$$;

-- -----------------------------------------------------------------------------
-- Affiliation multi-site : l'utilisateur est-il rattaché à cet établissement ?
-- -----------------------------------------------------------------------------
create or replace function orety.is_affiliated_to_etab(p_etab_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, orety
as $$
  select exists (
    select 1
    from utilisateur_etablissements ue
    where ue.utilisateur_id = auth.uid()
      and ue.etablissement_id = p_etab_id
  );
$$;

-- -----------------------------------------------------------------------------
-- Parent : vérifie que l'élève est dans sa clé parentale
-- -----------------------------------------------------------------------------
create or replace function orety.is_parent_of_eleve(p_eleve_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, orety
as $$
  select exists (
    select 1
    from eleves e, utilisateurs u
    where e.id = p_eleve_id
      and u.id = auth.uid()
      and e.cle_parentale = u.pseudo
  );
$$;

-- -----------------------------------------------------------------------------
-- Prof : possède une affectation sur la classe/élève ciblé
-- -----------------------------------------------------------------------------
create or replace function orety.is_affected_to_classe(p_classe_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, orety
as $$
  select exists (
    select 1
    from affectations a
    where a.classe_id = p_classe_id
      and a.utilisateur_id = auth.uid()
  );
$$;

create or replace function orety.is_affected_to_eleve(p_eleve_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, orety
as $$
  select exists (
    select 1
    from inscriptions i
    join affectations a on a.classe_id = i.classe_id
    where i.eleve_id = p_eleve_id
      and a.utilisateur_id = auth.uid()
  );
$$;

-- =============================================================================
-- Permissions d'exécution : accessibles aux rôles authentifiés
-- =============================================================================
grant usage on schema orety to authenticated, anon, service_role;
grant execute on all functions in schema orety to authenticated, service_role;
