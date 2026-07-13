import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEtabScope } from "@/lib/auth";

export type EleveListItem = {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  photo_url: string | null;
  actif: boolean;
  cle_parentale: string;
  etablissement_id: string;
  etablissement_nom: string;
  classe: string | null;
  classe_id: string | null;
  cycle: string;
  moyenne: number | null;
  date_naissance: string | null;
  sexe: string | null;
  adresse: string | null;
  lieu_naissance: string | null;
  nationalite: string | null;
  tel_urgence: string | null;
  personne_urgence: string | null;
  infos_medicales: string | null;
  infos_allergies: string | null;
  parent: {
    utilisateur_id: string;
    pseudo: string;
    nom: string | null;
    prenom: string | null;
  } | null;
};

export async function getEleves(): Promise<EleveListItem[]> {
  const supabase = createAdminClient();
  const scope = await getEtabScope();

  const base = supabase
    .from("eleves")
    .select(
      `
      id, matricule, nom, prenom, photo_url, actif, cle_parentale,
      etablissement_id, date_naissance, sexe, adresse, lieu_naissance, nationalite,
      tel_urgence, personne_urgence, infos_medicales, infos_allergies,
      etablissements(nom, cycle_principal),
      inscriptions(
        statut,
        classe_id,
        classes(id, nom, niveaux(cycle)),
        annees_scolaires!inner(active)
      ),
      utilisateurs!fk_eleves_cle_parentale(id, pseudo, nom, prenom)
    `
    )
    .order("nom");

  const filtre = base.is("archive_le", null);
  const { data, error } = await (scope ? filtre.eq("etablissement_id", scope) : filtre);

  if (error) {
    console.error(
      "getEleves:",
      error.message,
      error.code,
      error.details,
      error.hint
    );
    return [];
  }

  return (data ?? []).map((e: {
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
    photo_url: string | null;
    actif: boolean;
    cle_parentale: string;
    etablissement_id: string;
    date_naissance: string | null;
    sexe: string | null;
    adresse: string | null;
    lieu_naissance: string | null;
    nationalite: string | null;
    tel_urgence: string | null;
    personne_urgence: string | null;
    infos_medicales: string | null;
    infos_allergies: string | null;
    etablissements: { nom: string; cycle_principal: string } | { nom: string; cycle_principal: string }[] | null;
    inscriptions: Array<{
      statut: string;
      classe_id: string | null;
      classes: { id: string; nom: string; niveaux: { cycle: string } | { cycle: string }[] | null } | { id: string; nom: string; niveaux: { cycle: string } | { cycle: string }[] | null }[] | null;
      annees_scolaires: { active: boolean } | { active: boolean }[] | null;
    }> | null;
    utilisateurs: { id: string; pseudo: string; nom: string | null; prenom: string | null } | { id: string; pseudo: string; nom: string | null; prenom: string | null }[] | null;
  }) => {
    const etab = Array.isArray(e.etablissements) ? e.etablissements[0] : e.etablissements;
    const activeInscription = (e.inscriptions ?? []).find((i) => {
      const annee = Array.isArray(i.annees_scolaires) ? i.annees_scolaires[0] : i.annees_scolaires;
      return annee?.active && i.statut === "inscrit";
    });
    const classe = activeInscription
      ? Array.isArray(activeInscription.classes)
        ? activeInscription.classes[0]
        : activeInscription.classes
      : null;
    const niveau = classe
      ? Array.isArray(classe.niveaux)
        ? classe.niveaux[0]
        : classe.niveaux
      : null;
    const cycle = niveau?.cycle ?? etab?.cycle_principal ?? "autre";
    const parent = Array.isArray(e.utilisateurs) ? e.utilisateurs[0] : e.utilisateurs;

    return {
      id: e.id,
      matricule: e.matricule,
      nom: e.nom,
      prenom: e.prenom,
      photo_url: e.photo_url,
      actif: e.actif,
      cle_parentale: e.cle_parentale,
      etablissement_id: e.etablissement_id,
      etablissement_nom: etab?.nom ?? "?",
      classe: classe?.nom ?? null,
      classe_id: classe?.id ?? null,
      cycle,
      moyenne: null,
      date_naissance: e.date_naissance,
      sexe: e.sexe,
      adresse: e.adresse,
      lieu_naissance: e.lieu_naissance,
      nationalite: e.nationalite,
      tel_urgence: e.tel_urgence,
      personne_urgence: e.personne_urgence,
      infos_medicales: e.infos_medicales,
      infos_allergies: e.infos_allergies,
      parent: parent
        ? {
            utilisateur_id: parent.id,
            pseudo: parent.pseudo,
            nom: parent.nom,
            prenom: parent.prenom,
          }
        : null,
    };
  });
}

export async function getEleveFormData() {
  const supabase = createAdminClient();
  const [{ data: etabs }, { data: classes }, { data: annees }] = await Promise.all([
    supabase.from("etablissements").select("id, nom").eq("actif", true).order("nom"),
    supabase
      .from("classes")
      .select(
        "id, nom, niveau_id, annee_scolaire_id, niveaux(libelle, etablissement_id, cycle), annees_scolaires(libelle, active)"
      )
      .order("nom"),
    supabase
      .from("annees_scolaires")
      .select("id, libelle, active")
      .order("date_debut", { ascending: false }),
  ]);

  return {
    etablissements: etabs ?? [],
    classes: (classes ?? []).map((c: {
      id: string;
      nom: string;
      niveau_id: string;
      annee_scolaire_id: string;
      niveaux: { libelle: string; etablissement_id: string; cycle: string } | { libelle: string; etablissement_id: string; cycle: string }[] | null;
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
  };
}
