/**
 * Statuts d'inscription considérés comme ACTIFS (élève présent dans la classe).
 *
 * `reinscrit` est posé par la clôture d'année sur les pré-inscriptions de
 * l'année suivante : l'oublier vidait toutes les classes à la rentrée
 * (effectifs à 0, aucune saisie de notes, aucun bulletin générable).
 */
export const STATUTS_ACTIFS = ["inscrit", "reinscrit"] as const;
