"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, ROLES_DIRECTION } from "@/lib/auth";

const schema = z.object({
  etablissement_id: z.string().uuid(),
  code: z.string().min(1).max(20),
  nom: z.string().min(1).max(80),
  couleur: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$|^$/, "Format hexa")
    .optional()
    .or(z.literal("")),
  ordre: z.number().int().min(0).max(500),
});

const coefSchema = z.object({
  matiere_id: z.string().uuid(),
  niveau_id: z.string().uuid(),
  coefficient: z.number().min(0).max(20),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  if (!ROLES_DIRECTION.includes(user.role?.code ?? "")) {
    throw new Error("Permission refusée");
  }
  return user;
}

export async function createMatiere(raw: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const input = schema.parse(raw);
    const supabase = createAdminClient();
    const { error } = await supabase.from("matieres").insert({
      etablissement_id: input.etablissement_id,
      code: input.code.toUpperCase(),
      nom: input.nom,
      couleur: input.couleur || null,
      ordre: input.ordre,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/matieres");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateMatiere(id: string, raw: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const input = schema.parse(raw);
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("matieres")
      .update({
        code: input.code.toUpperCase(),
        nom: input.nom,
        couleur: input.couleur || null,
        ordre: input.ordre,
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/matieres");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function deleteMatiere(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase.from("matieres").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/matieres");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function setCoefficient(raw: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const input = coefSchema.parse(raw);
    const supabase = createAdminClient();

    if (input.coefficient === 0) {
      await supabase
        .from("coefficients_matiere")
        .delete()
        .eq("matiere_id", input.matiere_id)
        .eq("niveau_id", input.niveau_id);
    } else {
      const { data: existing } = await supabase
        .from("coefficients_matiere")
        .select("id")
        .eq("matiere_id", input.matiere_id)
        .eq("niveau_id", input.niveau_id)
        .maybeSingle();
      if (existing) {
        await supabase
          .from("coefficients_matiere")
          .update({ coefficient: input.coefficient })
          .eq("id", existing.id);
      } else {
        await supabase.from("coefficients_matiere").insert(input);
      }
    }
    revalidatePath("/admin/matieres");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}
