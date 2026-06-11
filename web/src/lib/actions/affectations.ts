"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  utilisateur_id: z.string().uuid(),
  classe_id: z.string().uuid(),
  annee_scolaire_id: z.string().uuid(),
  matiere_id: z.string().uuid().nullable(),
  heures_semaine: z.number().min(0).max(50).nullable(),
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

export async function createAffectation(raw: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const input = schema.parse(raw);
    const supabase = createAdminClient();
    const { error } = await supabase.from("affectations").insert({
      utilisateur_id: input.utilisateur_id,
      classe_id: input.classe_id,
      annee_scolaire_id: input.annee_scolaire_id,
      matiere_id: input.matiere_id,
      heures_semaine: input.heures_semaine,
    });
    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "Cette affectation existe déjà" };
      }
      return { ok: false, error: error.message };
    }
    revalidatePath("/admin/affectations");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateAffectation(id: string, raw: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const input = schema.parse(raw);
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("affectations")
      .update({
        utilisateur_id: input.utilisateur_id,
        classe_id: input.classe_id,
        annee_scolaire_id: input.annee_scolaire_id,
        matiere_id: input.matiere_id,
        heures_semaine: input.heures_semaine,
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/affectations");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function deleteAffectation(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase.from("affectations").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/affectations");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}
