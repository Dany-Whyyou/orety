import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type CurrentUser = {
  id: string;
  pseudo: string;
  nom: string | null;
  prenom: string | null;
  photo_url: string | null;
  email: string | null;
  role: { code: string; libelle: string; niveau_hierarchique: number } | null;
  organisation_id: string | null;
  etablissement_scope_id: string | null;
};

/** Convertit un pseudo en email technique interne pour Supabase Auth. */
export function pseudoToEmail(pseudo: string) {
  return `${pseudo.trim().toLowerCase()}@orety.internal`;
}

/** Retourne l'utilisateur courant ou null, avec son rôle. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("utilisateurs")
    .select(
      "id, pseudo, nom, prenom, photo_url, email, organisation_id, etablissement_scope_id, roles:role_id ( code, libelle, niveau_hierarchique )"
    )
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  const role = Array.isArray(data.roles) ? data.roles[0] : data.roles;

  return {
    id: data.id,
    pseudo: data.pseudo,
    nom: data.nom,
    prenom: data.prenom,
    photo_url: data.photo_url,
    email: data.email,
    role: role
      ? { code: role.code, libelle: role.libelle, niveau_hierarchique: role.niveau_hierarchique }
      : null,
    organisation_id: data.organisation_id,
    etablissement_scope_id: data.etablissement_scope_id,
  };
}
