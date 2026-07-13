import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  calculerRangs,
  moyenneAnnuelle as calcMoyenneAnnuelle,
  moyenneDeClasse,
  moyenneGenerale as calcMoyenneGenerale,
  moyenneMatiere as calcMoyenneMatiere,
} from "./calcul";

/**
 * Moteur de calcul de bulletin.
 *
 * - Pour chaque évaluation d'une matière × période : `(note + bonus) / bareme * 20`.
 * - Moyenne de matière = somme pondérée des notes normalisées sur 20, divisée par somme des poids des évaluations.
 * - Moyenne générale = somme(moyenne_matiere × coefficient) / somme(coefficients).
 * - Rang : classement par moyenne générale dans la classe.
 * - Bulletin annuel : applique la formule configurée sur les moyennes des périodes précédentes.
 */

export type BulletinMatiereCompute = {
  matiere_id: string;
  matiere_nom: string;
  matiere_code: string;
  coefficient: number;
  moyenne: number | null;
  moyenne_classe: number | null;
  rang: number | null;
  prof_utilisateur_id: string | null;
  nb_evaluations: number;
};

export type BulletinCompute = {
  inscription_id: string;
  eleve_id: string;
  eleve_nom: string;
  eleve_prenom: string;
  matricule: string;
  classe_id: string;
  classe_nom: string;
  niveau_id: string;
  niveau_libelle: string;
  etablissement_id: string;
  matieres: BulletinMatiereCompute[];
  moyenne_generale: number | null;
  moyenne_classe: number | null;
  rang: number | null;
  effectif_classe: number;
};

type EvaluationRaw = {
  id: string;
  bareme: number;
  poids: number;
  affectation_id: string;
  periode_id: string;
  matiere_id: string | null;
  utilisateur_id: string;
  classe_id: string;
};

type NoteRaw = {
  evaluation_id: string;
  eleve_id: string;
  note: number | null;
  bonus: number;
  absent: boolean;
};

export async function computeBulletinsPourPeriode(
  classe_id: string,
  periode_id: string,
  noteMaximale?: number
): Promise<BulletinCompute[]> {
  const supabase = createAdminClient();
  // Barème de restitution des bulletins (config de l'établissement, /20 par défaut)
  const baseNote = noteMaximale && noteMaximale > 0 ? noteMaximale : 20;

  // 1) Inscriptions inscrits dans la classe
  const { data: inscriptions } = await supabase
    .from("inscriptions")
    .select("id, eleve_id, eleves!inner(nom, prenom, matricule, archive_le)")
    .eq("classe_id", classe_id)
    .eq("statut", "inscrit")
    .is("eleves.archive_le", null);

  if (!inscriptions || inscriptions.length === 0) return [];

  // 2) Classe context
  const { data: classe } = await supabase
    .from("classes")
    .select("id, nom, niveau_id, annee_scolaire_id, niveaux(libelle, etablissement_id)")
    .eq("id", classe_id)
    .single();
  if (!classe) return [];

  const niveau = Array.isArray(classe.niveaux) ? classe.niveaux[0] : classe.niveaux;
  const etablissement_id = (niveau as { etablissement_id: string } | null)?.etablissement_id ?? "";

  // 3) Affectations de la classe (prof × matière)
  const { data: affectations } = await supabase
    .from("affectations")
    .select("id, utilisateur_id, matiere_id, classe_id, matieres!inner(id, nom, code, archive_le)")
    .eq("classe_id", classe_id)
    .eq("annee_scolaire_id", classe.annee_scolaire_id)
    .is("matieres.archive_le", null);

  // 4) Matières enseignées dans la classe (via affectations)
  const matieresMap = new Map<string, { id: string; nom: string; code: string; prof_utilisateur_id: string | null }>();
  (affectations ?? []).forEach((a: {
    id: string;
    utilisateur_id: string;
    matiere_id: string | null;
    classe_id: string;
    matieres: { id: string; nom: string; code: string } | { id: string; nom: string; code: string }[] | null;
  }) => {
    if (!a.matiere_id) return;
    const m = Array.isArray(a.matieres) ? a.matieres[0] : a.matieres;
    if (m && !matieresMap.has(m.id)) {
      matieresMap.set(m.id, {
        id: m.id,
        nom: m.nom,
        code: m.code,
        prof_utilisateur_id: a.utilisateur_id,
      });
    }
  });

  // 5) Coefficients matière × niveau
  const { data: coefs } = await supabase
    .from("coefficients_matiere")
    .select("matiere_id, coefficient")
    .eq("niveau_id", classe.niveau_id);
  const coefMap = new Map<string, number>();
  (coefs ?? []).forEach((c) => coefMap.set(c.matiere_id, Number(c.coefficient)));

  // 6) Évaluations de la période pour la classe
  const affIds = (affectations ?? []).map((a) => a.id);
  if (affIds.length === 0) {
    // No affectations = no evaluations possible
    return (inscriptions ?? []).map((i: { id: string; eleve_id: string; eleves: { nom: string; prenom: string; matricule: string } | { nom: string; prenom: string; matricule: string }[] | null }) => {
      const el = Array.isArray(i.eleves) ? i.eleves[0] : i.eleves;
      return {
        inscription_id: i.id,
        eleve_id: i.eleve_id,
        eleve_nom: el?.nom ?? "?",
        eleve_prenom: el?.prenom ?? "?",
        matricule: el?.matricule ?? "",
        classe_id,
        classe_nom: classe.nom,
        niveau_id: classe.niveau_id,
        niveau_libelle: (niveau as { libelle: string } | null)?.libelle ?? "?",
        etablissement_id,
        matieres: [],
        moyenne_generale: null,
        moyenne_classe: null,
        rang: null,
        effectif_classe: inscriptions.length,
      };
    });
  }

  const { data: evalsRaw } = await supabase
    .from("evaluations")
    .select("id, bareme, poids, affectation_id, periode_id, affectations(utilisateur_id, classe_id, matiere_id)")
    .in("affectation_id", affIds)
    .eq("periode_id", periode_id)
    .is("archive_le", null);

  const evaluations: EvaluationRaw[] = (evalsRaw ?? []).map((e) => {
    const aff = Array.isArray(e.affectations) ? e.affectations[0] : e.affectations;
    return {
      id: e.id,
      bareme: Number(e.bareme),
      poids: Number(e.poids),
      affectation_id: e.affectation_id,
      periode_id: e.periode_id,
      matiere_id: (aff as { matiere_id: string | null } | null)?.matiere_id ?? null,
      utilisateur_id: (aff as { utilisateur_id: string } | null)?.utilisateur_id ?? "",
      classe_id: (aff as { classe_id: string } | null)?.classe_id ?? "",
    };
  });

  // 7) Notes pour ces évaluations
  const evalIds = evaluations.map((e) => e.id);
  const { data: notesRaw } = await supabase
    .from("notes")
    .select("evaluation_id, eleve_id, note, bonus, absent")
    .in("evaluation_id", evalIds.length ? evalIds : ["_none_"]);
  const notes: NoteRaw[] = (notesRaw ?? []).map((n) => ({
    evaluation_id: n.evaluation_id,
    eleve_id: n.eleve_id,
    note: n.note !== null ? Number(n.note) : null,
    bonus: Number(n.bonus ?? 0),
    absent: n.absent,
  }));

  // 8) Pour chaque élève, calculer moyennes par matière
  const elevesComputed: BulletinCompute[] = [];
  for (const insc of inscriptions) {
    const el = Array.isArray(insc.eleves) ? insc.eleves[0] : insc.eleves;
    const matieresOut: BulletinMatiereCompute[] = [];

    for (const [matiereId, mat] of matieresMap.entries()) {
      // Coefficient absent = 1 par défaut ; coefficient 0 explicite = matière neutralisée
      const coef = coefMap.get(matiereId) ?? 1;
      const evalsMatiere = evaluations.filter((e) => e.matiere_id === matiereId);

      const { moyenne, nbEvaluations: nbContributed } = calcMoyenneMatiere(
        evalsMatiere.map((e) => ({ id: e.id, bareme: e.bareme, poids: e.poids })),
        notes
          .filter((x) => x.eleve_id === insc.eleve_id)
          .map((x) => ({
            evaluation_id: x.evaluation_id,
            note: x.note,
            bonus: x.bonus,
            absent: x.absent,
          })),
        baseNote
      );

      matieresOut.push({
        matiere_id: mat.id,
        matiere_nom: mat.nom,
        matiere_code: mat.code,
        coefficient: coef,
        moyenne,
        moyenne_classe: null, // rempli au second pass
        rang: null,
        prof_utilisateur_id: mat.prof_utilisateur_id,
        nb_evaluations: nbContributed,
      });
    }

    // 9) Moyenne générale pondérée par coefficients (coef 0 = matière neutralisée)
    const moyenneGenerale = calcMoyenneGenerale(matieresOut);

    elevesComputed.push({
      inscription_id: insc.id,
      eleve_id: insc.eleve_id,
      eleve_nom: el?.nom ?? "?",
      eleve_prenom: el?.prenom ?? "?",
      matricule: el?.matricule ?? "",
      classe_id,
      classe_nom: classe.nom,
      niveau_id: classe.niveau_id,
      niveau_libelle: (niveau as { libelle: string } | null)?.libelle ?? "?",
      etablissement_id,
      matieres: matieresOut,
      moyenne_generale: moyenneGenerale,
      moyenne_classe: null,
      rang: null,
      effectif_classe: inscriptions.length,
    });
  }

  // 10) Calcul moyenne classe + rang par matière
  for (const [matiereId] of matieresMap.entries()) {
    const valeurs = elevesComputed
      .map((e) => e.matieres.find((m) => m.matiere_id === matiereId)?.moyenne)
      .filter((v): v is number => v !== null && v !== undefined);
    const moyClasse = moyenneDeClasse(valeurs);

    // Rangs par matière (ex æquo gérés : deux 3e, puis un 5e)
    const rangs = calculerRangs(
      elevesComputed.map((e) => ({
        id: e.inscription_id,
        moyenne: e.matieres.find((m) => m.matiere_id === matiereId)?.moyenne ?? null,
      }))
    );

    for (const e of elevesComputed) {
      const m = e.matieres.find((x) => x.matiere_id === matiereId);
      if (m) {
        m.moyenne_classe = moyClasse;
        m.rang = rangs.get(e.inscription_id) ?? null;
      }
    }
  }

  // 11) Moyenne de classe générale + rangs généraux (ex æquo gérés)
  const moyGenClasse = moyenneDeClasse(elevesComputed.map((e) => e.moyenne_generale));
  const rangsGen = calculerRangs(
    elevesComputed.map((e) => ({ id: e.inscription_id, moyenne: e.moyenne_generale }))
  );

  for (const e of elevesComputed) {
    e.moyenne_classe = moyGenClasse;
    e.rang = rangsGen.get(e.inscription_id) ?? null;
  }

  return elevesComputed;
}

/**
 * Calcul de la moyenne annuelle selon la formule configurée.
 * formule_annuelle_json: { poids: [1, 2, 2], diviseur: 5 }
 * → moyenne_annuelle = (M1×1 + M2×2 + M3×2) / 5
 */
export async function computeBulletinsAnnuels(
  classe_id: string,
  annee_scolaire_id: string,
  etablissement_id: string
): Promise<BulletinCompute[]> {
  const supabase = createAdminClient();

  // Fetch config bulletin + periodes
  const { data: cfg } = await supabase
    .from("config_bulletins")
    .select("id, formule_annuelle_json, note_maximale, periodes_scolaires(id, numero)")
    .eq("etablissement_id", etablissement_id)
    .eq("annee_scolaire_id", annee_scolaire_id)
    .is("archive_le", null)
    .single();

  if (!cfg) throw new Error("Configuration de bulletin non trouvée pour cet établissement/année");

  const formule = cfg.formule_annuelle_json as { poids?: number[]; diviseur?: number } | null;
  const poids = formule?.poids ?? [];
  const diviseur = formule?.diviseur ?? poids.reduce((a, b) => a + b, 0);
  if (diviseur <= 0) throw new Error("Formule annuelle invalide : diviseur nul");

  const periodes = ((cfg.periodes_scolaires ?? []) as Array<{ id: string; numero: number }>).sort(
    (a, b) => a.numero - b.numero
  );
  if (periodes.length === 0) throw new Error("Aucune période configurée");

  // Pour chaque période, calculer les bulletins (avec la note maximale configurée)
  const noteMaximale = (cfg as { note_maximale?: number | null }).note_maximale ?? 20;
  const byPeriode: BulletinCompute[][] = [];
  for (const p of periodes) {
    byPeriode.push(await computeBulletinsPourPeriode(classe_id, p.id, noteMaximale));
  }

  const first = byPeriode[0];
  if (!first || first.length === 0) return [];

  // Agréger : un annual bulletin par élève
  const annual: BulletinCompute[] = first.map((e) => ({
    ...e,
    matieres: e.matieres.map((m) => ({
      ...m,
      moyenne: null,
      moyenne_classe: null,
      rang: null,
      nb_evaluations: 0,
    })),
    moyenne_generale: null,
    moyenne_classe: null,
    rang: null,
  }));

  // Pour chaque matière, chaque élève : moyenne pondérée sur les périodes
  for (const eleve of annual) {
    for (const mat of eleve.matieres) {
      const moyennesPeriodes = byPeriode.map((bp) => {
        const entryEleve = bp.find((x) => x.inscription_id === eleve.inscription_id);
        const entryMat = entryEleve?.matieres.find((m) => m.matiere_id === mat.matiere_id);
        return entryMat?.moyenne ?? null;
      });
      mat.moyenne = calcMoyenneAnnuelle(moyennesPeriodes, poids, diviseur);
      mat.nb_evaluations = byPeriode.reduce((acc, bp) => {
        const entryEleve = bp.find((x) => x.inscription_id === eleve.inscription_id);
        const entryMat = entryEleve?.matieres.find((m) => m.matiere_id === mat.matiere_id);
        return acc + (entryMat?.nb_evaluations ?? 0);
      }, 0);
    }

    eleve.moyenne_generale = calcMoyenneGenerale(eleve.matieres);
  }

  // Rangs annuels (ex æquo gérés)
  const moyClasseAnnuel = moyenneDeClasse(annual.map((e) => e.moyenne_generale));
  const rangsAnnuels = calculerRangs(
    annual.map((e) => ({ id: e.inscription_id, moyenne: e.moyenne_generale }))
  );
  for (const e of annual) {
    e.moyenne_classe = moyClasseAnnuel;
    e.rang = rangsAnnuels.get(e.inscription_id) ?? null;
    // Moyenne de classe et rang par matière
    for (const mat of e.matieres) {
      const valeurs = annual
        .map((x) => x.matieres.find((m) => m.matiere_id === mat.matiere_id)?.moyenne ?? null)
        .filter((v): v is number => v !== null);
      mat.moyenne_classe = moyenneDeClasse(valeurs);
      const rangsMat = calculerRangs(
        annual.map((x) => ({
          id: x.inscription_id,
          moyenne: x.matieres.find((m) => m.matiere_id === mat.matiere_id)?.moyenne ?? null,
        }))
      );
      mat.rang = rangsMat.get(e.inscription_id) ?? null;
    }
  }

  return annual;
}

/**
 * Auto-generate appreciation from a score.
 */
export function generateAppreciation(moyenne: number | null): string {
  if (moyenne === null) return "Pas de note ce trimestre.";
  if (moyenne >= 16) return "Excellent travail, résultats remarquables.";
  if (moyenne >= 14) return "Très bon trimestre, continuez ainsi.";
  if (moyenne >= 12) return "Bon travail, résultats satisfaisants.";
  if (moyenne >= 10) return "Résultats corrects, des progrès possibles.";
  if (moyenne >= 8) return "Résultats insuffisants, efforts à fournir.";
  return "Trimestre difficile, un soutien est nécessaire.";
}
