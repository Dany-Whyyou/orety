import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEtabScope } from "@/lib/auth";

export type AffectationItem = {
  id: string;
  utilisateur_id: string;
  prof_nom: string | null;
  prof_prenom: string | null;
  prof_pseudo: string;
  classe_id: string;
  classe_nom: string;
  niveau_libelle: string;
  cycle: string;
  annee_scolaire_id: string;
  annee_libelle: string;
  annee_active: boolean;
  matiere_id: string | null;
  matiere_nom: string | null;
  matiere_code: string | null;
  matiere_couleur: string | null;
  heures_semaine: number | null;
};

export async function getAffectations(): Promise<AffectationItem[]> {
  const supabase = createAdminClient();
  const scope = await getEtabScope();

  const base = supabase
    .from("affectations")
    .select(
      `id, utilisateur_id, classe_id, annee_scolaire_id, matiere_id, heures_semaine,
       utilisateurs(nom, prenom, pseudo),
       classes!inner(nom, archive_le, niveaux!inner(libelle, cycle, etablissement_id)),
       annees_scolaires(libelle, active),
       matieres(nom, code, couleur)`
    )
    .is("classes.archive_le", null);
  const { data, error } = await (scope ? base.eq("classes.niveaux.etablissement_id", scope) : base);

  if (error) {
    console.error("getAffectations:", error);
    return [];
  }

  return (data ?? []).map((a: {
    id: string;
    utilisateur_id: string;
    classe_id: string;
    annee_scolaire_id: string;
    matiere_id: string | null;
    heures_semaine: number | null;
    utilisateurs: { nom: string | null; prenom: string | null; pseudo: string } | { nom: string | null; prenom: string | null; pseudo: string }[] | null;
    classes: { nom: string; niveaux: { libelle: string; cycle: string } | { libelle: string; cycle: string }[] | null } | { nom: string; niveaux: { libelle: string; cycle: string } | { libelle: string; cycle: string }[] | null }[] | null;
    annees_scolaires: { libelle: string; active: boolean } | { libelle: string; active: boolean }[] | null;
    matieres: { nom: string; code: string; couleur: string | null } | { nom: string; code: string; couleur: string | null }[] | null;
  }) => {
    const prof = Array.isArray(a.utilisateurs) ? a.utilisateurs[0] : a.utilisateurs;
    const classe = Array.isArray(a.classes) ? a.classes[0] : a.classes;
    const niveau = classe
      ? Array.isArray(classe.niveaux)
        ? classe.niveaux[0]
        : classe.niveaux
      : null;
    const annee = Array.isArray(a.annees_scolaires) ? a.annees_scolaires[0] : a.annees_scolaires;
    const matiere = Array.isArray(a.matieres) ? a.matieres[0] : a.matieres;
    return {
      id: a.id,
      utilisateur_id: a.utilisateur_id,
      prof_nom: prof?.nom ?? null,
      prof_prenom: prof?.prenom ?? null,
      prof_pseudo: prof?.pseudo ?? "?",
      classe_id: a.classe_id,
      classe_nom: classe?.nom ?? "?",
      niveau_libelle: niveau?.libelle ?? "?",
      cycle: niveau?.cycle ?? "autre",
      annee_scolaire_id: a.annee_scolaire_id,
      annee_libelle: annee?.libelle ?? "?",
      annee_active: annee?.active ?? false,
      matiere_id: a.matiere_id,
      matiere_nom: matiere?.nom ?? null,
      matiere_code: matiere?.code ?? null,
      matiere_couleur: matiere?.couleur ?? null,
      heures_semaine: a.heures_semaine,
    };
  });
}

export async function getAffectationFormData() {
  const supabase = createAdminClient();
  const [{ data: profRole }] = await Promise.all([
    supabase.from("roles").select("id").eq("code", "prof").eq("is_system", true).single(),
  ]);

  const [{ data: profs }, { data: classes }, { data: annees }, { data: matieres }] =
    await Promise.all([
      supabase
        .from("utilisateurs")
        .select("id, pseudo, nom, prenom, prof_matieres(matiere_id), utilisateur_etablissements(etablissement_id)")
        .eq("role_id", profRole?.id ?? "00000000-0000-0000-0000-000000000000")
        .eq("actif", true)
        .order("nom"),
      supabase
        .from("classes")
        .select("id, nom, niveau_id, annee_scolaire_id, niveaux(libelle, cycle, etablissement_id), annees_scolaires(libelle, active)")
        .is("archive_le", null)
        .order("nom"),
      supabase
        .from("annees_scolaires")
        .select("id, libelle, active")
        .is("archive_le", null)
        .order("date_debut", { ascending: false }),
      supabase.from("matieres").select("id, nom, code, couleur, etablissement_id, ordre").is("archive_le", null).order("ordre"),
    ]);

  return {
    profs: (profs ?? []).map((p: {
      id: string;
      pseudo: string;
      nom: string | null;
      prenom: string | null;
      prof_matieres: Array<{ matiere_id: string }> | null;
      utilisateur_etablissements: Array<{ etablissement_id: string }> | null;
    }) => ({
      id: p.id,
      pseudo: p.pseudo,
      nom: p.nom,
      prenom: p.prenom,
      matiere_ids: (p.prof_matieres ?? []).map((pm) => pm.matiere_id),
      etablissement_ids: (p.utilisateur_etablissements ?? []).map((ue) => ue.etablissement_id),
    })),
    classes: (classes ?? []).map((c: {
      id: string;
      nom: string;
      niveau_id: string;
      annee_scolaire_id: string;
      niveaux: { libelle: string; cycle: string; etablissement_id: string } | { libelle: string; cycle: string; etablissement_id: string }[] | null;
      annees_scolaires: { libelle: string; active: boolean } | { libelle: string; active: boolean }[] | null;
    }) => {
      const niv = Array.isArray(c.niveaux) ? c.niveaux[0] : c.niveaux;
      const a = Array.isArray(c.annees_scolaires) ? c.annees_scolaires[0] : c.annees_scolaires;
      return {
        id: c.id,
        nom: c.nom,
        niveau_id: c.niveau_id,
        niveau_libelle: niv?.libelle ?? "?",
        cycle: niv?.cycle ?? "autre",
        etablissement_id: niv?.etablissement_id ?? "",
        annee_scolaire_id: c.annee_scolaire_id,
        annee_libelle: a?.libelle ?? "?",
        annee_active: a?.active ?? false,
      };
    }),
    annees: annees ?? [],
    matieres: matieres ?? [],
  };
}
