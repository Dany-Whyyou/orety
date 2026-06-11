export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activites: {
        Row: {
          classe_id: string | null
          contenu: string | null
          cree_le: string
          date: string
          id: string
          matiere_id: string | null
          pieces_jointes: Json
          prof_utilisateur_id: string
          seance_id: string | null
          titre: string
          updated_at: string
          visible_parent: boolean
        }
        Insert: {
          classe_id?: string | null
          contenu?: string | null
          cree_le?: string
          date: string
          id?: string
          matiere_id?: string | null
          pieces_jointes?: Json
          prof_utilisateur_id: string
          seance_id?: string | null
          titre: string
          updated_at?: string
          visible_parent?: boolean
        }
        Update: {
          classe_id?: string | null
          contenu?: string | null
          cree_le?: string
          date?: string
          id?: string
          matiere_id?: string | null
          pieces_jointes?: Json
          prof_utilisateur_id?: string
          seance_id?: string | null
          titre?: string
          updated_at?: string
          visible_parent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "activites_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activites_matiere_id_fkey"
            columns: ["matiere_id"]
            isOneToOne: false
            referencedRelation: "matieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activites_prof_utilisateur_id_fkey"
            columns: ["prof_utilisateur_id"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activites_seance_id_fkey"
            columns: ["seance_id"]
            isOneToOne: false
            referencedRelation: "seances"
            referencedColumns: ["id"]
          },
        ]
      }
      affectations: {
        Row: {
          annee_scolaire_id: string
          classe_id: string
          cree_le: string
          heures_semaine: number | null
          id: string
          matiere_id: string | null
          updated_at: string
          utilisateur_id: string
        }
        Insert: {
          annee_scolaire_id: string
          classe_id: string
          cree_le?: string
          heures_semaine?: number | null
          id?: string
          matiere_id?: string | null
          updated_at?: string
          utilisateur_id: string
        }
        Update: {
          annee_scolaire_id?: string
          classe_id?: string
          cree_le?: string
          heures_semaine?: number | null
          id?: string
          matiere_id?: string | null
          updated_at?: string
          utilisateur_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affectations_annee_scolaire_id_fkey"
            columns: ["annee_scolaire_id"]
            isOneToOne: false
            referencedRelation: "annees_scolaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affectations_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affectations_matiere_id_fkey"
            columns: ["matiere_id"]
            isOneToOne: false
            referencedRelation: "matieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affectations_utilisateur_id_fkey"
            columns: ["utilisateur_id"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      annees_scolaires: {
        Row: {
          active: boolean
          archivee: boolean
          cree_le: string
          date_debut: string
          date_fin: string
          id: string
          libelle: string
          organisation_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          archivee?: boolean
          cree_le?: string
          date_debut: string
          date_fin: string
          id?: string
          libelle: string
          organisation_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          archivee?: boolean
          cree_le?: string
          date_debut?: string
          date_fin?: string
          id?: string
          libelle?: string
          organisation_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "annees_scolaires_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      annonces: {
        Row: {
          auteur_id: string | null
          cible: Database["public"]["Enums"]["cible_annonce"]
          classe_id: string | null
          contenu: string
          cree_le: string
          etablissement_id: string | null
          expire_le: string | null
          id: string
          organisation_id: string
          pieces_jointes: Json
          publiee: boolean
          publiee_le: string | null
          titre: string
          updated_at: string
        }
        Insert: {
          auteur_id?: string | null
          cible?: Database["public"]["Enums"]["cible_annonce"]
          classe_id?: string | null
          contenu: string
          cree_le?: string
          etablissement_id?: string | null
          expire_le?: string | null
          id?: string
          organisation_id: string
          pieces_jointes?: Json
          publiee?: boolean
          publiee_le?: string | null
          titre: string
          updated_at?: string
        }
        Update: {
          auteur_id?: string | null
          cible?: Database["public"]["Enums"]["cible_annonce"]
          classe_id?: string | null
          contenu?: string
          cree_le?: string
          etablissement_id?: string | null
          expire_le?: string | null
          id?: string
          organisation_id?: string
          pieces_jointes?: Json
          publiee?: boolean
          publiee_le?: string | null
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "annonces_auteur_id_fkey"
            columns: ["auteur_id"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "annonces_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "annonces_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "annonces_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      archives_annee: {
        Row: {
          annee_scolaire_id: string
          cloturee_le: string
          cloturee_par: string | null
          cree_le: string
          donnees_agregees: Json
          effectif_fin_annee: number
          etablissement_id: string | null
          id: string
          moyenne_generale_etablissement: number | null
          nb_admis: number
          nb_diplomes: number
          nb_exclus: number
          nb_redoublants: number
          nb_transferes: number
          organisation_id: string
          rapport_pdf_url: string | null
          taux_reussite: number | null
          updated_at: string
        }
        Insert: {
          annee_scolaire_id: string
          cloturee_le?: string
          cloturee_par?: string | null
          cree_le?: string
          donnees_agregees?: Json
          effectif_fin_annee?: number
          etablissement_id?: string | null
          id?: string
          moyenne_generale_etablissement?: number | null
          nb_admis?: number
          nb_diplomes?: number
          nb_exclus?: number
          nb_redoublants?: number
          nb_transferes?: number
          organisation_id: string
          rapport_pdf_url?: string | null
          taux_reussite?: number | null
          updated_at?: string
        }
        Update: {
          annee_scolaire_id?: string
          cloturee_le?: string
          cloturee_par?: string | null
          cree_le?: string
          donnees_agregees?: Json
          effectif_fin_annee?: number
          etablissement_id?: string | null
          id?: string
          moyenne_generale_etablissement?: number | null
          nb_admis?: number
          nb_diplomes?: number
          nb_exclus?: number
          nb_redoublants?: number
          nb_transferes?: number
          organisation_id?: string
          rapport_pdf_url?: string | null
          taux_reussite?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "archives_annee_annee_scolaire_id_fkey"
            columns: ["annee_scolaire_id"]
            isOneToOne: false
            referencedRelation: "annees_scolaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archives_annee_cloturee_par_fkey"
            columns: ["cloturee_par"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archives_annee_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archives_annee_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      bulletin_matiere: {
        Row: {
          appreciation: string | null
          bulletin_id: string
          coefficient: number
          cree_le: string
          id: string
          matiere_id: string
          moyenne: number | null
          moyenne_classe: number | null
          prof_utilisateur_id: string | null
          rang: number | null
          updated_at: string
        }
        Insert: {
          appreciation?: string | null
          bulletin_id: string
          coefficient: number
          cree_le?: string
          id?: string
          matiere_id: string
          moyenne?: number | null
          moyenne_classe?: number | null
          prof_utilisateur_id?: string | null
          rang?: number | null
          updated_at?: string
        }
        Update: {
          appreciation?: string | null
          bulletin_id?: string
          coefficient?: number
          cree_le?: string
          id?: string
          matiere_id?: string
          moyenne?: number | null
          moyenne_classe?: number | null
          prof_utilisateur_id?: string | null
          rang?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulletin_matiere_bulletin_id_fkey"
            columns: ["bulletin_id"]
            isOneToOne: false
            referencedRelation: "bulletins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulletin_matiere_matiere_id_fkey"
            columns: ["matiere_id"]
            isOneToOne: false
            referencedRelation: "matieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulletin_matiere_prof_utilisateur_id_fkey"
            columns: ["prof_utilisateur_id"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      bulletins: {
        Row: {
          appreciation_generale: string | null
          cree_le: string
          decision_conseil: string | null
          effectif_classe: number | null
          est_annuel: boolean
          id: string
          inscription_id: string
          moyenne_classe: number | null
          moyenne_generale: number | null
          pdf_url: string | null
          periode_id: string | null
          publie: boolean
          publie_le: string | null
          rang: number | null
          updated_at: string
        }
        Insert: {
          appreciation_generale?: string | null
          cree_le?: string
          decision_conseil?: string | null
          effectif_classe?: number | null
          est_annuel?: boolean
          id?: string
          inscription_id: string
          moyenne_classe?: number | null
          moyenne_generale?: number | null
          pdf_url?: string | null
          periode_id?: string | null
          publie?: boolean
          publie_le?: string | null
          rang?: number | null
          updated_at?: string
        }
        Update: {
          appreciation_generale?: string | null
          cree_le?: string
          decision_conseil?: string | null
          effectif_classe?: number | null
          est_annuel?: boolean
          id?: string
          inscription_id?: string
          moyenne_classe?: number | null
          moyenne_generale?: number | null
          pdf_url?: string | null
          periode_id?: string | null
          publie?: boolean
          publie_le?: string | null
          rang?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulletins_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulletins_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "periodes_scolaires"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          annee_scolaire_id: string
          capacite_max: number | null
          code: string | null
          cree_le: string
          id: string
          niveau_id: string
          nom: string
          salle: string | null
          titulaire_utilisateur_id: string | null
          updated_at: string
        }
        Insert: {
          annee_scolaire_id: string
          capacite_max?: number | null
          code?: string | null
          cree_le?: string
          id?: string
          niveau_id: string
          nom: string
          salle?: string | null
          titulaire_utilisateur_id?: string | null
          updated_at?: string
        }
        Update: {
          annee_scolaire_id?: string
          capacite_max?: number | null
          code?: string | null
          cree_le?: string
          id?: string
          niveau_id?: string
          nom?: string
          salle?: string | null
          titulaire_utilisateur_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_annee_scolaire_id_fkey"
            columns: ["annee_scolaire_id"]
            isOneToOne: false
            referencedRelation: "annees_scolaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_niveau_id_fkey"
            columns: ["niveau_id"]
            isOneToOne: false
            referencedRelation: "niveaux"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_titulaire_utilisateur_id_fkey"
            columns: ["titulaire_utilisateur_id"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      coefficients_matiere: {
        Row: {
          coefficient: number
          cree_le: string
          id: string
          matiere_id: string
          niveau_id: string
          updated_at: string
        }
        Insert: {
          coefficient: number
          cree_le?: string
          id?: string
          matiere_id: string
          niveau_id: string
          updated_at?: string
        }
        Update: {
          coefficient?: number
          cree_le?: string
          id?: string
          matiere_id?: string
          niveau_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coefficients_matiere_matiere_id_fkey"
            columns: ["matiere_id"]
            isOneToOne: false
            referencedRelation: "matieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coefficients_matiere_niveau_id_fkey"
            columns: ["niveau_id"]
            isOneToOne: false
            referencedRelation: "niveaux"
            referencedColumns: ["id"]
          },
        ]
      }
      config_bulletins: {
        Row: {
          affiche_appreciation: boolean
          affiche_rang: boolean
          annee_scolaire_id: string
          cree_le: string
          etablissement_id: string
          formule_annuelle_dsl: string
          formule_annuelle_json: Json
          frequence: Database["public"]["Enums"]["frequence_bulletin"]
          id: string
          nb_periodes: number
          note_maximale: number
          note_passage: number
          updated_at: string
        }
        Insert: {
          affiche_appreciation?: boolean
          affiche_rang?: boolean
          annee_scolaire_id: string
          cree_le?: string
          etablissement_id: string
          formule_annuelle_dsl: string
          formule_annuelle_json: Json
          frequence: Database["public"]["Enums"]["frequence_bulletin"]
          id?: string
          nb_periodes: number
          note_maximale?: number
          note_passage?: number
          updated_at?: string
        }
        Update: {
          affiche_appreciation?: boolean
          affiche_rang?: boolean
          annee_scolaire_id?: string
          cree_le?: string
          etablissement_id?: string
          formule_annuelle_dsl?: string
          formule_annuelle_json?: Json
          frequence?: Database["public"]["Enums"]["frequence_bulletin"]
          id?: string
          nb_periodes?: number
          note_maximale?: number
          note_passage?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "config_bulletins_annee_scolaire_id_fkey"
            columns: ["annee_scolaire_id"]
            isOneToOne: false
            referencedRelation: "annees_scolaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_bulletins_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      eleves: {
        Row: {
          actif: boolean
          adresse: string | null
          cle_parentale: string
          cree_le: string
          date_naissance: string | null
          etablissement_id: string
          id: string
          infos_allergies: string | null
          infos_medicales: string | null
          lieu_naissance: string | null
          matricule: string
          nationalite: string | null
          nom: string
          personne_urgence: string | null
          photo_url: string | null
          prenom: string
          sexe: Database["public"]["Enums"]["sexe_eleve"] | null
          tel_urgence: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean
          adresse?: string | null
          cle_parentale: string
          cree_le?: string
          date_naissance?: string | null
          etablissement_id: string
          id?: string
          infos_allergies?: string | null
          infos_medicales?: string | null
          lieu_naissance?: string | null
          matricule: string
          nationalite?: string | null
          nom: string
          personne_urgence?: string | null
          photo_url?: string | null
          prenom: string
          sexe?: Database["public"]["Enums"]["sexe_eleve"] | null
          tel_urgence?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean
          adresse?: string | null
          cle_parentale?: string
          cree_le?: string
          date_naissance?: string | null
          etablissement_id?: string
          id?: string
          infos_allergies?: string | null
          infos_medicales?: string | null
          lieu_naissance?: string | null
          matricule?: string
          nationalite?: string | null
          nom?: string
          personne_urgence?: string | null
          photo_url?: string | null
          prenom?: string
          sexe?: Database["public"]["Enums"]["sexe_eleve"] | null
          tel_urgence?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eleves_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_eleves_cle_parentale"
            columns: ["cle_parentale"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["pseudo"]
          },
        ]
      }
      etablissements: {
        Row: {
          actif: boolean
          adresse: string | null
          couleur_primaire: string | null
          couleur_secondaire: string | null
          cree_le: string
          cycle_principal: Database["public"]["Enums"]["cycle_scolaire"]
          cycles_couverts: Database["public"]["Enums"]["cycle_scolaire"][]
          email: string | null
          id: string
          logo_url: string | null
          nom: string
          organisation_id: string
          photo_url: string | null
          slogan: string | null
          slug: string
          telephone: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean
          adresse?: string | null
          couleur_primaire?: string | null
          couleur_secondaire?: string | null
          cree_le?: string
          cycle_principal: Database["public"]["Enums"]["cycle_scolaire"]
          cycles_couverts?: Database["public"]["Enums"]["cycle_scolaire"][]
          email?: string | null
          id?: string
          logo_url?: string | null
          nom: string
          organisation_id: string
          photo_url?: string | null
          slogan?: string | null
          slug: string
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean
          adresse?: string | null
          couleur_primaire?: string | null
          couleur_secondaire?: string | null
          cree_le?: string
          cycle_principal?: Database["public"]["Enums"]["cycle_scolaire"]
          cycles_couverts?: Database["public"]["Enums"]["cycle_scolaire"][]
          email?: string | null
          id?: string
          logo_url?: string | null
          nom?: string
          organisation_id?: string
          photo_url?: string | null
          slogan?: string | null
          slug?: string
          telephone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "etablissements_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          affectation_id: string
          autorise_bonus: boolean
          bareme: number
          bonus_max: number | null
          cree_le: string
          cree_par: string | null
          date_evaluation: string
          description: string | null
          id: string
          periode_id: string
          poids: number
          publiee: boolean
          publiee_le: string | null
          titre: string
          type_evaluation_id: string
          updated_at: string
        }
        Insert: {
          affectation_id: string
          autorise_bonus?: boolean
          bareme: number
          bonus_max?: number | null
          cree_le?: string
          cree_par?: string | null
          date_evaluation: string
          description?: string | null
          id?: string
          periode_id: string
          poids?: number
          publiee?: boolean
          publiee_le?: string | null
          titre: string
          type_evaluation_id: string
          updated_at?: string
        }
        Update: {
          affectation_id?: string
          autorise_bonus?: boolean
          bareme?: number
          bonus_max?: number | null
          cree_le?: string
          cree_par?: string | null
          date_evaluation?: string
          description?: string | null
          id?: string
          periode_id?: string
          poids?: number
          publiee?: boolean
          publiee_le?: string | null
          titre?: string
          type_evaluation_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_affectation_id_fkey"
            columns: ["affectation_id"]
            isOneToOne: false
            referencedRelation: "affectations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_cree_par_fkey"
            columns: ["cree_par"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "periodes_scolaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_type_evaluation_id_fkey"
            columns: ["type_evaluation_id"]
            isOneToOne: false
            referencedRelation: "types_evaluation"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          action_prise: string | null
          auteur_id: string | null
          cree_le: string
          date_incident: string
          description: string
          eleve_id: string
          etablissement_id: string
          gravite: Database["public"]["Enums"]["gravite_incident"]
          id: string
          lieu: string | null
          notifie_le: string | null
          notifie_parent: boolean
          organisation_id: string
          photos: Json
          statut: Database["public"]["Enums"]["statut_incident"]
          titre: string
          type: Database["public"]["Enums"]["type_incident"]
          updated_at: string
        }
        Insert: {
          action_prise?: string | null
          auteur_id?: string | null
          cree_le?: string
          date_incident?: string
          description: string
          eleve_id: string
          etablissement_id: string
          gravite?: Database["public"]["Enums"]["gravite_incident"]
          id?: string
          lieu?: string | null
          notifie_le?: string | null
          notifie_parent?: boolean
          organisation_id: string
          photos?: Json
          statut?: Database["public"]["Enums"]["statut_incident"]
          titre: string
          type?: Database["public"]["Enums"]["type_incident"]
          updated_at?: string
        }
        Update: {
          action_prise?: string | null
          auteur_id?: string | null
          cree_le?: string
          date_incident?: string
          description?: string
          eleve_id?: string
          etablissement_id?: string
          gravite?: Database["public"]["Enums"]["gravite_incident"]
          id?: string
          lieu?: string | null
          notifie_le?: string | null
          notifie_parent?: boolean
          organisation_id?: string
          photos?: Json
          statut?: Database["public"]["Enums"]["statut_incident"]
          titre?: string
          type?: Database["public"]["Enums"]["type_incident"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_auteur_id_fkey"
            columns: ["auteur_id"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_eleve_id_fkey"
            columns: ["eleve_id"]
            isOneToOne: false
            referencedRelation: "eleves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      inscriptions: {
        Row: {
          annee_scolaire_id: string
          classe_id: string
          cree_le: string
          date_inscription: string
          decision_fin_annee:
            | Database["public"]["Enums"]["statut_inscription"]
            | null
          decision_le: string | null
          decision_par: string | null
          eleve_id: string
          id: string
          motif_decision: string | null
          numero_ordre: number | null
          observations: string | null
          statut: Database["public"]["Enums"]["statut_inscription"]
          updated_at: string
        }
        Insert: {
          annee_scolaire_id: string
          classe_id: string
          cree_le?: string
          date_inscription?: string
          decision_fin_annee?:
            | Database["public"]["Enums"]["statut_inscription"]
            | null
          decision_le?: string | null
          decision_par?: string | null
          eleve_id: string
          id?: string
          motif_decision?: string | null
          numero_ordre?: number | null
          observations?: string | null
          statut?: Database["public"]["Enums"]["statut_inscription"]
          updated_at?: string
        }
        Update: {
          annee_scolaire_id?: string
          classe_id?: string
          cree_le?: string
          date_inscription?: string
          decision_fin_annee?:
            | Database["public"]["Enums"]["statut_inscription"]
            | null
          decision_le?: string | null
          decision_par?: string | null
          eleve_id?: string
          id?: string
          motif_decision?: string | null
          numero_ordre?: number | null
          observations?: string | null
          statut?: Database["public"]["Enums"]["statut_inscription"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscriptions_annee_scolaire_id_fkey"
            columns: ["annee_scolaire_id"]
            isOneToOne: false
            referencedRelation: "annees_scolaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_decision_par_fkey"
            columns: ["decision_par"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_eleve_id_fkey"
            columns: ["eleve_id"]
            isOneToOne: false
            referencedRelation: "eleves"
            referencedColumns: ["id"]
          },
        ]
      }
      matieres: {
        Row: {
          actif: boolean
          code: string
          couleur: string | null
          cree_le: string
          etablissement_id: string
          id: string
          nom: string
          ordre: number
          updated_at: string
        }
        Insert: {
          actif?: boolean
          code: string
          couleur?: string | null
          cree_le?: string
          etablissement_id: string
          id?: string
          nom: string
          ordre?: number
          updated_at?: string
        }
        Update: {
          actif?: boolean
          code?: string
          couleur?: string | null
          cree_le?: string
          etablissement_id?: string
          id?: string
          nom?: string
          ordre?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matieres_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          contenu: string
          cree_le: string
          destinataire_id: string
          expediteur_id: string
          id: string
          lu: boolean
          lu_le: string | null
          organisation_id: string
          reponse_a: string | null
          sujet: string | null
        }
        Insert: {
          contenu: string
          cree_le?: string
          destinataire_id: string
          expediteur_id: string
          id?: string
          lu?: boolean
          lu_le?: string | null
          organisation_id: string
          reponse_a?: string | null
          sujet?: string | null
        }
        Update: {
          contenu?: string
          cree_le?: string
          destinataire_id?: string
          expediteur_id?: string
          id?: string
          lu?: boolean
          lu_le?: string | null
          organisation_id?: string
          reponse_a?: string | null
          sujet?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_destinataire_id_fkey"
            columns: ["destinataire_id"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_expediteur_id_fkey"
            columns: ["expediteur_id"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reponse_a_fkey"
            columns: ["reponse_a"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      niveaux: {
        Row: {
          code: string
          cree_le: string
          cycle: Database["public"]["Enums"]["cycle_scolaire"]
          etablissement_id: string
          id: string
          libelle: string
          ordre: number
          updated_at: string
        }
        Insert: {
          code: string
          cree_le?: string
          cycle: Database["public"]["Enums"]["cycle_scolaire"]
          etablissement_id: string
          id?: string
          libelle: string
          ordre: number
          updated_at?: string
        }
        Update: {
          code?: string
          cree_le?: string
          cycle?: Database["public"]["Enums"]["cycle_scolaire"]
          etablissement_id?: string
          id?: string
          libelle?: string
          ordre?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "niveaux_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          absent: boolean
          bonus: number
          commentaire: string | null
          cree_le: string
          eleve_id: string
          evaluation_id: string
          id: string
          note: number | null
          saisie_le: string | null
          saisie_par: string | null
          updated_at: string
        }
        Insert: {
          absent?: boolean
          bonus?: number
          commentaire?: string | null
          cree_le?: string
          eleve_id: string
          evaluation_id: string
          id?: string
          note?: number | null
          saisie_le?: string | null
          saisie_par?: string | null
          updated_at?: string
        }
        Update: {
          absent?: boolean
          bonus?: number
          commentaire?: string | null
          cree_le?: string
          eleve_id?: string
          evaluation_id?: string
          id?: string
          note?: number | null
          saisie_le?: string | null
          saisie_par?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_eleve_id_fkey"
            columns: ["eleve_id"]
            isOneToOne: false
            referencedRelation: "eleves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_saisie_par_fkey"
            columns: ["saisie_par"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          contenu: string | null
          cree_le: string
          destinataire_id: string
          donnees: Json
          id: string
          lue: boolean
          lue_le: string | null
          titre: string
          type: Database["public"]["Enums"]["type_notification"]
          url_action: string | null
        }
        Insert: {
          contenu?: string | null
          cree_le?: string
          destinataire_id: string
          donnees?: Json
          id?: string
          lue?: boolean
          lue_le?: string | null
          titre: string
          type: Database["public"]["Enums"]["type_notification"]
          url_action?: string | null
        }
        Update: {
          contenu?: string | null
          cree_le?: string
          destinataire_id?: string
          donnees?: Json
          id?: string
          lue?: boolean
          lue_le?: string | null
          titre?: string
          type?: Database["public"]["Enums"]["type_notification"]
          url_action?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_destinataire_id_fkey"
            columns: ["destinataire_id"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      observations: {
        Row: {
          contenu: string
          cree_le: string
          eleve_id: string
          id: string
          matiere_id: string | null
          periode_id: string | null
          prof_utilisateur_id: string | null
          titre: string | null
          type: Database["public"]["Enums"]["type_observation"]
          updated_at: string
          visible_parent: boolean
        }
        Insert: {
          contenu: string
          cree_le?: string
          eleve_id: string
          id?: string
          matiere_id?: string | null
          periode_id?: string | null
          prof_utilisateur_id?: string | null
          titre?: string | null
          type: Database["public"]["Enums"]["type_observation"]
          updated_at?: string
          visible_parent?: boolean
        }
        Update: {
          contenu?: string
          cree_le?: string
          eleve_id?: string
          id?: string
          matiere_id?: string | null
          periode_id?: string | null
          prof_utilisateur_id?: string | null
          titre?: string | null
          type?: Database["public"]["Enums"]["type_observation"]
          updated_at?: string
          visible_parent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "observations_eleve_id_fkey"
            columns: ["eleve_id"]
            isOneToOne: false
            referencedRelation: "eleves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_matiere_id_fkey"
            columns: ["matiere_id"]
            isOneToOne: false
            referencedRelation: "matieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "periodes_scolaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_prof_utilisateur_id_fkey"
            columns: ["prof_utilisateur_id"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          actif: boolean
          adresse: string | null
          couleur_accent: string | null
          couleur_primaire: string | null
          couleur_secondaire: string | null
          cree_le: string
          devise: string | null
          email: string | null
          fuseau_horaire: string | null
          id: string
          logo_url: string | null
          nom: string
          pays: string | null
          plan: string | null
          site_web: string | null
          slug: string
          telephone: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          actif?: boolean
          adresse?: string | null
          couleur_accent?: string | null
          couleur_primaire?: string | null
          couleur_secondaire?: string | null
          cree_le?: string
          devise?: string | null
          email?: string | null
          fuseau_horaire?: string | null
          id?: string
          logo_url?: string | null
          nom: string
          pays?: string | null
          plan?: string | null
          site_web?: string | null
          slug: string
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          actif?: boolean
          adresse?: string | null
          couleur_accent?: string | null
          couleur_primaire?: string | null
          couleur_secondaire?: string | null
          cree_le?: string
          devise?: string | null
          email?: string | null
          fuseau_horaire?: string | null
          id?: string
          logo_url?: string | null
          nom?: string
          pays?: string | null
          plan?: string | null
          site_web?: string | null
          slug?: string
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      periodes_scolaires: {
        Row: {
          cloturee: boolean
          config_bulletin_id: string
          cree_le: string
          date_debut: string
          date_fin: string
          id: string
          libelle: string
          numero: number
          updated_at: string
        }
        Insert: {
          cloturee?: boolean
          config_bulletin_id: string
          cree_le?: string
          date_debut: string
          date_fin: string
          id?: string
          libelle: string
          numero: number
          updated_at?: string
        }
        Update: {
          cloturee?: boolean
          config_bulletin_id?: string
          cree_le?: string
          date_debut?: string
          date_fin?: string
          id?: string
          libelle?: string
          numero?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "periodes_scolaires_config_bulletin_id_fkey"
            columns: ["config_bulletin_id"]
            isOneToOne: false
            referencedRelation: "config_bulletins"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          cree_le: string
          description: string | null
          domaine: string
          libelle: string
          portee: Database["public"]["Enums"]["permission_portee"]
        }
        Insert: {
          code: string
          cree_le?: string
          description?: string | null
          domaine: string
          libelle: string
          portee?: Database["public"]["Enums"]["permission_portee"]
        }
        Update: {
          code?: string
          cree_le?: string
          description?: string | null
          domaine?: string
          libelle?: string
          portee?: Database["public"]["Enums"]["permission_portee"]
        }
        Relationships: []
      }
      presences: {
        Row: {
          commentaire: string | null
          cree_le: string
          eleve_id: string
          id: string
          minutes_retard: number | null
          saisie_le: string | null
          saisie_par: string | null
          seance_id: string
          statut: Database["public"]["Enums"]["statut_presence"]
          updated_at: string
        }
        Insert: {
          commentaire?: string | null
          cree_le?: string
          eleve_id: string
          id?: string
          minutes_retard?: number | null
          saisie_le?: string | null
          saisie_par?: string | null
          seance_id: string
          statut?: Database["public"]["Enums"]["statut_presence"]
          updated_at?: string
        }
        Update: {
          commentaire?: string | null
          cree_le?: string
          eleve_id?: string
          id?: string
          minutes_retard?: number | null
          saisie_le?: string | null
          saisie_par?: string | null
          seance_id?: string
          statut?: Database["public"]["Enums"]["statut_presence"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presences_eleve_id_fkey"
            columns: ["eleve_id"]
            isOneToOne: false
            referencedRelation: "eleves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presences_saisie_par_fkey"
            columns: ["saisie_par"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presences_seance_id_fkey"
            columns: ["seance_id"]
            isOneToOne: false
            referencedRelation: "seances"
            referencedColumns: ["id"]
          },
        ]
      }
      prof_matieres: {
        Row: {
          cree_le: string
          matiere_id: string
          utilisateur_id: string
        }
        Insert: {
          cree_le?: string
          matiere_id: string
          utilisateur_id: string
        }
        Update: {
          cree_le?: string
          matiere_id?: string
          utilisateur_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prof_matieres_matiere_id_fkey"
            columns: ["matiere_id"]
            isOneToOne: false
            referencedRelation: "matieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prof_matieres_utilisateur_id_fkey"
            columns: ["utilisateur_id"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      profs: {
        Row: {
          biographie: string | null
          cree_le: string
          date_embauche: string | null
          diplome: string | null
          matricule: string | null
          specialite: string | null
          updated_at: string
          utilisateur_id: string
        }
        Insert: {
          biographie?: string | null
          cree_le?: string
          date_embauche?: string | null
          diplome?: string | null
          matricule?: string | null
          specialite?: string | null
          updated_at?: string
          utilisateur_id: string
        }
        Update: {
          biographie?: string | null
          cree_le?: string
          date_embauche?: string | null
          diplome?: string | null
          matricule?: string | null
          specialite?: string | null
          updated_at?: string
          utilisateur_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profs_utilisateur_id_fkey"
            columns: ["utilisateur_id"]
            isOneToOne: true
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          accordee_le: string
          accordee_par: string | null
          permission_code: string
          role_id: string
        }
        Insert: {
          accordee_le?: string
          accordee_par?: string | null
          permission_code: string
          role_id: string
        }
        Update: {
          accordee_le?: string
          accordee_par?: string | null
          permission_code?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_code_fkey"
            columns: ["permission_code"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          actif: boolean
          code: string
          couleur: string | null
          cree_le: string
          description: string | null
          id: string
          is_system: boolean
          libelle: string
          niveau_hierarchique: number
          organisation_id: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean
          code: string
          couleur?: string | null
          cree_le?: string
          description?: string | null
          id?: string
          is_system?: boolean
          libelle: string
          niveau_hierarchique?: number
          organisation_id?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean
          code?: string
          couleur?: string | null
          cree_le?: string
          description?: string | null
          id?: string
          is_system?: boolean
          libelle?: string
          niveau_hierarchique?: number
          organisation_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      seances: {
        Row: {
          affectation_id: string
          cree_le: string
          date: string
          heure_debut: string | null
          heure_fin: string | null
          id: string
          salle: string | null
          tenue: boolean
          titre: string | null
          updated_at: string
        }
        Insert: {
          affectation_id: string
          cree_le?: string
          date: string
          heure_debut?: string | null
          heure_fin?: string | null
          id?: string
          salle?: string | null
          tenue?: boolean
          titre?: string | null
          updated_at?: string
        }
        Update: {
          affectation_id?: string
          cree_le?: string
          date?: string
          heure_debut?: string | null
          heure_fin?: string | null
          id?: string
          salle?: string | null
          tenue?: boolean
          titre?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seances_affectation_id_fkey"
            columns: ["affectation_id"]
            isOneToOne: false
            referencedRelation: "affectations"
            referencedColumns: ["id"]
          },
        ]
      }
      types_evaluation: {
        Row: {
          actif: boolean
          code: string
          couleur: string | null
          cree_le: string
          etablissement_id: string
          id: string
          libelle: string
          ordre: number
          poids_defaut: number
          updated_at: string
        }
        Insert: {
          actif?: boolean
          code: string
          couleur?: string | null
          cree_le?: string
          etablissement_id: string
          id?: string
          libelle: string
          ordre?: number
          poids_defaut?: number
          updated_at?: string
        }
        Update: {
          actif?: boolean
          code?: string
          couleur?: string | null
          cree_le?: string
          etablissement_id?: string
          id?: string
          libelle?: string
          ordre?: number
          poids_defaut?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "types_evaluation_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      utilisateur_etablissements: {
        Row: {
          cree_le: string
          etablissement_id: string
          utilisateur_id: string
        }
        Insert: {
          cree_le?: string
          etablissement_id: string
          utilisateur_id: string
        }
        Update: {
          cree_le?: string
          etablissement_id?: string
          utilisateur_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "utilisateur_etablissements_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utilisateur_etablissements_utilisateur_id_fkey"
            columns: ["utilisateur_id"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      utilisateurs: {
        Row: {
          actif: boolean
          cree_le: string
          dernier_login: string | null
          email: string | null
          etablissement_scope_id: string | null
          id: string
          mot_de_passe_initial_utilise: boolean
          nom: string | null
          organisation_id: string | null
          photo_url: string | null
          pin_hash: string | null
          preferences: Json
          prenom: string | null
          pseudo: string
          role_id: string
          telephone: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean
          cree_le?: string
          dernier_login?: string | null
          email?: string | null
          etablissement_scope_id?: string | null
          id: string
          mot_de_passe_initial_utilise?: boolean
          nom?: string | null
          organisation_id?: string | null
          photo_url?: string | null
          pin_hash?: string | null
          preferences?: Json
          prenom?: string | null
          pseudo: string
          role_id: string
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean
          cree_le?: string
          dernier_login?: string | null
          email?: string | null
          etablissement_scope_id?: string | null
          id?: string
          mot_de_passe_initial_utilise?: boolean
          nom?: string | null
          organisation_id?: string | null
          photo_url?: string | null
          pin_hash?: string | null
          preferences?: Json
          prenom?: string | null
          pseudo?: string
          role_id?: string
          telephone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "utilisateurs_etablissement_scope_id_fkey"
            columns: ["etablissement_scope_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utilisateurs_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utilisateurs_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      cible_annonce:
        | "organisation"
        | "etablissement"
        | "classe"
        | "parents"
        | "profs"
      cycle_scolaire: "prescolaire" | "primaire" | "college" | "lycee"
      frequence_bulletin: "mensuel" | "trimestriel" | "semestriel"
      gravite_incident: "info" | "mineur" | "moyen" | "grave"
      permission_portee:
        | "plateforme"
        | "organisation"
        | "etablissement"
        | "perimetre_personnel"
      sexe_eleve: "M" | "F"
      statut_incident: "signale" | "en_cours" | "traite" | "clos"
      statut_inscription:
        | "inscrit"
        | "reinscrit"
        | "transfere"
        | "abandonne"
        | "exclu"
        | "diplome"
        | "admis"
        | "redouble"
      statut_presence: "present" | "absent" | "retard" | "excuse" | "renvoye"
      type_incident:
        | "sante"
        | "comportement"
        | "securite"
        | "materiel"
        | "academique"
        | "autre"
      type_notification:
        | "annonce"
        | "note_publiee"
        | "bulletin_publie"
        | "observation"
        | "absence"
        | "activite"
        | "message"
        | "systeme"
        | "incident"
      type_observation:
        | "comportement"
        | "academique"
        | "sante"
        | "encouragement"
        | "avertissement"
        | "autre"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cible_annonce: [
        "organisation",
        "etablissement",
        "classe",
        "parents",
        "profs",
      ],
      cycle_scolaire: ["prescolaire", "primaire", "college", "lycee"],
      frequence_bulletin: ["mensuel", "trimestriel", "semestriel"],
      gravite_incident: ["info", "mineur", "moyen", "grave"],
      permission_portee: [
        "plateforme",
        "organisation",
        "etablissement",
        "perimetre_personnel",
      ],
      sexe_eleve: ["M", "F"],
      statut_incident: ["signale", "en_cours", "traite", "clos"],
      statut_inscription: [
        "inscrit",
        "reinscrit",
        "transfere",
        "abandonne",
        "exclu",
        "diplome",
        "admis",
        "redouble",
      ],
      statut_presence: ["present", "absent", "retard", "excuse", "renvoye"],
      type_incident: [
        "sante",
        "comportement",
        "securite",
        "materiel",
        "academique",
        "autre",
      ],
      type_notification: [
        "annonce",
        "note_publiee",
        "bulletin_publie",
        "observation",
        "absence",
        "activite",
        "message",
        "systeme",
        "incident",
      ],
      type_observation: [
        "comportement",
        "academique",
        "sante",
        "encouragement",
        "avertissement",
        "autre",
      ],
    },
  },
} as const
