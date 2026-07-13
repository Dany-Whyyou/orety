"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertOwned, messageErreur } from "@/lib/authz";
import { getCurrentUser, ROLES_DIRECTION } from "@/lib/auth";

const schema = z.object({
  annee_scolaire_id: z.string().uuid(),
  niveau_id: z.string().uuid(),
  nom: z.string().min(1).max(80),
  code: z.string().max(40).optional().or(z.literal("")).nullable(),
  salle: z.string().max(40).optional().or(z.literal("")).nullable(),
  capacite_max: z.number().int().min(1).max(500).nullable(),
  titulaire_utilisateur_id: z.string().uuid().nullable(),
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

export async function createClasse(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const input = schema.parse(raw);
    await assertOwned(user, "niveaux", input.niveau_id);
    await assertOwned(user, "annees_scolaires", input.annee_scolaire_id);
    if (input.titulaire_utilisateur_id) await assertOwned(user, "utilisateurs", input.titulaire_utilisateur_id);
    const supabase = createAdminClient();
    const { error } = await supabase.from("classes").insert({
      annee_scolaire_id: input.annee_scolaire_id,
      niveau_id: input.niveau_id,
      nom: input.nom,
      code: input.code || null,
      salle: input.salle || null,
      capacite_max: input.capacite_max,
      titulaire_utilisateur_id: input.titulaire_utilisateur_id,
    });
    if (error) return { ok: false, error: messageErreur(error) };
    revalidatePath("/admin/classes");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateClasse(id: string, raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await assertOwned(user, "classes", id);
    const input = schema.parse(raw);
    await assertOwned(user, "niveaux", input.niveau_id);
    await assertOwned(user, "annees_scolaires", input.annee_scolaire_id);
    if (input.titulaire_utilisateur_id) await assertOwned(user, "utilisateurs", input.titulaire_utilisateur_id);
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("classes")
      .update({
        annee_scolaire_id: input.annee_scolaire_id,
        niveau_id: input.niveau_id,
        nom: input.nom,
        code: input.code || null,
        salle: input.salle || null,
        capacite_max: input.capacite_max,
        titulaire_utilisateur_id: input.titulaire_utilisateur_id,
      })
      .eq("id", id);
    if (error) return { ok: false, error: messageErreur(error) };
    revalidatePath("/admin/classes");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function deleteClasse(id: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await assertOwned(user, "classes", id);
    const supabase = createAdminClient();
    const { error } = await supabase.from("classes").update({ archive_le: new Date().toISOString() }).eq("id", id);
    if (error) return { ok: false, error: messageErreur(error) };
    revalidatePath("/admin/classes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}
