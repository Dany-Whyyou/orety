import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type ProfListItem = {
  utilisateur_id: string;
  pseudo: string;
  nom: string | null;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  photo_url: string | null;
  actif: boolean;
  pwd_initial_utilise: boolean;
  matricule: string | null;
  date_embauche: string | null;
  diplome: string | null;
  specialite: string | null;
  etablissements: { id: string; nom: string }[];
  matieres: { id: string; nom: string; code: string; couleur: string | null }[];
  nb_affectations: number;
};

export async function getProfs(): Promise<ProfListItem[]> {
  const supabase = createAdminClient();

  // Get prof role id
  const { data: roleData } = await supabase
    .from("roles")
    .select("id")
    .eq("code", "prof")
    .eq("is_system", true)
    .single();

  if (!roleData) return [];

  const { data: usersData, error } = await supabase
    .from("utilisateurs")
    .select(
      `id, pseudo, nom, prenom, email, telephone, photo_url, actif, mot_de_passe_initial_utilise,
       profs(matricule, date_embauche, diplome, specialite),
       utilisateur_etablissements(etablissements(id, nom)),
       prof_matieres(matieres(id, nom, code, couleur))`
    )
    .eq("role_id", roleData.id)
    .order("nom");

  if (error) {
    console.error("getProfs:", error);
    return [];
  }

  // Count affectations per prof
  const profIds = (usersData ?? []).map((u) => u.id);
  const { data: affectData } = await supabase
    .from("affectations")
    .select("utilisateur_id")
    .in("utilisateur_id", profIds.length ? profIds : ["00000000-0000-0000-0000-000000000000"]);
  const affCount = new Map<string, number>();
  (affectData ?? []).forEach((a) => {
    affCount.set(a.utilisateur_id, (affCount.get(a.utilisateur_id) ?? 0) + 1);
  });

  return (usersData ?? []).map((u: {
    id: string;
    pseudo: string;
    nom: string | null;
    prenom: string | null;
    email: string | null;
    telephone: string | null;
    photo_url: string | null;
    actif: boolean;
    mot_de_passe_initial_utilise: boolean;
    profs: { matricule: string | null; date_embauche: string | null; diplome: string | null; specialite: string | null } | { matricule: string | null; date_embauche: string | null; diplome: string | null; specialite: string | null }[] | null;
    utilisateur_etablissements: Array<{ etablissements: { id: string; nom: string } | { id: string; nom: string }[] | null }> | null;
    prof_matieres: Array<{ matieres: { id: string; nom: string; code: string; couleur: string | null } | { id: string; nom: string; code: string; couleur: string | null }[] | null }> | null;
  }) => {
    const prof = Array.isArray(u.profs) ? u.profs[0] : u.profs;
    const etabs: { id: string; nom: string }[] = [];
    (u.utilisateur_etablissements ?? []).forEach((ue) => {
      const e = Array.isArray(ue.etablissements) ? ue.etablissements[0] : ue.etablissements;
      if (e) etabs.push(e);
    });
    const matieres: { id: string; nom: string; code: string; couleur: string | null }[] = [];
    (u.prof_matieres ?? []).forEach((pm) => {
      const m = Array.isArray(pm.matieres) ? pm.matieres[0] : pm.matieres;
      if (m) matieres.push(m);
    });
    return {
      utilisateur_id: u.id,
      pseudo: u.pseudo,
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      telephone: u.telephone,
      photo_url: u.photo_url,
      actif: u.actif,
      pwd_initial_utilise: u.mot_de_passe_initial_utilise,
      matricule: prof?.matricule ?? null,
      date_embauche: prof?.date_embauche ?? null,
      diplome: prof?.diplome ?? null,
      specialite: prof?.specialite ?? null,
      etablissements: etabs,
      matieres,
      nb_affectations: affCount.get(u.id) ?? 0,
    };
  });
}

export async function getProfFormData() {
  const supabase = createAdminClient();
  const [{ data: etabs }, { data: mats }] = await Promise.all([
    supabase.from("etablissements").select("id, nom").eq("actif", true).order("nom"),
    supabase.from("matieres").select("id, nom, code, couleur, etablissement_id").eq("actif", true).order("ordre"),
  ]);
  return {
    etablissements: etabs ?? [],
    matieres: mats ?? [],
  };
}
