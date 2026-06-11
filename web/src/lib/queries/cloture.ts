import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeBulletinsAnnuels } from "@/lib/bulletin/engine";

export type DecisionFinAnnee = "admis" | "redouble" | "diplome" | "exclu" | "transfere" | "abandonne";

export type EleveDecision = {
  inscription_id: string;
  eleve_id: string;
  nom: string;
  prenom: string;
  matricule: string;
  moyenne_annuelle: number | null;
  moyenne_classe: number | null;
  rang: number | null;
  statut: string;
  decision_fin_annee: DecisionFinAnnee | null;
  motif_decision: string | null;
};

export type ClasseCloture = {
  classe_id: string;
  classe_nom: string;
  niveau_id: string;
  niveau_libelle: string;
  niveau_ordre: number;
  cycle: string;
  etablissement_id: string;
  etablissement_nom: string;
  est_terminal: boolean; // CM2, 3ème, Terminale
  effectif: number;
  decisions_saisies: number;
  eleves: EleveDecision[];
};

export type ClotureState = {
  annee_id: string;
  annee_libelle: string;
  annee_date_debut: string;
  annee_date_fin: string;
  est_archivee: boolean;
  bulletins_annuels_generes: number;
  inscriptions_totales: number;
  classes: ClasseCloture[];
  // Stats globales
  nb_admis: number;
  nb_redoublants: number;
  nb_diplomes: number;
  nb_exclus: number;
  nb_transferes: number;
  nb_abandons: number;
  nb_sans_decision: number;
};

/** Niveaux terminaux (qui diplôment) */
const NIVEAUX_TERMINAUX = new Set(["CM2", "3EME", "TERM"]);

export async function getClotureState(anneeId: string): Promise<ClotureState | null> {
  const supabase = createAdminClient();

  const { data: annee } = await supabase
    .from("annees_scolaires")
    .select("id, libelle, date_debut, date_fin, archivee")
    .eq("id", anneeId)
    .single();
  if (!annee) return null;

  const { data: inscriptions, error } = await supabase
    .from("inscriptions")
    .select(
      `id, statut, decision_fin_annee, motif_decision, eleve_id,
       eleves(nom, prenom, matricule),
       classes(id, nom, niveau_id, niveaux(libelle, code, cycle, ordre, etablissement_id, etablissements(nom)))`
    )
    .eq("annee_scolaire_id", anneeId);

  if (error) {
    console.error("getClotureState:", error.message);
    return null;
  }

  // Load all bulletins for those inscriptions pour récupérer la moyenne annuelle
  const inscIds = (inscriptions ?? []).map((i) => i.id);
  const { data: bulletins } = await supabase
    .from("bulletins")
    .select("inscription_id, moyenne_generale, moyenne_classe, rang, est_annuel")
    .in("inscription_id", inscIds.length ? inscIds : ["_none_"])
    .eq("est_annuel", true);
  const bulletinMap = new Map<string, { moyenne: number | null; moyenne_classe: number | null; rang: number | null }>();
  (bulletins ?? []).forEach((b) => {
    bulletinMap.set(b.inscription_id, {
      moyenne: b.moyenne_generale !== null ? Number(b.moyenne_generale) : null,
      moyenne_classe: b.moyenne_classe !== null ? Number(b.moyenne_classe) : null,
      rang: b.rang,
    });
  });

  // Group by classe
  const byClasse = new Map<string, ClasseCloture>();

  (inscriptions ?? []).forEach((i) => {
    const rec = i as {
      id: string;
      statut: string;
      decision_fin_annee: DecisionFinAnnee | null;
      motif_decision: string | null;
      eleve_id: string;
      eleves: { nom: string; prenom: string; matricule: string } | { nom: string; prenom: string; matricule: string }[] | null;
      classes: {
        id: string;
        nom: string;
        niveau_id: string;
        niveaux: {
          libelle: string;
          code: string;
          cycle: string;
          ordre: number;
          etablissement_id: string;
          etablissements: { nom: string } | { nom: string }[] | null;
        } | {
          libelle: string;
          code: string;
          cycle: string;
          ordre: number;
          etablissement_id: string;
          etablissements: { nom: string } | { nom: string }[] | null;
        }[] | null;
      } | {
        id: string;
        nom: string;
        niveau_id: string;
        niveaux: {
          libelle: string;
          code: string;
          cycle: string;
          ordre: number;
          etablissement_id: string;
          etablissements: { nom: string } | { nom: string }[] | null;
        } | {
          libelle: string;
          code: string;
          cycle: string;
          ordre: number;
          etablissement_id: string;
          etablissements: { nom: string } | { nom: string }[] | null;
        }[] | null;
      }[] | null;
    };
    const el = Array.isArray(rec.eleves) ? rec.eleves[0] : rec.eleves;
    const cl = Array.isArray(rec.classes) ? rec.classes[0] : rec.classes;
    if (!cl) return;
    const niv = Array.isArray(cl.niveaux) ? cl.niveaux[0] : cl.niveaux;
    const etab = niv
      ? Array.isArray(niv.etablissements)
        ? niv.etablissements[0]
        : niv.etablissements
      : null;

    const b = bulletinMap.get(rec.id);

    const classe = byClasse.get(cl.id) ?? {
      classe_id: cl.id,
      classe_nom: cl.nom,
      niveau_id: cl.niveau_id,
      niveau_libelle: niv?.libelle ?? "?",
      niveau_ordre: niv?.ordre ?? 0,
      cycle: niv?.cycle ?? "autre",
      etablissement_id: niv?.etablissement_id ?? "",
      etablissement_nom: etab?.nom ?? "?",
      est_terminal: niv?.code ? NIVEAUX_TERMINAUX.has(niv.code) : false,
      effectif: 0,
      decisions_saisies: 0,
      eleves: [],
    };

    classe.effectif += 1;
    if (rec.decision_fin_annee) classe.decisions_saisies += 1;

    classe.eleves.push({
      inscription_id: rec.id,
      eleve_id: rec.eleve_id,
      nom: el?.nom ?? "?",
      prenom: el?.prenom ?? "?",
      matricule: el?.matricule ?? "",
      moyenne_annuelle: b?.moyenne ?? null,
      moyenne_classe: b?.moyenne_classe ?? null,
      rang: b?.rang ?? null,
      statut: rec.statut,
      decision_fin_annee: rec.decision_fin_annee,
      motif_decision: rec.motif_decision,
    });

    byClasse.set(cl.id, classe);
  });

  // Sort
  byClasse.forEach((c) => {
    c.eleves.sort((a, b) => {
      if (a.rang !== null && b.rang !== null) return a.rang - b.rang;
      return a.nom.localeCompare(b.nom);
    });
  });

  const classes = Array.from(byClasse.values()).sort((a, b) => a.niveau_ordre - b.niveau_ordre);

  // Stats globales
  let nb_admis = 0, nb_redoublants = 0, nb_diplomes = 0, nb_exclus = 0, nb_transferes = 0, nb_abandons = 0, nb_sans_decision = 0;
  classes.forEach((c) => {
    c.eleves.forEach((e) => {
      switch (e.decision_fin_annee) {
        case "admis": nb_admis += 1; break;
        case "redouble": nb_redoublants += 1; break;
        case "diplome": nb_diplomes += 1; break;
        case "exclu": nb_exclus += 1; break;
        case "transfere": nb_transferes += 1; break;
        case "abandonne": nb_abandons += 1; break;
        default: nb_sans_decision += 1;
      }
    });
  });

  return {
    annee_id: annee.id,
    annee_libelle: annee.libelle,
    annee_date_debut: annee.date_debut,
    annee_date_fin: annee.date_fin,
    est_archivee: annee.archivee,
    bulletins_annuels_generes: bulletinMap.size,
    inscriptions_totales: (inscriptions ?? []).length,
    classes,
    nb_admis,
    nb_redoublants,
    nb_diplomes,
    nb_exclus,
    nb_transferes,
    nb_abandons,
    nb_sans_decision,
  };
}

/** Année suivante : meilleur candidat pour la pré-inscription */
export async function getProchaineAnnee(anneeId: string): Promise<{ id: string; libelle: string } | null> {
  const supabase = createAdminClient();
  const { data: current } = await supabase
    .from("annees_scolaires")
    .select("date_debut, organisation_id")
    .eq("id", anneeId)
    .single();
  if (!current) return null;

  const { data: next } = await supabase
    .from("annees_scolaires")
    .select("id, libelle, date_debut")
    .eq("organisation_id", current.organisation_id)
    .gt("date_debut", current.date_debut)
    .order("date_debut", { ascending: true })
    .limit(1)
    .maybeSingle();

  return next ? { id: next.id, libelle: next.libelle } : null;
}

// Re-export pour usage dans actions
export { computeBulletinsAnnuels };
