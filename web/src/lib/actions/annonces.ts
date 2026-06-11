"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  titre: z.string().min(1, "Titre requis").max(200),
  contenu: z.string().min(1, "Contenu requis").max(10000),
  cible: z.enum(["organisation", "etablissement", "classe"]),
  etablissement_id: z.string().uuid().optional().or(z.literal("")).nullable(),
  classe_id: z.string().uuid().optional().or(z.literal("")).nullable(),
  expire_le: z.string().optional().or(z.literal("")).nullable(),
  publiee: z.boolean(),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  if (!["super_admin", "admin_org", "secretariat", "directeur_site"].includes(user.role?.code ?? "")) {
    throw new Error("Permission refusée");
  }
  return user;
}

export async function createAnnonce(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    const input = schema.parse(raw);
    const supabase = createAdminClient();

    // Validate target
    if (input.cible === "etablissement" && !input.etablissement_id) {
      return { ok: false, error: "Sélectionnez un établissement" };
    }
    if (input.cible === "classe" && !input.classe_id) {
      return { ok: false, error: "Sélectionnez une classe" };
    }

    const { error } = await supabase.from("annonces").insert({
      organisation_id: user.organisation_id!,
      titre: input.titre,
      contenu: input.contenu,
      cible: input.cible,
      etablissement_id: input.cible === "organisation" ? null : input.etablissement_id || null,
      classe_id: input.cible === "classe" ? input.classe_id : null,
      auteur_id: user.id,
      expire_le: input.expire_le || null,
      publiee: input.publiee,
      publiee_le: input.publiee ? new Date().toISOString() : null,
    });
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/communications");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateAnnonce(id: string, raw: unknown): Promise<ActionResult> {
  try {
    await requireAuth();
    const input = schema.parse(raw);
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("annonces")
      .update({
        titre: input.titre,
        contenu: input.contenu,
        cible: input.cible,
        etablissement_id: input.cible === "organisation" ? null : input.etablissement_id || null,
        classe_id: input.cible === "classe" ? input.classe_id : null,
        expire_le: input.expire_le || null,
        publiee: input.publiee,
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/communications");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function toggleAnnoncePubliee(id: string, publiee: boolean): Promise<ActionResult> {
  try {
    await requireAuth();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("annonces")
      .update({ publiee, publiee_le: publiee ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/communications");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function deleteAnnonce(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    const supabase = createAdminClient();
    const { error } = await supabase.from("annonces").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/communications");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}
