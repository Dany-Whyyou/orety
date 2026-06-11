"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  code: z
    .string()
    .min(2, "Code trop court")
    .max(40)
    .regex(/^[a-z0-9_]+$/, "Lettres minuscules, chiffres, _ uniquement"),
  libelle: z.string().min(1).max(100),
  description: z.string().max(500).optional().or(z.literal("")).nullable(),
  niveau_hierarchique: z.number().int().min(0).max(95),
  couleur: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$|^$/)
    .optional()
    .or(z.literal(""))
    .nullable(),
  permissions: z.array(z.string()),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  if (!["super_admin", "admin_org"].includes(user.role?.code ?? "")) {
    throw new Error("Permission refusée");
  }
  return user;
}

export async function createRole(raw: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = schema.parse(raw);
    if (input.niveau_hierarchique >= (admin.role?.niveau_hierarchique ?? 0)) {
      return {
        ok: false,
        error: "Vous ne pouvez pas créer un rôle de niveau supérieur ou égal au vôtre",
      };
    }
    const supabase = createAdminClient();

    // Ensure code is unique within org
    const { data: existing } = await supabase
      .from("roles")
      .select("id")
      .eq("code", input.code)
      .eq("organisation_id", admin.organisation_id!)
      .maybeSingle();
    if (existing) return { ok: false, error: "Ce code existe déjà" };

    const { data: role, error } = await supabase
      .from("roles")
      .insert({
        organisation_id: admin.organisation_id!,
        code: input.code,
        libelle: input.libelle,
        description: input.description || null,
        is_system: false,
        niveau_hierarchique: input.niveau_hierarchique,
        couleur: input.couleur || null,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };

    if (input.permissions.length > 0) {
      const { error: pErr } = await supabase.from("role_permissions").insert(
        input.permissions.map((code) => ({
          role_id: role.id,
          permission_code: code,
          accordee_par: admin.id,
        }))
      );
      if (pErr) return { ok: false, error: pErr.message };
    }

    revalidatePath("/admin/parametres/roles");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateRole(id: string, raw: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const input = schema.parse(raw);
    const supabase = createAdminClient();

    // Fetch role to verify not system
    const { data: existing } = await supabase
      .from("roles")
      .select("is_system, niveau_hierarchique")
      .eq("id", id)
      .single();
    if (!existing) return { ok: false, error: "Rôle introuvable" };
    if (existing.is_system) return { ok: false, error: "Rôle système : non modifiable" };
    if (input.niveau_hierarchique >= (admin.role?.niveau_hierarchique ?? 0)) {
      return { ok: false, error: "Niveau hiérarchique trop élevé" };
    }

    const { error } = await supabase
      .from("roles")
      .update({
        libelle: input.libelle,
        description: input.description || null,
        niveau_hierarchique: input.niveau_hierarchique,
        couleur: input.couleur || null,
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };

    // Replace permissions
    await supabase.from("role_permissions").delete().eq("role_id", id);
    if (input.permissions.length > 0) {
      await supabase.from("role_permissions").insert(
        input.permissions.map((code) => ({
          role_id: id,
          permission_code: code,
          accordee_par: admin.id,
        }))
      );
    }

    revalidatePath("/admin/parametres/roles");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function deleteRole(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { data: role } = await supabase
      .from("roles")
      .select("is_system")
      .eq("id", id)
      .single();
    if (!role) return { ok: false, error: "Rôle introuvable" };
    if (role.is_system) return { ok: false, error: "Rôle système : non supprimable" };

    // Prevent delete if users assigned
    const { count } = await supabase
      .from("utilisateurs")
      .select("*", { count: "exact", head: true })
      .eq("role_id", id);
    if ((count ?? 0) > 0) {
      return { ok: false, error: `${count} utilisateur(s) ont encore ce rôle` };
    }

    const { error } = await supabase.from("roles").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/parametres/roles");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}
