import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type ParentListItem = {
  utilisateur_id: string;
  pseudo: string;
  nom: string | null;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  actif: boolean;
  pwd_initial_utilise: boolean;
  pin_defined: boolean;
  dernier_login: string | null;
  nb_enfants: number;
  enfants: { id: string; nom: string; prenom: string }[];
};

export async function getParents(): Promise<ParentListItem[]> {
  const supabase = createAdminClient();

  const { data: roleData } = await supabase
    .from("roles")
    .select("id")
    .eq("code", "parent")
    .eq("is_system", true)
    .single();
  if (!roleData) return [];

  const { data: usersData, error } = await supabase
    .from("utilisateurs")
    .select(
      "id, pseudo, nom, prenom, email, telephone, actif, mot_de_passe_initial_utilise, pin_hash, dernier_login"
    )
    .eq("role_id", roleData.id)
    .order("pseudo");

  if (error) {
    console.error("getParents:", error);
    return [];
  }

  const pseudos = (usersData ?? []).map((u) => u.pseudo);
  const { data: enfantsData } = await supabase
    .from("eleves")
    .select("id, nom, prenom, cle_parentale")
    .in("cle_parentale", pseudos.length ? pseudos : ["_none_"]);

  const byPseudo = new Map<string, { id: string; nom: string; prenom: string }[]>();
  (enfantsData ?? []).forEach((e) => {
    const list = byPseudo.get(e.cle_parentale) ?? [];
    list.push({ id: e.id, nom: e.nom, prenom: e.prenom });
    byPseudo.set(e.cle_parentale, list);
  });

  return (usersData ?? []).map((u) => {
    const enfants = byPseudo.get(u.pseudo) ?? [];
    return {
      utilisateur_id: u.id,
      pseudo: u.pseudo,
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      telephone: u.telephone,
      actif: u.actif,
      pwd_initial_utilise: u.mot_de_passe_initial_utilise,
      pin_defined: u.pin_hash !== null,
      dernier_login: u.dernier_login,
      nb_enfants: enfants.length,
      enfants,
    };
  });
}

/** Light list used by the élève create/edit dialog (parent picker). */
export async function getParentsForPicker(): Promise<
  { utilisateur_id: string; pseudo: string; nom: string | null; prenom: string | null; nb_enfants: number }[]
> {
  const supabase = createAdminClient();
  const { data: roleData } = await supabase
    .from("roles")
    .select("id")
    .eq("code", "parent")
    .eq("is_system", true)
    .single();
  if (!roleData) return [];

  const { data } = await supabase
    .from("utilisateurs")
    .select("id, pseudo, nom, prenom, eleves(id)")
    .eq("role_id", roleData.id)
    .eq("actif", true)
    .order("pseudo");

  return (data ?? []).map((u: { id: string; pseudo: string; nom: string | null; prenom: string | null; eleves: { id: string }[] | null }) => ({
    utilisateur_id: u.id,
    pseudo: u.pseudo,
    nom: u.nom,
    prenom: u.prenom,
    nb_enfants: u.eleves?.length ?? 0,
  }));
}
