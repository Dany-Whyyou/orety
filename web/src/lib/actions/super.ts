"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";

const requireSuperAdmin = () => requireRole(["super_admin"]);

const orgSchema = z.object({
  nom: z.string().min(2, "Nom requis").max(120),
  slug: z
    .string()
    .min(2, "Slug requis")
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug : minuscules, chiffres et tirets uniquement"),
  plan: z.enum(["standard", "premium"]).default("standard"),
  ville: z.string().max(80).optional().or(z.literal("")).nullable(),
  couleur_primaire: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Couleur hexadécimale attendue")
    .optional()
    .or(z.literal(""))
    .nullable(),
});

export type SuperActionResult = { ok: true } | { ok: false; error: string };

export async function createOrganisationSuper(raw: unknown): Promise<SuperActionResult> {
  try {
    await requireSuperAdmin();
    const input = orgSchema.parse(raw);
    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("organisations")
      .select("id")
      .eq("slug", input.slug)
      .maybeSingle();
    if (existing) return { ok: false, error: "Ce slug est déjà utilisé" };

    const { error } = await supabase.from("organisations").insert({
      nom: input.nom,
      slug: input.slug,
      plan: input.plan,
      ville: input.ville || null,
      couleur_primaire: input.couleur_primaire || null,
      actif: true,
    });
    if (error) return { ok: false, error: error.message };

    revalidatePath("/super");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function toggleOrganisationActive(
  id: string,
  actif: boolean
): Promise<SuperActionResult> {
  try {
    await requireSuperAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase.from("organisations").update({ actif }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/super");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function toggleUtilisateurSystemeActif(
  id: string,
  actif: boolean
): Promise<SuperActionResult> {
  try {
    const moi = await requireSuperAdmin();
    if (id === moi.id) return { ok: false, error: "Impossible de désactiver votre propre compte" };
    const supabase = createAdminClient();
    const { error } = await supabase.from("utilisateurs").update({ actif }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/super/utilisateurs-systeme");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}
