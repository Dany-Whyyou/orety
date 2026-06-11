import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type RapportAnnuel = {
  annee_id: string;
  annee_libelle: string;
  date_debut: string;
  date_fin: string;
  etablissement_id: string | null;
  etablissement_nom: string | null;
  organisation_nom: string;

  effectif: number;
  nb_admis: number;
  nb_redoublants: number;
  nb_diplomes: number;
  nb_exclus: number;
  nb_transferes: number;
  nb_abandons: number;
  moyenne_generale: number | null;
  taux_reussite: number | null;

  repartition_cycle: { cycle: string; count: number }[];
  classes: {
    classe_nom: string;
    niveau_libelle: string;
    cycle: string;
    effectif: number;
    moyenne: number | null;
    nb_admis: number;
    nb_redoublants: number;
  }[];
  top_eleves: {
    eleve_id: string;
    nom: string;
    prenom: string;
    matricule: string;
    classe_nom: string;
    moyenne: number;
    rang: number | null;
  }[];
  evolution_trimestrielle: { periode: string; moyenne: number | null }[];
  incidents_par_type: { type: string; count: number }[];
  incidents_par_gravite: { gravite: string; count: number }[];
  activite_profs: {
    prof_nom: string;
    nb_evaluations: number;
    moyenne_notes: number | null;
    nb_classes: number;
  }[];
};

export async function getAnneesDisponibles(): Promise<{ id: string; libelle: string; active: boolean; archivee: boolean }[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("annees_scolaires")
    .select("id, libelle, active, archivee")
    .order("date_debut", { ascending: false });
  return data ?? [];
}

export async function getEtablissementsDispo(): Promise<{ id: string; nom: string }[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("etablissements")
    .select("id, nom")
    .order("nom");
  return data ?? [];
}

export async function getRapportAnnuel(
  annee_id: string,
  etablissement_id: string | null = null
): Promise<RapportAnnuel | null> {
  const supabase = createAdminClient();

  const { data: annee } = await supabase
    .from("annees_scolaires")
    .select("id, libelle, date_debut, date_fin, organisation_id")
    .eq("id", annee_id)
    .single();
  if (!annee) return null;

  const { data: org } = await supabase
    .from("organisations")
    .select("nom")
    .eq("id", annee.organisation_id)
    .single();

  let etablissementNom: string | null = null;
  if (etablissement_id) {
    const { data: e } = await supabase
      .from("etablissements")
      .select("nom")
      .eq("id", etablissement_id)
      .single();
    etablissementNom = e?.nom ?? null;
  }

  // Inscriptions de l'année (filtrées par établissement si précisé)
  let inscQuery = supabase
    .from("inscriptions")
    .select(
      `id, statut, decision_fin_annee, eleve_id,
       eleves(nom, prenom, matricule, etablissement_id, etablissements(nom, cycle_principal)),
       classes(nom, niveau_id, niveaux(libelle, cycle, etablissement_id))`
    )
    .eq("annee_scolaire_id", annee_id);

  const { data: inscriptions } = await inscQuery;

  type InscRow = {
    id: string;
    statut: string;
    decision_fin_annee: string | null;
    eleve_id: string;
    eleves: {
      nom: string;
      prenom: string;
      matricule: string;
      etablissement_id: string;
      etablissements: { nom: string; cycle_principal: string } | { nom: string; cycle_principal: string }[] | null;
    } | null;
    classes: {
      nom: string;
      niveau_id: string;
      niveaux: { libelle: string; cycle: string; etablissement_id: string } | { libelle: string; cycle: string; etablissement_id: string }[] | null;
    } | null;
  };
  const filteredInsc = ((inscriptions ?? []) as unknown as InscRow[]).filter((i) => {
    if (!etablissement_id) return true;
    const eleveObj = Array.isArray(i.eleves) ? (i.eleves as InscRow["eleves"][])[0] : (i.eleves as InscRow["eleves"]);
    return eleveObj?.etablissement_id === etablissement_id;
  });

  const nbAdmis = filteredInsc.filter((i) => i.decision_fin_annee === "admis").length;
  const nbRedoublants = filteredInsc.filter((i) => i.decision_fin_annee === "redouble").length;
  const nbDiplomes = filteredInsc.filter((i) => i.decision_fin_annee === "diplome").length;
  const nbExclus = filteredInsc.filter((i) => i.decision_fin_annee === "exclu").length;
  const nbTransferes = filteredInsc.filter((i) => i.decision_fin_annee === "transfere").length;
  const nbAbandons = filteredInsc.filter((i) => i.decision_fin_annee === "abandonne").length;

  // Bulletins annuels -> moyenne générale
  const inscIds = filteredInsc.map((i) => i.id);
  const { data: bulletins } = await supabase
    .from("bulletins")
    .select("inscription_id, moyenne_generale, rang")
    .in("inscription_id", inscIds.length ? inscIds : ["_none_"])
    .eq("est_annuel", true);
  const bulletinMap = new Map(
    (bulletins ?? []).map((b) => [b.inscription_id, { moy: Number(b.moyenne_generale), rang: b.rang }])
  );

  const moyennes = Array.from(bulletinMap.values()).map((x) => x.moy).filter((x) => !Number.isNaN(x));
  const moyenneGen = moyennes.length > 0 ? moyennes.reduce((a, b) => a + b, 0) / moyennes.length : null;
  const totalSortants = nbAdmis + nbRedoublants + nbDiplomes;
  const tauxReussite =
    totalSortants > 0 ? ((nbAdmis + nbDiplomes) / totalSortants) * 100 : null;

  // Cycle repartition
  const cycleMap = new Map<string, number>();
  filteredInsc.forEach((i) => {
    const classeObj = Array.isArray(i.classes) ? (i.classes as InscRow["classes"][])[0] : (i.classes as InscRow["classes"]);
    const niveauObj = classeObj ? (Array.isArray(classeObj.niveaux) ? (classeObj.niveaux as { cycle: string }[])[0] : classeObj.niveaux) : null;
    const cycle = (niveauObj as { cycle: string } | null)?.cycle ?? "autre";
    cycleMap.set(cycle, (cycleMap.get(cycle) ?? 0) + 1);
  });

  // Per classe stats
  type ClasseAgg = {
    nom: string;
    niveau: string;
    cycle: string;
    effectif: number;
    moyennes: number[];
    admis: number;
    redouble: number;
  };
  const classeMap = new Map<string, ClasseAgg>();
  filteredInsc.forEach((i) => {
    const classeObj = Array.isArray(i.classes) ? (i.classes as InscRow["classes"][])[0] : (i.classes as InscRow["classes"]);
    if (!classeObj) return;
    const niveauObj = Array.isArray(classeObj.niveaux) ? (classeObj.niveaux as { libelle: string; cycle: string }[])[0] : classeObj.niveaux;
    const key = classeObj.nom;
    const c = classeMap.get(key) ?? {
      nom: classeObj.nom,
      niveau: (niveauObj as { libelle: string } | null)?.libelle ?? "?",
      cycle: (niveauObj as { cycle: string } | null)?.cycle ?? "autre",
      effectif: 0,
      moyennes: [],
      admis: 0,
      redouble: 0,
    };
    c.effectif += 1;
    const b = bulletinMap.get(i.id);
    if (b && !Number.isNaN(b.moy)) c.moyennes.push(b.moy);
    if (i.decision_fin_annee === "admis") c.admis += 1;
    if (i.decision_fin_annee === "redouble") c.redouble += 1;
    classeMap.set(key, c);
  });

  const classes = Array.from(classeMap.values()).map((c) => ({
    classe_nom: c.nom,
    niveau_libelle: c.niveau,
    cycle: c.cycle,
    effectif: c.effectif,
    moyenne: c.moyennes.length > 0 ? c.moyennes.reduce((a, b) => a + b, 0) / c.moyennes.length : null,
    nb_admis: c.admis,
    nb_redoublants: c.redouble,
  }));

  // Top élèves
  const topElevesRaw = filteredInsc
    .map((i) => {
      const eleveObj = Array.isArray(i.eleves) ? (i.eleves as InscRow["eleves"][])[0] : (i.eleves as InscRow["eleves"]);
      const classeObj = Array.isArray(i.classes) ? (i.classes as InscRow["classes"][])[0] : (i.classes as InscRow["classes"]);
      const b = bulletinMap.get(i.id);
      return {
        eleve_id: i.eleve_id,
        nom: eleveObj?.nom ?? "?",
        prenom: eleveObj?.prenom ?? "?",
        matricule: eleveObj?.matricule ?? "",
        classe_nom: classeObj?.nom ?? "?",
        moyenne: b?.moy ?? null,
        rang: b?.rang ?? null,
      };
    })
    .filter((e): e is typeof e & { moyenne: number } => e.moyenne !== null)
    .sort((a, b) => b.moyenne - a.moyenne)
    .slice(0, 10);

  // Évolution trimestrielle : moyenne par période sur les bulletins de période
  type PeriodeBulletin = {
    moyenne_generale: number | null;
    periode_id: string;
    periodes_scolaires: { libelle: string; numero: number } | { libelle: string; numero: number }[] | null;
  };
  const { data: bulletinsPeriode } = await supabase
    .from("bulletins")
    .select("moyenne_generale, periode_id, periodes_scolaires(libelle, numero)")
    .in("inscription_id", inscIds.length ? inscIds : ["_none_"])
    .eq("est_annuel", false)
    .not("moyenne_generale", "is", null);
  const periodeMap = new Map<string, { libelle: string; numero: number; moys: number[] }>();
  ((bulletinsPeriode ?? []) as PeriodeBulletin[]).forEach((b) => {
    const p = Array.isArray(b.periodes_scolaires) ? b.periodes_scolaires[0] : b.periodes_scolaires;
    if (!p) return;
    const key = b.periode_id;
    const g = periodeMap.get(key) ?? { libelle: p.libelle, numero: p.numero, moys: [] };
    if (b.moyenne_generale !== null) g.moys.push(Number(b.moyenne_generale));
    periodeMap.set(key, g);
  });
  const evolution = Array.from(periodeMap.values())
    .sort((a, b) => a.numero - b.numero)
    .map((p) => ({
      periode: p.libelle,
      moyenne: p.moys.length > 0 ? p.moys.reduce((x, y) => x + y, 0) / p.moys.length : null,
    }));

  // Incidents (filtrés par établissement si précisé et par date dans l'année)
  let incidentQuery = supabase
    .from("incidents")
    .select("type, gravite, etablissement_id, date_incident")
    .gte("date_incident", annee.date_debut)
    .lte("date_incident", annee.date_fin);
  if (etablissement_id) incidentQuery = incidentQuery.eq("etablissement_id", etablissement_id);
  const { data: incidents } = await incidentQuery;

  const incTypeMap = new Map<string, number>();
  const incGraviteMap = new Map<string, number>();
  (incidents ?? []).forEach((i) => {
    incTypeMap.set(i.type, (incTypeMap.get(i.type) ?? 0) + 1);
    incGraviteMap.set(i.gravite, (incGraviteMap.get(i.gravite) ?? 0) + 1);
  });

  // Activité profs
  type EvalRow = {
    id: string;
    bareme: number;
    affectations: {
      utilisateur_id: string;
      classe_id: string;
      annees_scolaires: { id: string } | { id: string }[] | null;
      utilisateurs: { nom: string | null; prenom: string | null } | { nom: string | null; prenom: string | null }[] | null;
    } | null;
  };
  const { data: evaluations } = await supabase
    .from("evaluations")
    .select(
      "id, bareme, affectations(utilisateur_id, classe_id, annees_scolaires(id), utilisateurs(nom, prenom))"
    );

  const profMap = new Map<string, { nom: string; nb_evaluations: number; classes: Set<string>; total_notes: number; count_notes: number }>();
  ((evaluations ?? []) as unknown as EvalRow[]).forEach((e) => {
    const aff = Array.isArray(e.affectations) ? (e.affectations as EvalRow["affectations"][])[0] : (e.affectations as EvalRow["affectations"]);
    if (!aff) return;
    const annee = Array.isArray(aff.annees_scolaires) ? (aff.annees_scolaires as { id: string }[])[0] : aff.annees_scolaires;
    if ((annee as { id: string } | null)?.id !== annee_id) return;
    const u = Array.isArray(aff.utilisateurs) ? (aff.utilisateurs as { nom: string | null; prenom: string | null }[])[0] : aff.utilisateurs;
    const name = `${(u as { prenom: string | null } | null)?.prenom ?? ""} ${(u as { nom: string | null } | null)?.nom ?? ""}`.trim();
    const entry = profMap.get(aff.utilisateur_id) ?? {
      nom: name || aff.utilisateur_id.slice(0, 8),
      nb_evaluations: 0,
      classes: new Set<string>(),
      total_notes: 0,
      count_notes: 0,
    };
    entry.nb_evaluations += 1;
    entry.classes.add(aff.classe_id);
    profMap.set(aff.utilisateur_id, entry);
  });

  const activiteProfs = Array.from(profMap.values())
    .map((p) => ({
      prof_nom: p.nom,
      nb_evaluations: p.nb_evaluations,
      moyenne_notes: p.count_notes > 0 ? p.total_notes / p.count_notes : null,
      nb_classes: p.classes.size,
    }))
    .sort((a, b) => b.nb_evaluations - a.nb_evaluations)
    .slice(0, 10);

  return {
    annee_id: annee.id,
    annee_libelle: annee.libelle,
    date_debut: annee.date_debut,
    date_fin: annee.date_fin,
    etablissement_id,
    etablissement_nom: etablissementNom,
    organisation_nom: org?.nom ?? "Organisation",
    effectif: filteredInsc.length,
    nb_admis: nbAdmis,
    nb_redoublants: nbRedoublants,
    nb_diplomes: nbDiplomes,
    nb_exclus: nbExclus,
    nb_transferes: nbTransferes,
    nb_abandons: nbAbandons,
    moyenne_generale: moyenneGen,
    taux_reussite: tauxReussite,
    repartition_cycle: Array.from(cycleMap.entries()).map(([cycle, count]) => ({ cycle, count })),
    classes,
    top_eleves: topElevesRaw,
    evolution_trimestrielle: evolution,
    incidents_par_type: Array.from(incTypeMap.entries()).map(([type, count]) => ({ type, count })),
    incidents_par_gravite: Array.from(incGraviteMap.entries()).map(([gravite, count]) => ({ gravite, count })),
    activite_profs: activiteProfs,
  };
}
