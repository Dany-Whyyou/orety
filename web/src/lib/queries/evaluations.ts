import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEtabScope } from "@/lib/auth";

export type TypeEvaluationItem = {
  id: string;
  etablissement_id: string;
  etablissement_nom: string;
  code: string;
  libelle: string;
  poids_defaut: number;
  couleur: string | null;
  ordre: number;
  actif: boolean;
  nb_utilisations: number;
};

export type EvaluationItem = {
  id: string;
  titre: string;
  description: string | null;
  date_evaluation: string;
  bareme: number;
  poids: number;
  autorise_bonus: boolean;
  bonus_max: number | null;
  publiee: boolean;
  // Related
  affectation_id: string;
  classe_id: string;
  classe_nom: string;
  niveau_libelle: string;
  cycle: string;
  matiere_id: string | null;
  matiere_nom: string | null;
  matiere_code: string | null;
  matiere_couleur: string | null;
  prof_pseudo: string;
  prof_nom: string | null;
  prof_prenom: string | null;
  type_id: string;
  type_libelle: string;
  type_couleur: string | null;
  periode_id: string;
  periode_libelle: string;
  annee_libelle: string;
  annee_active: boolean;
  annee_scolaire_id: string;
  nb_notes: number;
  nb_eleves: number;
  moyenne_sur_20: number | null;
};

export async function getTypesEvaluation(): Promise<TypeEvaluationItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("types_evaluation")
    .select("id, etablissement_id, code, libelle, poids_defaut, couleur, ordre, actif, etablissements(nom)")
    .is("archive_le", null)
    .order("ordre");
  if (error) return [];

  const ids = (data ?? []).map((t) => t.id);
  const { data: usage } = await supabase
    .from("evaluations")
    .select("type_evaluation_id")
    .is("archive_le", null)
    .in("type_evaluation_id", ids.length ? ids : ["_none_"]);
  const usageCount = new Map<string, number>();
  (usage ?? []).forEach((u) => {
    usageCount.set(u.type_evaluation_id, (usageCount.get(u.type_evaluation_id) ?? 0) + 1);
  });

  return (data ?? []).map((t: {
    id: string;
    etablissement_id: string;
    code: string;
    libelle: string;
    poids_defaut: number;
    couleur: string | null;
    ordre: number;
    actif: boolean;
    etablissements: { nom: string } | { nom: string }[] | null;
  }) => {
    const etab = Array.isArray(t.etablissements) ? t.etablissements[0] : t.etablissements;
    return {
      id: t.id,
      etablissement_id: t.etablissement_id,
      etablissement_nom: etab?.nom ?? "?",
      code: t.code,
      libelle: t.libelle,
      poids_defaut: t.poids_defaut,
      couleur: t.couleur,
      ordre: t.ordre,
      actif: t.actif,
      nb_utilisations: usageCount.get(t.id) ?? 0,
    };
  });
}

export async function getEvaluations(): Promise<EvaluationItem[]> {
  const supabase = createAdminClient();
  const scope = await getEtabScope();

  const base = supabase
    .from("evaluations")
    .select(
      `id, titre, description, date_evaluation, bareme, poids, autorise_bonus, bonus_max, publiee,
       affectation_id, type_evaluation_id, periode_id,
       types_evaluation(libelle, couleur),
       periodes_scolaires(libelle),
       affectations!inner(
         classe_id, matiere_id, utilisateur_id, annee_scolaire_id,
         classes!inner(id, nom, niveaux!inner(libelle, cycle, etablissement_id)),
         matieres(id, nom, code, couleur),
         utilisateurs(pseudo, nom, prenom),
         annees_scolaires(libelle, active)
       )`
    )
    .is("archive_le", null)
    .order("date_evaluation", { ascending: false });
  const { data, error } = await (scope
    ? base.eq("affectations.classes.niveaux.etablissement_id", scope)
    : base);

  if (error) {
    console.error("getEvaluations:", error);
    return [];
  }

  const evalIds = (data ?? []).map((e) => e.id);
  const { data: notesData } = await supabase
    .from("notes")
    .select("evaluation_id, note, bonus, absent")
    .in("evaluation_id", evalIds.length ? evalIds : ["_none_"]);

  const notesByEval = new Map<string, { count: number; total: number; countForAvg: number }>();
  (notesData ?? []).forEach((n) => {
    const s = notesByEval.get(n.evaluation_id) ?? { count: 0, total: 0, countForAvg: 0 };
    s.count += 1;
    if (!n.absent && n.note !== null) {
      s.countForAvg += 1;
      s.total += Number(n.note) + Number(n.bonus ?? 0);
    }
    notesByEval.set(n.evaluation_id, s);
  });

  // Count élèves in each classe for "nb_eleves" (to know how many notes are expected)
  const classeIds = new Set<string>();
  (data ?? []).forEach((e) => {
    const aff = Array.isArray(e.affectations) ? e.affectations[0] : e.affectations;
    if (aff && (aff as { classe_id: string }).classe_id) classeIds.add((aff as { classe_id: string }).classe_id);
  });
  const { data: inscData } = await supabase
    .from("inscriptions")
    .select("classe_id")
    .in("classe_id", [...classeIds].length ? [...classeIds] : ["_none_"])
    .eq("statut", "inscrit");
  const effectifByClasse = new Map<string, number>();
  (inscData ?? []).forEach((i) => {
    effectifByClasse.set(i.classe_id, (effectifByClasse.get(i.classe_id) ?? 0) + 1);
  });

  return (data ?? []).map((e) => {
    const rec = e as {
      id: string;
      titre: string;
      description: string | null;
      date_evaluation: string;
      bareme: number;
      poids: number;
      autorise_bonus: boolean;
      bonus_max: number | null;
      publiee: boolean;
      affectation_id: string;
      type_evaluation_id: string;
      periode_id: string;
      types_evaluation: { libelle: string; couleur: string | null } | { libelle: string; couleur: string | null }[] | null;
      periodes_scolaires: { libelle: string } | { libelle: string }[] | null;
      affectations: {
        classe_id: string;
        matiere_id: string | null;
        utilisateur_id: string;
        annee_scolaire_id: string;
        classes: { id: string; nom: string; niveaux: { libelle: string; cycle: string } | { libelle: string; cycle: string }[] | null } | { id: string; nom: string; niveaux: { libelle: string; cycle: string } | { libelle: string; cycle: string }[] | null }[] | null;
        matieres: { id: string; nom: string; code: string; couleur: string | null } | { id: string; nom: string; code: string; couleur: string | null }[] | null;
        utilisateurs: { pseudo: string; nom: string | null; prenom: string | null } | { pseudo: string; nom: string | null; prenom: string | null }[] | null;
        annees_scolaires: { libelle: string; active: boolean } | { libelle: string; active: boolean }[] | null;
      } | {
        classe_id: string;
        matiere_id: string | null;
        utilisateur_id: string;
        annee_scolaire_id: string;
        classes: { id: string; nom: string; niveaux: { libelle: string; cycle: string } | { libelle: string; cycle: string }[] | null } | { id: string; nom: string; niveaux: { libelle: string; cycle: string } | { libelle: string; cycle: string }[] | null }[] | null;
        matieres: { id: string; nom: string; code: string; couleur: string | null } | { id: string; nom: string; code: string; couleur: string | null }[] | null;
        utilisateurs: { pseudo: string; nom: string | null; prenom: string | null } | { pseudo: string; nom: string | null; prenom: string | null }[] | null;
        annees_scolaires: { libelle: string; active: boolean } | { libelle: string; active: boolean }[] | null;
      }[] | null;
    };
    const type = Array.isArray(rec.types_evaluation) ? rec.types_evaluation[0] : rec.types_evaluation;
    const periode = Array.isArray(rec.periodes_scolaires) ? rec.periodes_scolaires[0] : rec.periodes_scolaires;
    const aff = Array.isArray(rec.affectations) ? rec.affectations[0] : rec.affectations;
    const classe = aff
      ? Array.isArray(aff.classes)
        ? aff.classes[0]
        : aff.classes
      : null;
    const niveau = classe
      ? Array.isArray(classe.niveaux)
        ? classe.niveaux[0]
        : classe.niveaux
      : null;
    const matiere = aff
      ? Array.isArray(aff.matieres)
        ? aff.matieres[0]
        : aff.matieres
      : null;
    const prof = aff
      ? Array.isArray(aff.utilisateurs)
        ? aff.utilisateurs[0]
        : aff.utilisateurs
      : null;
    const annee = aff
      ? Array.isArray(aff.annees_scolaires)
        ? aff.annees_scolaires[0]
        : aff.annees_scolaires
      : null;

    const stats = notesByEval.get(rec.id) ?? { count: 0, total: 0, countForAvg: 0 };
    const moyenneBrute = stats.countForAvg > 0 ? stats.total / stats.countForAvg : null;
    const moyenneSur20 =
      moyenneBrute !== null && rec.bareme > 0 ? (moyenneBrute / rec.bareme) * 20 : null;

    return {
      id: rec.id,
      titre: rec.titre,
      description: rec.description,
      date_evaluation: rec.date_evaluation,
      bareme: rec.bareme,
      poids: rec.poids,
      autorise_bonus: rec.autorise_bonus,
      bonus_max: rec.bonus_max,
      publiee: rec.publiee,
      affectation_id: rec.affectation_id,
      classe_id: aff?.classe_id ?? "",
      classe_nom: classe?.nom ?? "?",
      niveau_libelle: niveau?.libelle ?? "?",
      cycle: niveau?.cycle ?? "autre",
      matiere_id: aff?.matiere_id ?? null,
      matiere_nom: matiere?.nom ?? null,
      matiere_code: matiere?.code ?? null,
      matiere_couleur: matiere?.couleur ?? null,
      prof_pseudo: prof?.pseudo ?? "?",
      prof_nom: prof?.nom ?? null,
      prof_prenom: prof?.prenom ?? null,
      type_id: rec.type_evaluation_id,
      type_libelle: type?.libelle ?? "?",
      type_couleur: type?.couleur ?? null,
      periode_id: rec.periode_id,
      periode_libelle: periode?.libelle ?? "?",
      annee_libelle: annee?.libelle ?? "?",
      annee_active: annee?.active ?? false,
      annee_scolaire_id: aff?.annee_scolaire_id ?? "",
      nb_notes: stats.count,
      nb_eleves: effectifByClasse.get(aff?.classe_id ?? "") ?? 0,
      moyenne_sur_20: moyenneSur20,
    };
  });
}

export async function getEvaluationFormData() {
  const supabase = createAdminClient();
  const [{ data: types }, { data: affectations }, { data: periodes }, { data: etabs }] =
    await Promise.all([
      supabase
        .from("types_evaluation")
        .select("id, libelle, code, poids_defaut, couleur, etablissement_id")
        .eq("actif", true)
        .is("archive_le", null)
        .order("ordre"),
      supabase
        .from("affectations")
        .select(
          `id, utilisateur_id, classe_id, matiere_id, annee_scolaire_id,
           classes!inner(nom, archive_le, niveaux(libelle, etablissement_id)),
           matieres(id, nom, code, couleur),
           utilisateurs!inner(pseudo, nom, prenom, actif, archive_le),
           annees_scolaires(libelle, active)`
        )
        .is("classes.archive_le", null)
        .is("utilisateurs.archive_le", null)
        .eq("utilisateurs.actif", true),
      supabase
        .from("periodes_scolaires")
        .select(
          "id, libelle, numero, date_debut, date_fin, config_bulletin_id, config_bulletins(etablissement_id, annee_scolaire_id)"
        ),
      supabase.from("etablissements").select("id, nom").eq("actif", true).order("nom"),
    ]);

  return {
    types: (types ?? []) as Array<{
      id: string;
      libelle: string;
      code: string;
      poids_defaut: number;
      couleur: string | null;
      etablissement_id: string;
    }>,
    affectations: (affectations ?? []).map((a) => {
      const rec = a as {
        id: string;
        utilisateur_id: string;
        classe_id: string;
        matiere_id: string | null;
        annee_scolaire_id: string;
        classes: { nom: string; niveaux: { libelle: string; etablissement_id: string } | { libelle: string; etablissement_id: string }[] | null } | { nom: string; niveaux: { libelle: string; etablissement_id: string } | { libelle: string; etablissement_id: string }[] | null }[] | null;
        matieres: { id: string; nom: string; code: string; couleur: string | null } | { id: string; nom: string; code: string; couleur: string | null }[] | null;
        utilisateurs: { pseudo: string; nom: string | null; prenom: string | null } | { pseudo: string; nom: string | null; prenom: string | null }[] | null;
        annees_scolaires: { libelle: string; active: boolean } | { libelle: string; active: boolean }[] | null;
      };
      const c = Array.isArray(rec.classes) ? rec.classes[0] : rec.classes;
      const n = c
        ? Array.isArray(c.niveaux)
          ? c.niveaux[0]
          : c.niveaux
        : null;
      const m = Array.isArray(rec.matieres) ? rec.matieres[0] : rec.matieres;
      const u = Array.isArray(rec.utilisateurs) ? rec.utilisateurs[0] : rec.utilisateurs;
      const y = Array.isArray(rec.annees_scolaires) ? rec.annees_scolaires[0] : rec.annees_scolaires;
      return {
        id: rec.id,
        utilisateur_id: rec.utilisateur_id,
        classe_id: rec.classe_id,
        matiere_id: rec.matiere_id,
        annee_scolaire_id: rec.annee_scolaire_id,
        classe_nom: c?.nom ?? "?",
        niveau_libelle: n?.libelle ?? "?",
        etablissement_id: n?.etablissement_id ?? "",
        matiere_nom: m?.nom ?? null,
        matiere_code: m?.code ?? null,
        matiere_couleur: m?.couleur ?? null,
        prof_pseudo: u?.pseudo ?? "?",
        prof_nom: u?.nom ?? null,
        prof_prenom: u?.prenom ?? null,
        annee_libelle: y?.libelle ?? "?",
        annee_active: y?.active ?? false,
      };
    }),
    periodes: (periodes ?? []).map((p) => {
      const rec = p as {
        id: string;
        libelle: string;
        numero: number;
        date_debut: string;
        date_fin: string;
        config_bulletin_id: string;
        config_bulletins: { etablissement_id: string; annee_scolaire_id: string } | { etablissement_id: string; annee_scolaire_id: string }[] | null;
      };
      const cfg = Array.isArray(rec.config_bulletins) ? rec.config_bulletins[0] : rec.config_bulletins;
      return {
        id: rec.id,
        libelle: rec.libelle,
        numero: rec.numero,
        date_debut: rec.date_debut,
        date_fin: rec.date_fin,
        etablissement_id: cfg?.etablissement_id ?? "",
        annee_scolaire_id: cfg?.annee_scolaire_id ?? "",
      };
    }),
    etablissements: etabs ?? [],
  };
}

export type NoteRow = {
  inscription_id: string;
  eleve_id: string;
  eleve_nom: string;
  eleve_prenom: string;
  matricule: string;
  note_id: string | null;
  note: number | null;
  bonus: number;
  absent: boolean;
  commentaire: string | null;
};

export async function getNotesForEvaluation(evaluationId: string): Promise<{
  evaluation: EvaluationItem | null;
  rows: NoteRow[];
}> {
  const supabase = createAdminClient();

  // Find evaluation context
  const { data: ev } = await supabase
    .from("evaluations")
    .select(
      `id, affectation_id,
       affectations(classe_id, annee_scolaire_id)`
    )
    .eq("id", evaluationId)
    .single();

  if (!ev) return { evaluation: null, rows: [] };

  const aff = Array.isArray(ev.affectations) ? ev.affectations[0] : ev.affectations;
  const classeId = (aff as { classe_id: string } | null)?.classe_id ?? "";
  const anneeId = (aff as { annee_scolaire_id: string } | null)?.annee_scolaire_id ?? "";

  // List inscrits in that classe for that year
  const { data: inscriptions } = await supabase
    .from("inscriptions")
    .select("id, eleve_id, eleves!inner(nom, prenom, matricule, archive_le)")
    .eq("classe_id", classeId)
    .eq("annee_scolaire_id", anneeId)
    .eq("statut", "inscrit")
    .is("eleves.archive_le", null);

  // Existing notes
  const { data: notesData } = await supabase
    .from("notes")
    .select("id, eleve_id, note, bonus, absent, commentaire")
    .eq("evaluation_id", evaluationId);
  const notesByEleve = new Map<string, {
    id: string;
    note: number | null;
    bonus: number;
    absent: boolean;
    commentaire: string | null;
  }>();
  (notesData ?? []).forEach((n) => {
    notesByEleve.set(n.eleve_id, {
      id: n.id,
      note: n.note,
      bonus: Number(n.bonus ?? 0),
      absent: n.absent,
      commentaire: n.commentaire,
    });
  });

  const rows: NoteRow[] = (inscriptions ?? [])
    .map((i: { id: string; eleve_id: string; eleves: { nom: string; prenom: string; matricule: string } | { nom: string; prenom: string; matricule: string }[] | null }) => {
      const el = Array.isArray(i.eleves) ? i.eleves[0] : i.eleves;
      const n = notesByEleve.get(i.eleve_id);
      return {
        inscription_id: i.id,
        eleve_id: i.eleve_id,
        eleve_nom: el?.nom ?? "?",
        eleve_prenom: el?.prenom ?? "?",
        matricule: el?.matricule ?? "",
        note_id: n?.id ?? null,
        note: n?.note ?? null,
        bonus: n?.bonus ?? 0,
        absent: n?.absent ?? false,
        commentaire: n?.commentaire ?? null,
      };
    })
    .sort((a, b) => a.eleve_nom.localeCompare(b.eleve_nom));

  // Return summary — re-use getEvaluations but filter — lighter approach: reuse logic
  const allEvals = await getEvaluations();
  const evaluation = allEvals.find((e) => e.id === evaluationId) ?? null;

  return { evaluation, rows };
}
