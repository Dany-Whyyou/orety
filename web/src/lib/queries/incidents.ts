import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type IncidentType = "sante" | "comportement" | "securite" | "materiel" | "academique" | "autre";
export type IncidentGravite = "info" | "mineur" | "moyen" | "grave";
export type IncidentStatut = "signale" | "en_cours" | "traite" | "clos";

export type IncidentItem = {
  id: string;
  type: IncidentType;
  gravite: IncidentGravite;
  statut: IncidentStatut;
  titre: string;
  description: string;
  date_incident: string;
  lieu: string | null;
  photos: string[];
  action_prise: string | null;
  notifie_parent: boolean;
  notifie_le: string | null;
  cree_le: string;
  // relations
  eleve_id: string;
  eleve_nom: string;
  eleve_prenom: string;
  matricule: string;
  eleve_cle_parentale: string;
  etablissement_id: string;
  etablissement_nom: string;
  auteur_pseudo: string | null;
  auteur_nom: string | null;
  auteur_role: string | null;
};

export async function getIncidents(): Promise<IncidentItem[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("incidents")
    .select(
      `id, type, gravite, statut, titre, description, date_incident, lieu, photos,
       action_prise, notifie_parent, notifie_le, cree_le,
       eleve_id, etablissement_id,
       eleves(nom, prenom, matricule, cle_parentale),
       etablissements(nom),
       auteur:auteur_id(pseudo, nom, prenom, roles(code))`
    )
    .order("date_incident", { ascending: false });

  if (error) {
    console.error("getIncidents:", error.message, error.code, error.details);
    return [];
  }

  return (data ?? []).map((i) => {
    const rec = i as {
      id: string;
      type: IncidentType;
      gravite: IncidentGravite;
      statut: IncidentStatut;
      titre: string;
      description: string;
      date_incident: string;
      lieu: string | null;
      photos: string[] | null;
      action_prise: string | null;
      notifie_parent: boolean;
      notifie_le: string | null;
      cree_le: string;
      eleve_id: string;
      etablissement_id: string;
      eleves: { nom: string; prenom: string; matricule: string; cle_parentale: string } | { nom: string; prenom: string; matricule: string; cle_parentale: string }[] | null;
      etablissements: { nom: string } | { nom: string }[] | null;
      auteur: { pseudo: string; nom: string | null; prenom: string | null; roles: { code: string } | { code: string }[] | null } | { pseudo: string; nom: string | null; prenom: string | null; roles: { code: string } | { code: string }[] | null }[] | null;
    };
    const eleve = Array.isArray(rec.eleves) ? rec.eleves[0] : rec.eleves;
    const etab = Array.isArray(rec.etablissements) ? rec.etablissements[0] : rec.etablissements;
    const auteur = Array.isArray(rec.auteur) ? rec.auteur[0] : rec.auteur;
    const role = auteur ? (Array.isArray(auteur.roles) ? auteur.roles[0] : auteur.roles) : null;

    return {
      id: rec.id,
      type: rec.type,
      gravite: rec.gravite,
      statut: rec.statut,
      titre: rec.titre,
      description: rec.description,
      date_incident: rec.date_incident,
      lieu: rec.lieu,
      photos: (rec.photos ?? []) as string[],
      action_prise: rec.action_prise,
      notifie_parent: rec.notifie_parent,
      notifie_le: rec.notifie_le,
      cree_le: rec.cree_le,
      eleve_id: rec.eleve_id,
      eleve_nom: eleve?.nom ?? "?",
      eleve_prenom: eleve?.prenom ?? "?",
      matricule: eleve?.matricule ?? "",
      eleve_cle_parentale: eleve?.cle_parentale ?? "",
      etablissement_id: rec.etablissement_id,
      etablissement_nom: etab?.nom ?? "?",
      auteur_pseudo: auteur?.pseudo ?? null,
      auteur_nom: auteur
        ? `${auteur.prenom ?? ""} ${auteur.nom ?? ""}`.trim() || null
        : null,
      auteur_role: role?.code ?? null,
    };
  });
}

export async function getIncidentFormData() {
  const supabase = createAdminClient();
  const { data: eleves } = await supabase
    .from("eleves")
    .select("id, nom, prenom, matricule, etablissement_id, etablissements(nom)")
    .eq("actif", true)
    .order("nom");

  return {
    eleves: (eleves ?? []).map((e) => {
      const rec = e as {
        id: string;
        nom: string;
        prenom: string;
        matricule: string;
        etablissement_id: string;
        etablissements: { nom: string } | { nom: string }[] | null;
      };
      const etab = Array.isArray(rec.etablissements) ? rec.etablissements[0] : rec.etablissements;
      return {
        id: rec.id,
        nom: rec.nom,
        prenom: rec.prenom,
        matricule: rec.matricule,
        etablissement_id: rec.etablissement_id,
        etablissement_nom: etab?.nom ?? "?",
      };
    }),
  };
}
