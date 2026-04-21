-- =============================================================================
-- RLS Policies
-- =============================================================================
-- Règles générales :
--   - super_admin : bypass (voit tout)
--   - admin_org / secretariat / prof / parent : scopés à leur organisation
--   - directeur_site : scopé à son établissement
--   - prof : souvent limité à ses affectations (use is_affected_to_*)
--   - parent : limité à ses enfants (use is_parent_of_eleve)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ORGANISATIONS
-- -----------------------------------------------------------------------------
alter table organisations enable row level security;

create policy "organisations_select_self_or_super"
  on organisations for select
  using (
    orety.is_super_admin()
    or id = orety.current_org_id()
  );

create policy "organisations_write_super_admin"
  on organisations for all
  using (orety.is_super_admin())
  with check (orety.is_super_admin());

-- -----------------------------------------------------------------------------
-- ETABLISSEMENTS
-- -----------------------------------------------------------------------------
alter table etablissements enable row level security;

create policy "etablissements_select_same_org"
  on etablissements for select
  using (
    orety.is_super_admin()
    or organisation_id = orety.current_org_id()
  );

create policy "etablissements_write_admin"
  on etablissements for all
  using (
    orety.is_super_admin()
    or (organisation_id = orety.current_org_id()
        and orety.has_permission('etablissements.gerer'))
  )
  with check (
    orety.is_super_admin()
    or (organisation_id = orety.current_org_id()
        and orety.has_permission('etablissements.gerer'))
  );

-- -----------------------------------------------------------------------------
-- PERMISSIONS (catalogue en lecture seule pour tous, écriture super_admin)
-- -----------------------------------------------------------------------------
alter table permissions enable row level security;

create policy "permissions_select_all"
  on permissions for select
  using (auth.uid() is not null);

create policy "permissions_write_super_admin"
  on permissions for all
  using (orety.is_super_admin())
  with check (orety.is_super_admin());

-- -----------------------------------------------------------------------------
-- ROLES
-- -----------------------------------------------------------------------------
alter table roles enable row level security;

create policy "roles_select_system_or_same_org"
  on roles for select
  using (
    is_system = true
    or orety.is_super_admin()
    or organisation_id = orety.current_org_id()
  );

create policy "roles_write_system_super_only"
  on roles for all
  using (
    -- rôles système : super_admin uniquement
    (is_system = true and orety.is_super_admin())
    -- rôles d'org : super_admin OU admin_org possédant la permission
    or (is_system = false and (
         orety.is_super_admin()
         or (organisation_id = orety.current_org_id()
             and orety.has_permission('roles.gerer'))
       ))
  )
  with check (
    (is_system = true and orety.is_super_admin())
    or (is_system = false and (
         orety.is_super_admin()
         or (organisation_id = orety.current_org_id()
             and orety.has_permission('roles.gerer'))
       ))
  );

-- -----------------------------------------------------------------------------
-- ROLE_PERMISSIONS
-- -----------------------------------------------------------------------------
alter table role_permissions enable row level security;

create policy "role_permissions_select"
  on role_permissions for select
  using (
    orety.is_super_admin()
    or exists (
      select 1 from roles r
      where r.id = role_permissions.role_id
        and (r.is_system = true or r.organisation_id = orety.current_org_id())
    )
  );

create policy "role_permissions_write"
  on role_permissions for all
  using (
    orety.is_super_admin()
    or (
      exists (
        select 1 from roles r
        where r.id = role_permissions.role_id
          and r.is_system = false
          and r.organisation_id = orety.current_org_id()
      )
      and orety.has_permission('roles.gerer')
    )
  )
  with check (
    orety.is_super_admin()
    or (
      exists (
        select 1 from roles r
        where r.id = role_permissions.role_id
          and r.is_system = false
          and r.organisation_id = orety.current_org_id()
      )
      and orety.has_permission('roles.gerer')
    )
  );

-- -----------------------------------------------------------------------------
-- UTILISATEURS
-- -----------------------------------------------------------------------------
alter table utilisateurs enable row level security;

-- Chacun peut lire son propre profil
create policy "utilisateurs_select_self"
  on utilisateurs for select
  using (id = auth.uid());

-- Même organisation visible si permission "utilisateurs.lire"
create policy "utilisateurs_select_same_org_with_perm"
  on utilisateurs for select
  using (
    orety.is_super_admin()
    or (organisation_id = orety.current_org_id()
        and orety.has_permission('utilisateurs.lire'))
  );

-- Mise à jour de son propre profil (infos personnelles, pin, photo)
create policy "utilisateurs_update_self"
  on utilisateurs for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Gestion des utilisateurs par un admin ayant la permission
create policy "utilisateurs_admin_write"
  on utilisateurs for all
  using (
    orety.is_super_admin()
    or (organisation_id = orety.current_org_id()
        and orety.has_permission('utilisateurs.gerer'))
  )
  with check (
    orety.is_super_admin()
    or (organisation_id = orety.current_org_id()
        and orety.has_permission('utilisateurs.gerer'))
  );

-- -----------------------------------------------------------------------------
-- UTILISATEUR_ETABLISSEMENTS
-- -----------------------------------------------------------------------------
alter table utilisateur_etablissements enable row level security;

create policy "ue_select_same_org"
  on utilisateur_etablissements for select
  using (
    orety.is_super_admin()
    or utilisateur_id = auth.uid()
    or exists (
      select 1 from utilisateurs u
      where u.id = utilisateur_etablissements.utilisateur_id
        and u.organisation_id = orety.current_org_id()
    )
  );

create policy "ue_write_admin"
  on utilisateur_etablissements for all
  using (
    orety.is_super_admin()
    or orety.has_permission('utilisateurs.gerer')
  )
  with check (
    orety.is_super_admin()
    or orety.has_permission('utilisateurs.gerer')
  );

-- -----------------------------------------------------------------------------
-- STRUCTURE SCOLAIRE : années, config, périodes, niveaux, classes, matières, coefficients
-- -----------------------------------------------------------------------------
alter table annees_scolaires enable row level security;
alter table config_bulletins enable row level security;
alter table periodes_scolaires enable row level security;
alter table niveaux enable row level security;
alter table classes enable row level security;
alter table matieres enable row level security;
alter table coefficients_matiere enable row level security;

-- Lecture : même organisation pour tous
create policy "annees_select_same_org"
  on annees_scolaires for select
  using (orety.is_super_admin() or organisation_id = orety.current_org_id());

create policy "annees_write_admin"
  on annees_scolaires for all
  using (orety.is_super_admin()
         or (organisation_id = orety.current_org_id()
             and orety.has_permission('structure_scolaire.gerer')))
  with check (orety.is_super_admin()
              or (organisation_id = orety.current_org_id()
                  and orety.has_permission('structure_scolaire.gerer')));

create policy "config_bulletins_select"
  on config_bulletins for select
  using (
    orety.is_super_admin()
    or exists (
      select 1 from etablissements e
      where e.id = config_bulletins.etablissement_id
        and e.organisation_id = orety.current_org_id()
    )
  );

create policy "config_bulletins_write"
  on config_bulletins for all
  using (
    orety.is_super_admin()
    or (orety.has_permission('structure_scolaire.gerer')
        and exists (
          select 1 from etablissements e
          where e.id = config_bulletins.etablissement_id
            and e.organisation_id = orety.current_org_id()
        ))
  )
  with check (
    orety.is_super_admin()
    or (orety.has_permission('structure_scolaire.gerer')
        and exists (
          select 1 from etablissements e
          where e.id = config_bulletins.etablissement_id
            and e.organisation_id = orety.current_org_id()
        ))
  );

create policy "periodes_select"
  on periodes_scolaires for select
  using (
    orety.is_super_admin()
    or exists (
      select 1 from config_bulletins cb
      join etablissements e on e.id = cb.etablissement_id
      where cb.id = periodes_scolaires.config_bulletin_id
        and e.organisation_id = orety.current_org_id()
    )
  );

create policy "periodes_write"
  on periodes_scolaires for all
  using (
    orety.is_super_admin()
    or (orety.has_permission('structure_scolaire.gerer')
        and exists (
          select 1 from config_bulletins cb
          join etablissements e on e.id = cb.etablissement_id
          where cb.id = periodes_scolaires.config_bulletin_id
            and e.organisation_id = orety.current_org_id()
        ))
  )
  with check (
    orety.is_super_admin()
    or (orety.has_permission('structure_scolaire.gerer')
        and exists (
          select 1 from config_bulletins cb
          join etablissements e on e.id = cb.etablissement_id
          where cb.id = periodes_scolaires.config_bulletin_id
            and e.organisation_id = orety.current_org_id()
        ))
  );

create policy "niveaux_select"
  on niveaux for select
  using (
    orety.is_super_admin()
    or exists (
      select 1 from etablissements e
      where e.id = niveaux.etablissement_id
        and e.organisation_id = orety.current_org_id()
    )
  );

create policy "niveaux_write"
  on niveaux for all
  using (
    orety.is_super_admin()
    or (orety.has_permission('structure_scolaire.gerer')
        and orety.can_access_etab(etablissement_id))
  )
  with check (
    orety.is_super_admin()
    or (orety.has_permission('structure_scolaire.gerer')
        and orety.can_access_etab(etablissement_id))
  );

create policy "classes_select"
  on classes for select
  using (
    orety.is_super_admin()
    or exists (
      select 1 from niveaux n
      join etablissements e on e.id = n.etablissement_id
      where n.id = classes.niveau_id
        and e.organisation_id = orety.current_org_id()
    )
  );

create policy "classes_write"
  on classes for all
  using (
    orety.is_super_admin()
    or (orety.has_permission('classes.gerer')
        and exists (
          select 1 from niveaux n
          join etablissements e on e.id = n.etablissement_id
          where n.id = classes.niveau_id
            and e.organisation_id = orety.current_org_id()
            and orety.can_access_etab(e.id)
        ))
  )
  with check (
    orety.is_super_admin()
    or (orety.has_permission('classes.gerer')
        and exists (
          select 1 from niveaux n
          join etablissements e on e.id = n.etablissement_id
          where n.id = classes.niveau_id
            and e.organisation_id = orety.current_org_id()
            and orety.can_access_etab(e.id)
        ))
  );

create policy "matieres_select"
  on matieres for select
  using (
    orety.is_super_admin()
    or exists (
      select 1 from etablissements e
      where e.id = matieres.etablissement_id
        and e.organisation_id = orety.current_org_id()
    )
  );

create policy "matieres_write"
  on matieres for all
  using (
    orety.is_super_admin()
    or (orety.has_permission('structure_scolaire.gerer')
        and orety.can_access_etab(etablissement_id))
  )
  with check (
    orety.is_super_admin()
    or (orety.has_permission('structure_scolaire.gerer')
        and orety.can_access_etab(etablissement_id))
  );

create policy "coefficients_select"
  on coefficients_matiere for select
  using (
    orety.is_super_admin()
    or exists (
      select 1 from matieres m
      join etablissements e on e.id = m.etablissement_id
      where m.id = coefficients_matiere.matiere_id
        and e.organisation_id = orety.current_org_id()
    )
  );

create policy "coefficients_write"
  on coefficients_matiere for all
  using (
    orety.is_super_admin()
    or orety.has_permission('structure_scolaire.gerer')
  )
  with check (
    orety.is_super_admin()
    or orety.has_permission('structure_scolaire.gerer')
  );

-- -----------------------------------------------------------------------------
-- PROFS / PROF_MATIERES / AFFECTATIONS
-- -----------------------------------------------------------------------------
alter table profs enable row level security;
alter table prof_matieres enable row level security;
alter table affectations enable row level security;

create policy "profs_select"
  on profs for select
  using (
    utilisateur_id = auth.uid()
    or orety.is_super_admin()
    or orety.has_permission('profs.lire')
  );

create policy "profs_write"
  on profs for all
  using (
    orety.is_super_admin()
    or orety.has_permission('profs.gerer')
  )
  with check (
    orety.is_super_admin()
    or orety.has_permission('profs.gerer')
  );

create policy "prof_matieres_select"
  on prof_matieres for select
  using (
    utilisateur_id = auth.uid()
    or orety.is_super_admin()
    or orety.has_permission('profs.lire')
  );

create policy "prof_matieres_write"
  on prof_matieres for all
  using (orety.is_super_admin() or orety.has_permission('profs.gerer'))
  with check (orety.is_super_admin() or orety.has_permission('profs.gerer'));

create policy "affectations_select"
  on affectations for select
  using (
    utilisateur_id = auth.uid()
    or orety.is_super_admin()
    or orety.has_permission('affectations.lire')
  );

create policy "affectations_write"
  on affectations for all
  using (orety.is_super_admin() or orety.has_permission('affectations.gerer'))
  with check (orety.is_super_admin() or orety.has_permission('affectations.gerer'));

-- -----------------------------------------------------------------------------
-- ELEVES / INSCRIPTIONS
-- -----------------------------------------------------------------------------
alter table eleves enable row level security;
alter table inscriptions enable row level security;

create policy "eleves_select"
  on eleves for select
  using (
    orety.is_super_admin()
    or orety.is_parent_of_eleve(id)
    or orety.is_affected_to_eleve(id)
    or (orety.has_permission('eleves.lire')
        and orety.can_access_etab(etablissement_id))
  );

create policy "eleves_write"
  on eleves for all
  using (
    orety.is_super_admin()
    or (orety.has_permission('eleves.gerer')
        and orety.can_access_etab(etablissement_id))
  )
  with check (
    orety.is_super_admin()
    or (orety.has_permission('eleves.gerer')
        and orety.can_access_etab(etablissement_id))
  );

create policy "inscriptions_select"
  on inscriptions for select
  using (
    orety.is_super_admin()
    or orety.is_parent_of_eleve(eleve_id)
    or orety.is_affected_to_eleve(eleve_id)
    or orety.has_permission('eleves.lire')
  );

create policy "inscriptions_write"
  on inscriptions for all
  using (orety.is_super_admin() or orety.has_permission('eleves.gerer'))
  with check (orety.is_super_admin() or orety.has_permission('eleves.gerer'));

-- -----------------------------------------------------------------------------
-- EVALUATIONS / NOTES
-- -----------------------------------------------------------------------------
alter table types_evaluation enable row level security;
alter table evaluations enable row level security;
alter table notes enable row level security;

create policy "types_eval_select"
  on types_evaluation for select
  using (
    orety.is_super_admin()
    or exists (
      select 1 from etablissements e
      where e.id = types_evaluation.etablissement_id
        and e.organisation_id = orety.current_org_id()
    )
  );

create policy "types_eval_write"
  on types_evaluation for all
  using (orety.is_super_admin() or orety.has_permission('structure_scolaire.gerer'))
  with check (orety.is_super_admin() or orety.has_permission('structure_scolaire.gerer'));

create policy "evaluations_select"
  on evaluations for select
  using (
    orety.is_super_admin()
    -- Le prof responsable de l'affectation
    or exists (
      select 1 from affectations a
      where a.id = evaluations.affectation_id
        and a.utilisateur_id = auth.uid()
    )
    -- Les parents des élèves de la classe concernée, seulement si publiée
    or (publiee = true and exists (
      select 1
      from affectations a
      join inscriptions i on i.classe_id = a.classe_id
      join eleves el on el.id = i.eleve_id
      join utilisateurs u on u.pseudo = el.cle_parentale
      where a.id = evaluations.affectation_id
        and u.id = auth.uid()
    ))
    -- Consultation générale pour admin/staff
    or orety.has_permission('notes.lire')
  );

create policy "evaluations_write_by_prof"
  on evaluations for all
  using (
    orety.is_super_admin()
    or exists (
      select 1 from affectations a
      where a.id = evaluations.affectation_id
        and a.utilisateur_id = auth.uid()
    )
    or orety.has_permission('notes.gerer')
  )
  with check (
    orety.is_super_admin()
    or exists (
      select 1 from affectations a
      where a.id = evaluations.affectation_id
        and a.utilisateur_id = auth.uid()
    )
    or orety.has_permission('notes.gerer')
  );

create policy "notes_select"
  on notes for select
  using (
    orety.is_super_admin()
    -- le prof de l'évaluation
    or exists (
      select 1 from evaluations ev
      join affectations a on a.id = ev.affectation_id
      where ev.id = notes.evaluation_id
        and a.utilisateur_id = auth.uid()
    )
    -- le parent de l'élève, si l'évaluation est publiée
    or (
      orety.is_parent_of_eleve(eleve_id)
      and exists (
        select 1 from evaluations ev
        where ev.id = notes.evaluation_id and ev.publiee = true
      )
    )
    or orety.has_permission('notes.lire')
  );

create policy "notes_write_by_prof"
  on notes for all
  using (
    orety.is_super_admin()
    or exists (
      select 1 from evaluations ev
      join affectations a on a.id = ev.affectation_id
      where ev.id = notes.evaluation_id
        and a.utilisateur_id = auth.uid()
    )
    or orety.has_permission('notes.gerer')
  )
  with check (
    orety.is_super_admin()
    or exists (
      select 1 from evaluations ev
      join affectations a on a.id = ev.affectation_id
      where ev.id = notes.evaluation_id
        and a.utilisateur_id = auth.uid()
    )
    or orety.has_permission('notes.gerer')
  );

-- -----------------------------------------------------------------------------
-- BULLETINS
-- -----------------------------------------------------------------------------
alter table bulletins enable row level security;
alter table bulletin_matiere enable row level security;

create policy "bulletins_select"
  on bulletins for select
  using (
    orety.is_super_admin()
    or (publie = true and exists (
      select 1 from inscriptions i
      join eleves e on e.id = i.eleve_id
      where i.id = bulletins.inscription_id
        and orety.is_parent_of_eleve(e.id)
    ))
    or orety.has_permission('bulletins.lire')
  );

create policy "bulletins_write"
  on bulletins for all
  using (orety.is_super_admin() or orety.has_permission('bulletins.gerer'))
  with check (orety.is_super_admin() or orety.has_permission('bulletins.gerer'));

create policy "bulletin_matiere_select"
  on bulletin_matiere for select
  using (
    orety.is_super_admin()
    or exists (
      select 1 from bulletins b
      join inscriptions i on i.id = b.inscription_id
      where b.id = bulletin_matiere.bulletin_id
        and b.publie = true
        and orety.is_parent_of_eleve(i.eleve_id)
    )
    or orety.has_permission('bulletins.lire')
  );

create policy "bulletin_matiere_write"
  on bulletin_matiere for all
  using (orety.is_super_admin() or orety.has_permission('bulletins.gerer'))
  with check (orety.is_super_admin() or orety.has_permission('bulletins.gerer'));

-- -----------------------------------------------------------------------------
-- VIE SCOLAIRE : seances, presences, observations, activites
-- -----------------------------------------------------------------------------
alter table seances enable row level security;
alter table presences enable row level security;
alter table observations enable row level security;
alter table activites enable row level security;

create policy "seances_select"
  on seances for select
  using (
    orety.is_super_admin()
    or exists (
      select 1 from affectations a
      where a.id = seances.affectation_id
        and a.utilisateur_id = auth.uid()
    )
    or orety.has_permission('seances.lire')
  );

create policy "seances_write"
  on seances for all
  using (
    orety.is_super_admin()
    or exists (
      select 1 from affectations a
      where a.id = seances.affectation_id
        and a.utilisateur_id = auth.uid()
    )
  )
  with check (
    orety.is_super_admin()
    or exists (
      select 1 from affectations a
      where a.id = seances.affectation_id
        and a.utilisateur_id = auth.uid()
    )
  );

create policy "presences_select"
  on presences for select
  using (
    orety.is_super_admin()
    or orety.is_parent_of_eleve(eleve_id)
    or exists (
      select 1 from seances s
      join affectations a on a.id = s.affectation_id
      where s.id = presences.seance_id
        and a.utilisateur_id = auth.uid()
    )
    or orety.has_permission('presences.lire')
  );

create policy "presences_write"
  on presences for all
  using (
    orety.is_super_admin()
    or exists (
      select 1 from seances s
      join affectations a on a.id = s.affectation_id
      where s.id = presences.seance_id
        and a.utilisateur_id = auth.uid()
    )
    or orety.has_permission('presences.gerer')
  )
  with check (
    orety.is_super_admin()
    or exists (
      select 1 from seances s
      join affectations a on a.id = s.affectation_id
      where s.id = presences.seance_id
        and a.utilisateur_id = auth.uid()
    )
    or orety.has_permission('presences.gerer')
  );

create policy "observations_select"
  on observations for select
  using (
    orety.is_super_admin()
    or prof_utilisateur_id = auth.uid()
    or (visible_parent = true and orety.is_parent_of_eleve(eleve_id))
    or orety.has_permission('observations.lire')
  );

create policy "observations_write"
  on observations for all
  using (
    orety.is_super_admin()
    or prof_utilisateur_id = auth.uid()
    or orety.has_permission('observations.gerer')
  )
  with check (
    orety.is_super_admin()
    or prof_utilisateur_id = auth.uid()
    or orety.has_permission('observations.gerer')
  );

create policy "activites_select"
  on activites for select
  using (
    orety.is_super_admin()
    or prof_utilisateur_id = auth.uid()
    or (visible_parent = true and classe_id is not null and exists (
      select 1 from inscriptions i
      join eleves e on e.id = i.eleve_id
      where i.classe_id = activites.classe_id
        and orety.is_parent_of_eleve(e.id)
    ))
    or orety.has_permission('activites.lire')
  );

create policy "activites_write"
  on activites for all
  using (
    orety.is_super_admin()
    or prof_utilisateur_id = auth.uid()
  )
  with check (
    orety.is_super_admin()
    or prof_utilisateur_id = auth.uid()
  );

-- -----------------------------------------------------------------------------
-- ANNONCES / NOTIFICATIONS / MESSAGES
-- -----------------------------------------------------------------------------
alter table annonces enable row level security;
alter table notifications enable row level security;
alter table messages enable row level security;

create policy "annonces_select"
  on annonces for select
  using (
    orety.is_super_admin()
    or (publiee = true and organisation_id = orety.current_org_id())
    or orety.has_permission('annonces.gerer')
  );

create policy "annonces_write"
  on annonces for all
  using (orety.is_super_admin() or orety.has_permission('annonces.gerer'))
  with check (orety.is_super_admin() or orety.has_permission('annonces.gerer'));

create policy "notifications_select_self"
  on notifications for select
  using (destinataire_id = auth.uid() or orety.is_super_admin());

create policy "notifications_update_self"
  on notifications for update
  using (destinataire_id = auth.uid())
  with check (destinataire_id = auth.uid());

create policy "notifications_insert_system"
  on notifications for insert
  with check (orety.is_super_admin() or orety.has_permission('notifications.envoyer'));

create policy "messages_select_involved"
  on messages for select
  using (
    orety.is_super_admin()
    or expediteur_id = auth.uid()
    or destinataire_id = auth.uid()
  );

create policy "messages_insert"
  on messages for insert
  with check (
    expediteur_id = auth.uid()
    and organisation_id = orety.current_org_id()
  );

create policy "messages_update_destinataire"
  on messages for update
  using (destinataire_id = auth.uid())
  with check (destinataire_id = auth.uid());
