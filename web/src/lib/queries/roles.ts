import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type PermissionItem = {
  code: string;
  domaine: string;
  libelle: string;
  description: string | null;
  portee: string;
};

export type RoleItem = {
  id: string;
  organisation_id: string | null;
  code: string;
  libelle: string;
  description: string | null;
  is_system: boolean;
  niveau_hierarchique: number;
  couleur: string | null;
  permissions: string[]; // permission codes
  nb_utilisateurs: number;
};

export async function getPermissions(): Promise<PermissionItem[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("permissions")
    .select("code, domaine, libelle, description, portee")
    .order("domaine")
    .order("code");
  return (data ?? []) as PermissionItem[];
}

export async function getRoles(): Promise<RoleItem[]> {
  const supabase = createAdminClient();

  const { data: roles } = await supabase
    .from("roles")
    .select(
      "id, organisation_id, code, libelle, description, is_system, niveau_hierarchique, couleur, role_permissions(permission_code)"
    )
    .order("niveau_hierarchique", { ascending: false });

  if (!roles) return [];

  const roleIds = roles.map((r) => r.id);
  const { data: userCounts } = await supabase
    .from("utilisateurs")
    .select("role_id")
    .in("role_id", roleIds.length ? roleIds : ["_none_"]);
  const counts = new Map<string, number>();
  (userCounts ?? []).forEach((u) => {
    counts.set(u.role_id, (counts.get(u.role_id) ?? 0) + 1);
  });

  return roles.map((r) => {
    const rec = r as {
      id: string;
      organisation_id: string | null;
      code: string;
      libelle: string;
      description: string | null;
      is_system: boolean;
      niveau_hierarchique: number;
      couleur: string | null;
      role_permissions: Array<{ permission_code: string }> | null;
    };
    return {
      id: rec.id,
      organisation_id: rec.organisation_id,
      code: rec.code,
      libelle: rec.libelle,
      description: rec.description,
      is_system: rec.is_system,
      niveau_hierarchique: rec.niveau_hierarchique,
      couleur: rec.couleur,
      permissions: (rec.role_permissions ?? []).map((p) => p.permission_code),
      nb_utilisateurs: counts.get(rec.id) ?? 0,
    };
  });
}
