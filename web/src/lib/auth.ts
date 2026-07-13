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

/**
 * Matrice de rôles unique pour le dashboard web.
 * - direction : gère la structure scolaire (établissements, classes, profs, bulletins…)
 * - administratifs : direction + secrétariat (inscriptions, parents, communications)
 */
export const ROLES_DIRECTION: readonly string[] = ["super_admin", "admin_org", "directeur_site"];
export const ROLES_ADMINISTRATIFS: readonly string[] = [...ROLES_DIRECTION, "secretariat"];

/** Lève si l'utilisateur n'est pas authentifié ou n'a pas l'un des rôles requis. */
export async function requireRole(roles: readonly string[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  if (!roles.includes(user.role?.code ?? "")) {
    throw new Error("Permission refusée");
  }
  return user;
}

/**
 * Périmètre établissement de l'utilisateur courant.
 * null = accès à tous les sites de l'organisation ; sinon, id de l'unique
 * établissement autorisé (cas du directeur_site).
 */
export async function getEtabScope(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.etablissement_scope_id ?? null;
}

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
