import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

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
  periode_id: string
): Promise<BulletinCompute[]> {
  const supabase = createAdminClient();

  // 1) Inscriptions inscrits dans la classe
  const { data: inscriptions } = await supabase
    .from("inscriptions")
    .select("id, eleve_id, eleves(nom, prenom, matricule)")
    .eq("classe_id", classe_id)
    .eq("statut", "inscrit");

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
    .select("id, utilisateur_id, matiere_id, classe_id, matieres(id, nom, code)")
    .eq("classe_id", classe_id)
    .eq("annee_scolaire_id", classe.annee_scolaire_id);

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
    .eq("periode_id", periode_id);

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
      const coef = coefMap.get(matiereId) ?? 1;
      const evalsMatiere = evaluations.filter((e) => e.matiere_id === matiereId);

      let sum = 0;
      let sumPoids = 0;
      let nbContributed = 0;
      for (const ev of evalsMatiere) {
        const n = notes.find((x) => x.evaluation_id === ev.id && x.eleve_id === insc.eleve_id);
        if (!n || n.absent || n.note === null) continue;
        const surVingt = ((n.note + (n.bonus ?? 0)) / ev.bareme) * 20;
        sum += surVingt * ev.poids;
        sumPoids += ev.poids;
        nbContributed += 1;
      }

      const moyenne = sumPoids > 0 ? sum / sumPoids : null;

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

    // 9) Moyenne générale pondérée par coefficients
    let totalMoy = 0;
    let totalCoef = 0;
    matieresOut.forEach((m) => {
      if (m.moyenne !== null) {
        totalMoy += m.moyenne * m.coefficient;
        totalCoef += m.coefficient;
      }
    });
    const moyenneGenerale = totalCoef > 0 ? totalMoy / totalCoef : null;

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
    const moyClasse =
      valeurs.length > 0 ? valeurs.reduce((a, b) => a + b, 0) / valeurs.length : null;

    // Rangs par matière
    const sorted = elevesComputed
      .map((e) => ({ id: e.inscription_id, val: e.matieres.find((m) => m.matiere_id === matiereId)?.moyenne ?? null }))
      .filter((x) => x.val !== null)
      .sort((a, b) => (b.val as number) - (a.val as number));

    for (const e of elevesComputed) {
      const m = e.matieres.find((x) => x.matiere_id === matiereId);
      if (m) {
        m.moyenne_classe = moyClasse;
        const idx = sorted.findIndex((s) => s.id === e.inscription_id);
        m.rang = idx >= 0 ? idx + 1 : null;
      }
    }
  }

  // 11) Moyenne de classe générale + rangs généraux
  const allGen = elevesComputed
    .map((e) => e.moyenne_generale)
    .filter((v): v is number => v !== null);
  const moyGenClasse = allGen.length > 0 ? allGen.reduce((a, b) => a + b, 0) / allGen.length : null;
  const sortedGen = elevesComputed
    .map((e) => ({ id: e.inscription_id, val: e.moyenne_generale }))
    .filter((x) => x.val !== null)
    .sort((a, b) => (b.val as number) - (a.val as number));

  for (const e of elevesComputed) {
    e.moyenne_classe = moyGenClasse;
    const idx = sortedGen.findIndex((s) => s.id === e.inscription_id);
    e.rang = idx >= 0 ? idx + 1 : null;
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
    .select("id, formule_annuelle_json, periodes_scolaires(id, numero)")
    .eq("etablissement_id", etablissement_id)
    .eq("annee_scolaire_id", annee_scolaire_id)
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

  // Pour chaque période, calculer les bulletins
  const byPeriode: BulletinCompute[][] = [];
  for (const p of periodes) {
    byPeriode.push(await computeBulletinsPourPeriode(classe_id, p.id));
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
      let sum = 0;
      let sumPoids = 0;
      for (let i = 0; i < byPeriode.length; i++) {
        const p = poids[i] ?? 0;
        if (p === 0) continue;
        const entryEleve = byPeriode[i].find((x) => x.inscription_id === eleve.inscription_id);
        const entryMat = entryEleve?.matieres.find((m) => m.matiere_id === mat.matiere_id);
        if (entryMat?.moyenne !== null && entryMat?.moyenne !== undefined) {
          sum += entryMat.moyenne * p;
          sumPoids += p;
        }
      }
      mat.moyenne = sumPoids > 0 ? sum / sumPoids : null;
      mat.nb_evaluations = byPeriode.reduce((acc, bp) => {
        const entryEleve = bp.find((x) => x.inscription_id === eleve.inscription_id);
        const entryMat = entryEleve?.matieres.find((m) => m.matiere_id === mat.matiere_id);
        return acc + (entryMat?.nb_evaluations ?? 0);
      }, 0);
    }

    let totalMoy = 0;
    let totalCoef = 0;
    eleve.matieres.forEach((m) => {
      if (m.moyenne !== null) {
        totalMoy += m.moyenne * m.coefficient;
        totalCoef += m.coefficient;
      }
    });
    eleve.moyenne_generale = totalCoef > 0 ? totalMoy / totalCoef : null;
  }

  // Rangs annuels
  const sorted = annual
    .map((e) => ({ id: e.inscription_id, val: e.moyenne_generale }))
    .filter((x) => x.val !== null)
    .sort((a, b) => (b.val as number) - (a.val as number));

  const allGen = annual.map((e) => e.moyenne_generale).filter((v): v is number => v !== null);
  const moyClasse = allGen.length > 0 ? allGen.reduce((a, b) => a + b, 0) / allGen.length : null;

  for (const e of annual) {
    e.moyenne_classe = moyClasse;
    const idx = sorted.findIndex((s) => s.id === e.inscription_id);
    e.rang = idx >= 0 ? idx + 1 : null;
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
