# Projet Orety — Écosystème de gestion scolaire

## Contexte

Plateforme de gestion scolaire pour le **Complexe Scolaire Orety (C.S.O)** à **Port-Gentil, Gabon** — BP 2110, slogan *"Persévérance-Excellence / La référence"*. Couverture : **pré-primaire, primaire, collège, lycée**.

Architecture **multi-sites / écosystème unique** : une seule base de données, plusieurs établissements rattachés. **Conçu en SaaS** pour pouvoir accueillir d'autres écoles clientes (multi-tenant, white-labeling).

Langue : **français uniquement** (pour l'instant).

**Identité visuelle** : chaque établissement porte sa propre identité visuelle (logo + accents) ; l'organisation reste neutre.
- **Collège/Lycée** : vert dominant, blanc, noir — slogan *"Persévérance-Excellence"*
- **Préprimaire/Primaire** : jaune/rouge/noir sur blanc — slogan *"La référence"*

> ⚠️ *Note à clarifier avec le client :* le PDF fourni mentionne "Complexe Scolaire Aurélie" pour 2026-2027 à la même adresse que Orety. Renommage, coquille ou 2ᵉ école ?

---

## Composants à livrer

| # | Composant | Plateforme | Rôle |
|---|-----------|------------|------|
| 1 | **Site vitrine** | Web | Présentation publique de l'école |
| 2 | **Dashboard admin** | Web | Gestion multi-sites, multi-rôles |
| 3 | **App parent** | Mobile | Suivi activités, observations, bulletins, courbes d'évolution |
| 4 | **App professeur** | Mobile | Présences/absences, saisie notes, bonus, rapports d'activité |

Site vitrine + admin = **une seule app Next.js** partageant la même base (routes publiques `/` et routes protégées `/admin/*` + `/super/*`).

---

## Stack technique

### Backend
- **Supabase** : Postgres + Auth + Storage + Realtime + Edge Functions
- **RLS Postgres** pour le scoping multi-tenant (organisation → établissement)
- API partagée unique pour web + mobile

### Web
- **Next.js** (App Router, TypeScript)
- Déploiement : **Cloudflare Workers** via `@opennextjs/cloudflare` (runtime Node.js — next-on-pages/Pages déprécié pour Next.js)
- UI : shadcn/ui + Tailwind (à confirmer selon charte fournie)
- Graphiques : recharts
- Validation : zod

### Mobile
- **Flutter** (Dart), graphiques `fl_chart`
- Offline sélectif (`drift` ou `isar`) :
  - App prof : présences + notes
  - App parent : dernier bulletin + observations

### Monorepo
- **Un seul repo Git**, pnpm workspaces (TS) + melos (Flutter)

---

## Architecture SaaS multi-tenant

```
super_admin (plateforme Orety/éditeur)
    │
    └── organisations (écoles clientes)
            │  ← white-labeling : logo, couleurs, nom
            │
            └── etablissements (sites — primaire / collège / lycée)
                    │
                    └── utilisateurs, classes, élèves, etc.
```

**Toute ligne de donnée métier a un `organisation_id`** (direct ou via FK). Les policies RLS garantissent l'isolement.

---

## Rôles

Architecture **RBAC dynamique** : rôles système (seedés, non supprimables) + rôles sur mesure créés par `admin_org` ou `super_admin`.

### Rôles système

| Code | Niveau | Portée | Description |
|------|--------|--------|-------------|
| `super_admin` | 100 | Plateforme | Gère toutes les organisations |
| `admin_org` | 80 | Organisation | **Directeur général** — tous les sites de son org (plusieurs possibles) |
| `directeur_site` | 60 | 1 établissement | Gère son site uniquement |
| `secretariat` | 40 | Organisation | Inscriptions, comptes parents, communications |
| `prof` | 20 | Ses affectations | Notes, présences, observations, activités |
| `parent` | 10 | Ses enfants | Consultation seule (app mobile) |

### Rôles sur mesure

- Créés depuis `/admin/parametres/roles` (admin_org) ou `/super/roles` (super_admin).
- Composés de **permissions granulaires** du catalogue système.
- **Garde-fou** : un créateur ne peut pas accorder des permissions qu'il ne possède pas lui-même.
- Cas d'usage : comptable, surveillant général, infirmier, censeur, etc.

### Auth unifiée pour tous les rôles

- **Tout le monde** (admin, secrétariat, prof, parent) utilise le même système : `pseudo + mot de passe généré + PIN mobile`.
- Email **optionnel** — pas obligatoire (réalité du terrain au Gabon).
- Côté Supabase Auth : email technique interne `<pseudo>@orety.internal` pour contourner l'exigence d'email. L'UI n'affiche jamais d'email.
- Les comptes sont **toujours créés par l'admin/secrétariat**, pas d'inscription self-service.

### Formats de pseudos (proposition, à valider)

| Rôle | Format | Exemple |
|------|--------|---------|
| admin_org | `ADM-initiales-n°` | `ADM-DD-01` |
| secrétariat | `SEC-initiales-n°` | `SEC-AM-02` |
| prof | `PR-nom-prenom` | `PR-DOVI-D` |
| parent | `mnémonique-famille-année` | `DOVI-MP-26` |

---

## Règles métier essentielles

### 🎓 Cycles & attribution

- **Primaire & pré-primaire** : un **titulaire unique** par classe (toutes matières). Réattribution annuelle possible.
- **Collège/Lycée** : un prof par **matière × classe**. Un prof peut enseigner plusieurs matières (math 6ème + SVT 3ème → 2 affectations).
- Un prof peut intervenir sur **plusieurs établissements**.

### 📅 Années & bulletins

- Fréquence configurable **par établissement et par année** : `mensuel | trimestriel | semestriel`.
- **Bulletin annuel toujours produit**, calculé via formule configurable.
- Exemple : `(P1 + P2*2 + P3*2) / 5`
- Interface admin : **éditeur visuel de formule** (pas de DSL à taper).

### 📝 Évaluations

- Par matière × période : autant d'évaluations que nécessaire.
- Types configurables (interro, devoir, composition...) avec poids par défaut.
- **Barème libre** : le prof choisit (sur 10, 20, 40...).
- **Bonus** : option par évaluation, saisi depuis l'app prof.
- Agrégation : note normalisée sur 20 → `(note + bonus) / bareme × 20`, pondérée par `poids(éval) × coefficient(matière, niveau)`.

### 🔑 Accès parent (modèle spécifique)

- **Les infos parent ne servent PAS à l'authentification** (elles sont collectées pour l'administratif uniquement).
- Accès = **pseudo alphanumérique unique mnémonique** (ex: `DOVI-MP-26`) + mot de passe généré.
- À la 1ère connexion mobile → définition d'un **PIN** (4-6 chiffres).
- **Le pseudo est utilisé comme `cle_parentale` dans la table `eleves`.**
- Tous les enfants avec le même `cle_parentale` sont vus ensemble dans l'app (fratrie **ou** groupe de garde).
- **On ne modélise pas les liens père/mère/tuteur**.
- Multi-garde (plusieurs adultes pour le même enfant) : **phase 1 = partage des credentials**. Évolution possible via table de jonction.
- Envoi des accès par email si parent en a fourni un.

---

## Modèle de données (entités clés)

### Tenancy & structure

```
organisations           → id, slug, nom, logo_url, couleur_primaire, couleur_secondaire, plan
etablissements          → id, organisation_id, nom, cycle_principal, adresse, tel, email
annees_scolaires        → id, organisation_id, libelle, date_debut, date_fin, active
config_bulletins        → id, etablissement_id, annee_scolaire_id, frequence, nb_periodes,
                          formule_annuelle_dsl, formule_annuelle_json
periodes_scolaires      → id, config_bulletin_id, numero, libelle, date_debut, date_fin
niveaux                 → id, etablissement_id, cycle, nom (6ème, CE1...), ordre
classes                 → id, niveau_id, annee_scolaire_id, nom, capacite, titulaire_prof_id (nullable)
matieres                → id, etablissement_id, code, nom, couleur
coefficients_matiere    → id, matiere_id, niveau_id, coefficient
```

### Identités unifiées & RBAC

```
permissions             → code (PK), domaine, libelle, description, portee
                          (ex: "notes.saisir", domaine "notes", portee "perimetre_personnel")
roles                   → id, organisation_id (NULL si système), code, libelle,
                          description, is_system, niveau_hierarchique, couleur
role_permissions        → (role_id, permission_code)
utilisateurs            → id, organisation_id, pseudo (unique), role_id (FK),
                          etablissement_scope_id (nullable, pour directeur_site),
                          pin_hash (nullable), pwd_initial_utilise,
                          email (optionnel), telephone (optionnel),
                          nom, prenom (optionnel pour parents), photo_url, actif,
                          cree_le, dernier_login
```

> ⚠️ `comptes_parent` n'existe plus — fusionné dans `utilisateurs` avec `role='parent'`.

### Personnel & affectations

```
profs                   → utilisateur_id (PK/FK), matricule, date_embauche, actif
prof_etablissements     → (utilisateur_id, etablissement_id)  -- multi-sites
prof_matieres           → (utilisateur_id, matiere_id)        -- matières enseignables
affectations            → id, prof_utilisateur_id, classe_id, matiere_id (NULL si primaire),
                          annee_scolaire_id
```

### Élèves

```
eleves                  → id, etablissement_id, matricule, nom, prenom, date_naissance, sexe,
                          cle_parentale (FK → utilisateurs.pseudo où role='parent'), photo_url, ...
inscriptions            → id, eleve_id, classe_id, annee_scolaire_id, statut
```

### Évaluations & notes

```
types_evaluation        → id, etablissement_id, nom, poids_defaut, couleur
evaluations             → id, affectation_id, type_evaluation_id, periode_id, titre,
                          bareme, poids, autorise_bonus, date_evaluation
notes                   → id, evaluation_id, eleve_id, note, bonus, commentaire, saisie_par
```

### Vie scolaire

```
seances                 → id, affectation_id, date, heure_debut, heure_fin, salle
presences               → id, seance_id, eleve_id, statut (present/absent/retard/excuse), commentaire
observations            → id, eleve_id, prof_id, type, contenu, visible_parent
activites               → id, prof_id, classe_id, matiere_id, date, titre, contenu, pieces_jointes
```

### Bulletins

```
bulletins               → id, inscription_id, periode_id (NULL = annuel), moyenne_generale,
                          rang, appreciation, publie, publie_le, pdf_url
bulletin_matiere        → id, bulletin_id, matiere_id, moyenne, rang, appreciation, prof_id
```

### Communication

```
annonces                → id, etablissement_id (nullable), classe_id (nullable), titre, contenu, auteur_id
notifications           → id, destinataire_id, destinataire_type, titre, contenu, lu
```

---

## Structure du monorepo

```
orety/
├── supabase/
│   ├── migrations/           # SQL versionnées
│   │   ├── 0001_tenancy.sql
│   │   ├── 0002_identite.sql
│   │   ├── 0003_structure_scolaire.sql
│   │   ├── 0004_profs_affectations.sql
│   │   ├── 0005_eleves_parents.sql
│   │   ├── 0006_evaluations.sql
│   │   ├── 0007_bulletins.sql
│   │   ├── 0008_vie_scolaire.sql
│   │   └── 0009_rls_policies.sql
│   ├── functions/            # Edge Functions
│   │   ├── generate-parent-pseudo/
│   │   ├── calculer-bulletin/
│   │   └── envoyer-acces-parent/
│   └── seeds/
│
├── web/
│   ├── app/
│   │   ├── (public)/         # Site vitrine
│   │   ├── (auth)/login
│   │   ├── admin/            # Dashboard école
│   │   ├── super/            # Super-admin multi-écoles
│   │   └── api/
│   ├── components/
│   │   ├── ui/               # shadcn/ui
│   │   ├── forms/
│   │   ├── data-tables/
│   │   └── charts/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── auth/
│   │   ├── tenancy/
│   │   ├── bulletin/         # moteur formule + calcul
│   │   └── validation/       # schémas zod
│   └── types/                # générés depuis Supabase
│
└── mobile/                   # Flutter (parent + prof) — phase 2
```

---

## Routes du dashboard admin

```
/admin
  ├── /vue                 → KPIs globaux
  ├── /etablissements      → Sites
  ├── /annees              → Années scolaires + config bulletin
  ├── /niveaux             → Niveaux par cycle
  ├── /classes             → Classes
  ├── /matieres            → Matières + coefficients
  ├── /profs               → Profs + multi-sites + matières
  ├── /affectations        → Attribution prof × classe [× matière]
  ├── /eleves              → Élèves + inscriptions
  ├── /parents             → Comptes parents (pseudo, regénération)
  ├── /evaluations         → Suivi des évaluations
  ├── /bulletins           → Génération + publication
  ├── /presences           → Tableau de présences
  ├── /communications      → Annonces
  ├── /rapports            → Stats & exports
  └── /parametres          → Branding, infos org

/super
  ├── /organisations
  ├── /utilisateurs-systeme
  └── /stats-globales
```

---

## Plan de phases

| Phase | Contenu |
|-------|---------|
| 1 | Fondations Supabase : schéma DB complet + RLS + seeds (Orety + établissements) |
| 2 | Auth + tenancy + guards par rôle |
| 3 | CRUD socle : établissements, années, niveaux, classes, matières, coefficients |
| 4 | Profs + affectations (distinction primaire / secondaire) |
| 5 | Élèves + parents (génération pseudo + mot de passe) |
| 6 | Évaluations + notes + bonus |
| 7 | Bulletins : moteur de calcul + formule configurable + PDF |
| 8 | Vie scolaire : présences, observations, activités |
| 9 | Communications + rapports |
| 10 | Super-admin multi-écoles + white-labeling |
| 11 | Site vitrine Orety |
| 12 | Apps mobile parent + prof |

---

## Décisions validées

| Sujet | Décision |
|-------|----------|
| Périmètre | Multi-sites, un seul écosystème unifié |
| Langue | Français |
| Livraison | Tout en parallèle |
| Paiements | Reportés (Airtel Money / Moov Money) |
| Offline | Sélectif sur mobile |
| Hébergement web | Cloudflare Pages |
| Web | Site vitrine + admin = **même app Next.js** |
| Repo | Monorepo unique |
| SaaS | Architecture multi-tenant dès le départ, white-labeling prévu |
| Accès parent | Pseudo mnémonique + password généré + PIN mobile ; pseudo = `cle_parentale` |

## Décisions en attente

- [ ] Permissions par défaut des rôles système (notamment : prof peut-il voir bulletins finalisés ? secrétariat peut-il consulter les notes en lecture seule ?)
- [ ] Format et template du bulletin PDF (mise en page, signatures, tampon)
- [ ] Palette exacte vert/bleu/jaune/rouge à extraire des logos (codes hex précis)

## État actuel

**Phase préparatoire** — alignement architecture et règles métier.
**Pas de code démarré.** Attente : infos design, décision auth parent, clarification Orety/Aurélie.
