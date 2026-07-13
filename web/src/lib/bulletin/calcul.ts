/**
 * Cœur de calcul des bulletins — fonctions PURES (aucun accès base).
 *
 * C'est le seul code du projet dont une erreur finit imprimée, signée par la
 * direction, et remise aux parents : il est isolé ici pour être testable.
 */

export type NoteCalcul = {
  evaluation_id: string;
  note: number | null;
  bonus: number;
  absent: boolean;
};

export type EvaluationCalcul = {
  id: string;
  bareme: number;
  poids: number;
};

/**
 * Moyenne d'une matière pour un élève, normalisée sur `baseNote` (20 par défaut).
 * Formule : Σ((note + bonus) / bareme × baseNote × poids) / Σ(poids)
 * Les absences et les notes non saisies sont exclues (elles ne valent pas zéro).
 */
export function moyenneMatiere(
  evaluations: EvaluationCalcul[],
  notes: NoteCalcul[],
  baseNote = 20
): { moyenne: number | null; nbEvaluations: number } {
  let sommePonderee = 0;
  let sommePoids = 0;
  let nb = 0;

  for (const evaluation of evaluations) {
    const note = notes.find((n) => n.evaluation_id === evaluation.id);
    if (!note || note.absent || note.note === null) continue;
    if (evaluation.bareme <= 0) continue; // barème invalide : évaluation ignorée

    const surBase = ((note.note + (note.bonus ?? 0)) / evaluation.bareme) * baseNote;
    sommePonderee += surBase * evaluation.poids;
    sommePoids += evaluation.poids;
    nb += 1;
  }

  return {
    moyenne: sommePoids > 0 ? sommePonderee / sommePoids : null,
    nbEvaluations: nb,
  };
}

/**
 * Moyenne générale : moyenne des matières pondérée par leur coefficient.
 * Un coefficient 0 neutralise la matière (elle ne compte pas).
 */
export function moyenneGenerale(
  matieres: { moyenne: number | null; coefficient: number }[]
): number | null {
  let total = 0;
  let totalCoef = 0;

  for (const m of matieres) {
    if (m.moyenne === null || m.coefficient <= 0) continue;
    total += m.moyenne * m.coefficient;
    totalCoef += m.coefficient;
  }

  return totalCoef > 0 ? total / totalCoef : null;
}

/**
 * Moyenne annuelle d'après la formule configurée (ex. (P1 + P2×2 + P3×2) / 6).
 * Le diviseur validé par la direction fait foi. Si une période n'a pas de note,
 * on retombe sur la somme des poids réellement notés pour ne pas pénaliser l'élève.
 */
export function moyenneAnnuelle(
  moyennesParPeriode: (number | null)[],
  poids: number[],
  diviseur: number
): number | null {
  let somme = 0;
  let sommePoids = 0;
  let toutesNotees = true;

  for (let i = 0; i < poids.length; i++) {
    const p = poids[i] ?? 0;
    if (p === 0) continue;
    const moyenne = moyennesParPeriode[i];
    if (moyenne === null || moyenne === undefined) {
      toutesNotees = false;
      continue;
    }
    somme += moyenne * p;
    sommePoids += p;
  }

  if (sommePoids === 0) return null;
  const d = toutesNotees && diviseur > 0 ? diviseur : sommePoids;
  return d > 0 ? somme / d : null;
}

/**
 * Rangs avec gestion des ex æquo : deux élèves à 15,00 partagent le rang 3,
 * le suivant est 5e (rang « standard competition »).
 */
export function calculerRangs<T extends { id: string; moyenne: number | null }>(
  eleves: T[]
): Map<string, number> {
  const classes = eleves
    .filter((e) => e.moyenne !== null)
    .sort((a, b) => (b.moyenne as number) - (a.moyenne as number));

  const rangs = new Map<string, number>();
  let rangCourant = 0;
  let precedente: number | null = null;

  classes.forEach((eleve, index) => {
    const moyenne = eleve.moyenne as number;
    if (precedente === null || Math.abs(moyenne - precedente) > 1e-9) {
      rangCourant = index + 1;
      precedente = moyenne;
    }
    rangs.set(eleve.id, rangCourant);
  });

  return rangs;
}

/** Moyenne de classe : moyenne des moyennes générales des élèves notés. */
export function moyenneDeClasse(moyennes: (number | null)[]): number | null {
  const valides = moyennes.filter((m): m is number => m !== null);
  if (valides.length === 0) return null;
  return valides.reduce((a, b) => a + b, 0) / valides.length;
}

/**
 * Appréciation automatique. Les seuils sont exprimés en pourcentage de la note
 * maximale : une école notant sur 10 obtient les mêmes paliers qu'une école
 * notant sur 20 (avant, tout le monde était « en difficulté » avec /10).
 */
export function appreciationAuto(moyenne: number | null, baseNote = 20): string {
  if (moyenne === null) return "Pas de note sur cette période.";
  const pct = baseNote > 0 ? (moyenne / baseNote) * 100 : 0;
  if (pct >= 80) return "Excellent travail, résultats remarquables.";
  if (pct >= 70) return "Très bons résultats, continuez ainsi.";
  if (pct >= 60) return "Bon travail, résultats satisfaisants.";
  if (pct >= 50) return "Résultats corrects, des progrès sont possibles.";
  if (pct >= 40) return "Résultats insuffisants, des efforts sont à fournir.";
  return "Période difficile, un soutien est nécessaire.";
}
