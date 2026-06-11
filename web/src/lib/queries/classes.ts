import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type ClasseItem = {
  id: string;
  nom: string;
  code: string | null;
  salle: string | null;
  capacite_max: number | null;
  niveau_id: string;
  niveau_libelle: string;
  niveau_code: string;
  cycle: string;
  annee_scolaire_id: string;
  annee_libelle: string;
  annee_active: boolean;
  titulaire_utilisateur_id: string | null;
  titulaire_nom: string | null;
  titulaire_prenom: string | null;
  titulaire_pseudo: string | null;
  effectif: number;
};

export async function getClasses(): Promise<ClasseItem[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("classes")
    .select(
      `id, nom, code, salle, capacite_max, niveau_id, annee_scolaire_id, titulaire_utilisateur_id,
       niveaux(libelle, code, cycle),
       annees_scolaires(libelle, active),
       utilisateurs:titulaire_utilisateur_id(nom, prenom, pseudo)`
    )
    .order("nom");

  if (error) {
    console.error("getClasses:", error);
    return [];
  }

  const classIds = (data ?? []).map((c) => c.id);
  const { data: inscData } = await supabase
    .from("inscriptions")
    .select("classe_id")
    .in("classe_id", classIds.length ? classIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("statut", "inscrit");
  const effectifMap = new Map<string, number>();
  (inscData ?? []).forEach((i) => {
    effectifMap.set(i.classe_id, (effectifMap.get(i.classe_id) ?? 0) + 1);
  });

  return (data ?? []).map((c: {
    id: string;
    nom: string;
    code: string | null;
    salle: string | null;
    capacite_max: number | null;
    niveau_id: string;
    annee_scolaire_id: string;
    titulaire_utilisateur_id: string | null;
    niveaux: { libelle: string; code: string; cycle: string } | { libelle: string; code: string; cycle: string }[] | null;
    annees_scolaires: { libelle: string; active: boolean } | { libelle: string; active: boolean }[] | null;
    utilisateurs: { nom: string | null; prenom: string | null; pseudo: string } | { nom: string | null; prenom: string | null; pseudo: string }[] | null;
  }) => {
    const niveau = Array.isArray(c.niveaux) ? c.niveaux[0] : c.niveaux;
    const annee = Array.isArray(c.annees_scolaires) ? c.annees_scolaires[0] : c.annees_scolaires;
    const titu = Array.isArray(c.utilisateurs) ? c.utilisateurs[0] : c.utilisateurs;
    return {
      id: c.id,
      nom: c.nom,
      code: c.code,
      salle: c.salle,
      capacite_max: c.capacite_max,
      niveau_id: c.niveau_id,
      niveau_libelle: niveau?.libelle ?? "?",
      niveau_code: niveau?.code ?? "?",
      cycle: niveau?.cycle ?? "autre",
      annee_scolaire_id: c.annee_scolaire_id,
      annee_libelle: annee?.libelle ?? "?",
      annee_active: annee?.active ?? false,
      titulaire_utilisateur_id: c.titulaire_utilisateur_id,
      titulaire_nom: titu?.nom ?? null,
      titulaire_prenom: titu?.prenom ?? null,
      titulaire_pseudo: titu?.pseudo ?? null,
      effectif: effectifMap.get(c.id) ?? 0,
    };
  });
}

export async function getClasseFormData() {
  const supabase = createAdminClient();
  const [{ data: niveaux }, { data: annees }, { data: profs }] = await Promise.all([
    supabase.from("niveaux").select("id, libelle, code, cycle, etablissement_id, ordre").order("ordre"),
    supabase
      .from("annees_scolaires")
      .select("id, libelle, active, date_debut")
      .order("date_debut", { ascending: false }),
    supabase
      .from("utilisateurs")
      .select("id, pseudo, nom, prenom, roles!inner(code)")
      .eq("roles.code", "prof")
      .eq("actif", true)
      .order("nom"),
  ]);
  return {
    niveaux: niveaux ?? [],
    annees: annees ?? [],
    profs: (profs ?? []) as Array<{ id: string; pseudo: string; nom: string | null; prenom: string | null }>,
  };
}
