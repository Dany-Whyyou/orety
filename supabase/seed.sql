-- =============================================================================
-- Seed : données initiales
--   1) Catalogue des permissions
--   2) Rôles système
--   3) Organisation Orety + établissements
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) CATALOGUE DES PERMISSIONS
-- -----------------------------------------------------------------------------
insert into permissions (code, domaine, libelle, description, portee) values
  -- Plateforme (super_admin)
  ('plateforme.gerer',              'plateforme',  'Administrer la plateforme',              'Accès complet super-admin', 'plateforme'),
  ('organisations.gerer',           'plateforme',  'Gérer les organisations clientes',       'CRUD sur les écoles', 'plateforme'),

  -- Organisation & établissements
  ('organisation.parametrer',       'organisation', 'Paramétrer l''organisation',            'Logo, couleurs, infos', 'organisation'),
  ('etablissements.gerer',          'organisation', 'Gérer les établissements',              'CRUD sites', 'organisation'),

  -- Utilisateurs & rôles
  ('utilisateurs.lire',             'utilisateurs', 'Consulter la liste des utilisateurs',   null, 'organisation'),
  ('utilisateurs.gerer',            'utilisateurs', 'Créer/modifier/désactiver des comptes', null, 'organisation'),
  ('roles.gerer',                   'roles',        'Créer des rôles sur mesure',            null, 'organisation'),

  -- Structure scolaire
  ('structure_scolaire.gerer',      'structure',    'Années, niveaux, matières, coefficients', null, 'organisation'),

  -- Profs & affectations
  ('profs.lire',                    'profs',        'Consulter les profs',                   null, 'organisation'),
  ('profs.gerer',                   'profs',        'Créer/modifier profs',                  null, 'organisation'),
  ('affectations.lire',             'affectations', 'Consulter les affectations',            null, 'organisation'),
  ('affectations.gerer',            'affectations', 'Attribuer profs aux classes',           null, 'organisation'),

  -- Classes
  ('classes.gerer',                 'classes',      'Créer/modifier classes',                null, 'organisation'),

  -- Élèves
  ('eleves.lire',                   'eleves',       'Consulter les élèves',                  null, 'organisation'),
  ('eleves.gerer',                  'eleves',       'Inscrire/modifier élèves',              null, 'organisation'),

  -- Notes / Évaluations
  ('notes.lire',                    'notes',        'Consulter les notes (toutes)',          null, 'organisation'),
  ('notes.gerer',                   'notes',        'Saisir/modifier notes (admin)',         null, 'organisation'),

  -- Bulletins
  ('bulletins.lire',                'bulletins',    'Consulter les bulletins',               null, 'organisation'),
  ('bulletins.gerer',               'bulletins',    'Générer/publier les bulletins',         null, 'organisation'),

  -- Vie scolaire
  ('seances.lire',                  'seances',      'Consulter les séances',                 null, 'organisation'),
  ('presences.lire',                'presences',    'Consulter les présences',               null, 'organisation'),
  ('presences.gerer',               'presences',    'Saisir/modifier présences (admin)',     null, 'organisation'),
  ('observations.lire',             'observations', 'Consulter les observations',            null, 'organisation'),
  ('observations.gerer',            'observations', 'Créer/modifier observations (admin)',   null, 'organisation'),
  ('activites.lire',                'activites',    'Consulter les activités',               null, 'organisation'),

  -- Communications
  ('annonces.gerer',                'annonces',     'Créer/publier des annonces',            null, 'organisation'),
  ('notifications.envoyer',         'notifications','Envoyer des notifications',             null, 'organisation'),

  -- Rapports & finance
  ('rapports.lire',                 'rapports',     'Accéder aux rapports',                  null, 'organisation'),
  ('finance.lire',                  'finance',      'Consulter les finances',                null, 'organisation'),
  ('finance.gerer',                 'finance',      'Gérer factures/paiements',              null, 'organisation')
on conflict (code) do nothing;


-- -----------------------------------------------------------------------------
-- 2) RÔLES SYSTÈME
-- -----------------------------------------------------------------------------
insert into roles (id, organisation_id, code, libelle, description, is_system, niveau_hierarchique, couleur) values
  ('00000000-0000-0000-0000-000000000001', null, 'super_admin',
    'Super administrateur', 'Plateforme — toutes organisations', true, 100, '#111827'),
  ('00000000-0000-0000-0000-000000000002', null, 'admin_org',
    'Administrateur d''organisation', 'Directeur général — tous les sites de l''organisation', true, 80, '#1F7A3A'),
  ('00000000-0000-0000-0000-000000000003', null, 'directeur_site',
    'Directeur de site', 'Gère un seul établissement', true, 60, '#2563EB'),
  ('00000000-0000-0000-0000-000000000004', null, 'secretariat',
    'Secrétariat', 'Inscriptions, comptes parents, communications', true, 40, '#7C3AED'),
  ('00000000-0000-0000-0000-000000000005', null, 'prof',
    'Professeur', 'Saisie notes, présences, observations', true, 20, '#D97706'),
  ('00000000-0000-0000-0000-000000000006', null, 'parent',
    'Parent / Tuteur', 'Consultation seule via l''app mobile', true, 10, '#059669')
on conflict (id) do nothing;


-- -----------------------------------------------------------------------------
-- 3) ASSIGNATION DES PERMISSIONS AUX RÔLES SYSTÈME
-- -----------------------------------------------------------------------------

-- super_admin : toutes les permissions
insert into role_permissions (role_id, permission_code)
select '00000000-0000-0000-0000-000000000001', code from permissions
on conflict do nothing;

-- admin_org : tout sauf la plateforme
insert into role_permissions (role_id, permission_code)
select '00000000-0000-0000-0000-000000000002', code
from permissions
where code not in ('plateforme.gerer', 'organisations.gerer')
on conflict do nothing;

-- directeur_site : comme admin_org mais scopé (la limite site est enforcée par RLS)
insert into role_permissions (role_id, permission_code)
values
  ('00000000-0000-0000-0000-000000000003', 'etablissements.gerer'),
  ('00000000-0000-0000-0000-000000000003', 'utilisateurs.lire'),
  ('00000000-0000-0000-0000-000000000003', 'utilisateurs.gerer'),
  ('00000000-0000-0000-0000-000000000003', 'structure_scolaire.gerer'),
  ('00000000-0000-0000-0000-000000000003', 'profs.lire'),
  ('00000000-0000-0000-0000-000000000003', 'profs.gerer'),
  ('00000000-0000-0000-0000-000000000003', 'affectations.lire'),
  ('00000000-0000-0000-0000-000000000003', 'affectations.gerer'),
  ('00000000-0000-0000-0000-000000000003', 'classes.gerer'),
  ('00000000-0000-0000-0000-000000000003', 'eleves.lire'),
  ('00000000-0000-0000-0000-000000000003', 'eleves.gerer'),
  ('00000000-0000-0000-0000-000000000003', 'notes.lire'),
  ('00000000-0000-0000-0000-000000000003', 'bulletins.lire'),
  ('00000000-0000-0000-0000-000000000003', 'bulletins.gerer'),
  ('00000000-0000-0000-0000-000000000003', 'seances.lire'),
  ('00000000-0000-0000-0000-000000000003', 'presences.lire'),
  ('00000000-0000-0000-0000-000000000003', 'observations.lire'),
  ('00000000-0000-0000-0000-000000000003', 'activites.lire'),
  ('00000000-0000-0000-0000-000000000003', 'annonces.gerer'),
  ('00000000-0000-0000-0000-000000000003', 'notifications.envoyer'),
  ('00000000-0000-0000-0000-000000000003', 'rapports.lire')
on conflict do nothing;

-- secretariat : inscriptions, comptes parents, communications — pas de notes/bulletins/affectations/finance
insert into role_permissions (role_id, permission_code)
values
  ('00000000-0000-0000-0000-000000000004', 'utilisateurs.lire'),
  ('00000000-0000-0000-0000-000000000004', 'utilisateurs.gerer'),
  ('00000000-0000-0000-0000-000000000004', 'eleves.lire'),
  ('00000000-0000-0000-0000-000000000004', 'eleves.gerer'),
  ('00000000-0000-0000-0000-000000000004', 'profs.lire'),
  ('00000000-0000-0000-0000-000000000004', 'classes.gerer'),
  ('00000000-0000-0000-0000-000000000004', 'seances.lire'),
  ('00000000-0000-0000-0000-000000000004', 'presences.lire'),
  ('00000000-0000-0000-0000-000000000004', 'observations.lire'),
  ('00000000-0000-0000-0000-000000000004', 'activites.lire'),
  ('00000000-0000-0000-0000-000000000004', 'annonces.gerer'),
  ('00000000-0000-0000-0000-000000000004', 'notifications.envoyer')
on conflict do nothing;

-- prof : lecture de ses affectations + saisie notes/présences/observations/activités (via ownership)
-- Les permissions qu'on lui donne sont surtout consultatives ; l'écriture passe par ownership (policies).
insert into role_permissions (role_id, permission_code)
values
  ('00000000-0000-0000-0000-000000000005', 'eleves.lire'),
  ('00000000-0000-0000-0000-000000000005', 'affectations.lire'),
  ('00000000-0000-0000-0000-000000000005', 'seances.lire'),
  ('00000000-0000-0000-0000-000000000005', 'presences.lire'),
  ('00000000-0000-0000-0000-000000000005', 'observations.lire'),
  ('00000000-0000-0000-0000-000000000005', 'activites.lire')
on conflict do nothing;

-- parent : aucune permission explicite : les policies autorisent la lecture via is_parent_of_eleve()


-- -----------------------------------------------------------------------------
-- 4) ORGANISATION ORETY
-- -----------------------------------------------------------------------------
insert into organisations (id, slug, nom, pays, ville, telephone, plan, couleur_primaire, couleur_secondaire, couleur_accent)
values (
  '00000000-0000-0000-0000-000000000100',
  'orety',
  'Complexe Scolaire Orety',
  'GA',
  'Port-Gentil',
  '+241 07 95 58 51',
  'starter',
  '#1F7A3A',    -- vert Orety (approximatif, à affiner sur le logo exact)
  '#111827',    -- noir
  '#2563EB'     -- bleu accent
)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 5) ÉTABLISSEMENTS D'ORETY
-- -----------------------------------------------------------------------------
insert into etablissements (id, organisation_id, slug, nom, cycle_principal, cycles_couverts, slogan, adresse, couleur_primaire, couleur_secondaire)
values
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000100',
    'orety-preprim-prim',
    'Complexe Scolaire Orety — Préprimaire & Primaire',
    'primaire',
    array['prescolaire','primaire']::cycle_scolaire[],
    'La référence',
    'Port-Gentil, quartier Transfo — à proximité de l''église Bethany',
    '#EAB308',    -- jaune
    '#DC2626'     -- rouge
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000100',
    'orety-col-lyc',
    'Complexe Scolaire Orety — Collège & Lycée',
    'lycee',
    array['college','lycee']::cycle_scolaire[],
    'Persévérance-Excellence',
    'Port-Gentil, annexe au carrefour SEG bac aviation',
    '#1F7A3A',    -- vert
    '#111827'     -- noir
  )
on conflict (id) do nothing;
