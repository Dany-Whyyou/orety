import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEtabScope } from "@/lib/auth";

export type PresenceStat = {
  eleve_id: string;
  eleve_nom: string;
  eleve_prenom: string;
  matricule: string;
  classe_id: string;
  classe_nom: string;
  niveau_libelle: string;
  cycle: string;
  total_seances: number;
  present: number;
  absent: number;
  retard: number;
  excuse: number;
  taux_presence: number;
};

export type ClassePresenceSummary = {
  classe_id: string;
  classe_nom: string;
  niveau_libelle: string;
  cycle: string;
  annee_libelle: string;
  annee_active: boolean;
  total_eleves: number;
  total_seances: number;
  total_absences: number;
  total_retards: number;
  taux_presence: number;
};

export async function getPresenceStats(): Promise<{
  summaries: ClassePresenceSummary[];
  topAbsentees: PresenceStat[];
}> {
  const supabase = createAdminClient();

  // Fetch all presences with related data
  const scope = await getEtabScope();
  const presencesBase = supabase
    .from("presences")
    .select(
      `id, statut, eleve_id, seance_id,
       seances!inner(affectation_id, affectations!inner(classe_id, annee_scolaire_id, classes!inner(nom, niveaux!inner(libelle, cycle, etablissement_id)), annees_scolaires(libelle, active))),
       eleves!inner(nom, prenom, matricule, archive_le)`
    )
    .is("eleves.archive_le", null);
  const { data: presences } = await (scope
    ? presencesBase.eq("seances.affectations.classes.niveaux.etablissement_id", scope)
    : presencesBase);

  type PresRow = {
    statut: string;
    eleve_id: string;
    seances: {
      affectation_id: string;
      affectations: {
        classe_id: string;
        annee_scolaire_id: string;
        classes: { nom: string; niveaux: { libelle: string; cycle: string } | { libelle: string; cycle: string }[] | null } | { nom: string; niveaux: { libelle: string; cycle: string } | { libelle: string; cycle: string }[] | null }[] | null;
        annees_scolaires: { libelle: string; active: boolean } | { libelle: string; active: boolean }[] | null;
      } | {
        classe_id: string;
        annee_scolaire_id: string;
        classes: { nom: string; niveaux: { libelle: string; cycle: string } | { libelle: string; cycle: string }[] | null } | { nom: string; niveaux: { libelle: string; cycle: string } | { libelle: string; cycle: string }[] | null }[] | null;
        annees_scolaires: { libelle: string; active: boolean } | { libelle: string; active: boolean }[] | null;
      }[] | null;
    } | {
      affectation_id: string;
      affectations: {
        classe_id: string;
        annee_scolaire_id: string;
        classes: { nom: string; niveaux: { libelle: string; cycle: string } | { libelle: string; cycle: string }[] | null } | { nom: string; niveaux: { libelle: string; cycle: string } | { libelle: string; cycle: string }[] | null }[] | null;
        annees_scolaires: { libelle: string; active: boolean } | { libelle: string; active: boolean }[] | null;
      } | {
        classe_id: string;
        annee_scolaire_id: string;
        classes: { nom: string; niveaux: { libelle: string; cycle: string } | { libelle: string; cycle: string }[] | null } | { nom: string; niveaux: { libelle: string; cycle: string } | { libelle: string; cycle: string }[] | null }[] | null;
        annees_scolaires: { libelle: string; active: boolean } | { libelle: string; active: boolean }[] | null;
      }[] | null;
    }[] | null;
    eleves: { nom: string; prenom: string; matricule: string } | { nom: string; prenom: string; matricule: string }[] | null;
  };

  const byClasse = new Map<string, ClassePresenceSummary>();
  const byEleve = new Map<string, PresenceStat>();

  ((presences ?? []) as PresRow[]).forEach((p) => {
    const seance = Array.isArray(p.seances) ? p.seances[0] : p.seances;
    const aff = seance
      ? Array.isArray(seance.affectations)
        ? seance.affectations[0]
        : seance.affectations
      : null;
    if (!aff) return;
    const classe = Array.isArray(aff.classes) ? aff.classes[0] : aff.classes;
    const niveau = classe
      ? Array.isArray(classe.niveaux)
        ? classe.niveaux[0]
        : classe.niveaux
      : null;
    const annee = Array.isArray(aff.annees_scolaires) ? aff.annees_scolaires[0] : aff.annees_scolaires;
    const eleve = Array.isArray(p.eleves) ? p.eleves[0] : p.eleves;

    // Classe summary
    const cSummary = byClasse.get(aff.classe_id) ?? {
      classe_id: aff.classe_id,
      classe_nom: classe?.nom ?? "?",
      niveau_libelle: niveau?.libelle ?? "?",
      cycle: niveau?.cycle ?? "autre",
      annee_libelle: annee?.libelle ?? "?",
      annee_active: annee?.active ?? false,
      total_eleves: 0,
      total_seances: 0,
      total_absences: 0,
      total_retards: 0,
      taux_presence: 0,
    };
    cSummary.total_seances += 1;
    if (p.statut === "absent") cSummary.total_absences += 1;
    if (p.statut === "retard") cSummary.total_retards += 1;
    byClasse.set(aff.classe_id, cSummary);

    // Eleve stats
    const eSum = byEleve.get(p.eleve_id) ?? {
      eleve_id: p.eleve_id,
      eleve_nom: eleve?.nom ?? "?",
      eleve_prenom: eleve?.prenom ?? "?",
      matricule: eleve?.matricule ?? "",
      classe_id: aff.classe_id,
      classe_nom: classe?.nom ?? "?",
      niveau_libelle: niveau?.libelle ?? "?",
      cycle: niveau?.cycle ?? "autre",
      total_seances: 0,
      present: 0,
      absent: 0,
      retard: 0,
      excuse: 0,
      taux_presence: 0,
    };
    eSum.total_seances += 1;
    if (p.statut === "present") eSum.present += 1;
    else if (p.statut === "absent") eSum.absent += 1;
    else if (p.statut === "retard") eSum.retard += 1;
    else if (p.statut === "excuse") eSum.excuse += 1;
    byEleve.set(p.eleve_id, eSum);
  });

  // Compute taux + total_eleves per classe
  const elevesPerClasse = new Map<string, Set<string>>();
  byEleve.forEach((s) => {
    const set = elevesPerClasse.get(s.classe_id) ?? new Set<string>();
    set.add(s.eleve_id);
    elevesPerClasse.set(s.classe_id, set);
  });

  byClasse.forEach((s) => {
    s.total_eleves = elevesPerClasse.get(s.classe_id)?.size ?? 0;
    s.taux_presence =
      s.total_seances > 0
        ? ((s.total_seances - s.total_absences) / s.total_seances) * 100
        : 0;
  });

  byEleve.forEach((s) => {
    s.taux_presence =
      s.total_seances > 0
        ? ((s.present + s.retard) / s.total_seances) * 100
        : 0;
  });

  const summaries = Array.from(byClasse.values()).sort((a, b) =>
    a.classe_nom.localeCompare(b.classe_nom)
  );
  const topAbsentees = Array.from(byEleve.values())
    .filter((s) => s.absent > 0)
    .sort((a, b) => b.absent - a.absent)
    .slice(0, 10);

  return { summaries, topAbsentees };
}
