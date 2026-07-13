"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, ROLES_DIRECTION } from "@/lib/auth";

const typeSchema = z.object({
  etablissement_id: z.string().uuid(),
  code: z.string().min(1).max(20),
  libelle: z.string().min(1).max(80),
  poids_defaut: z.number().min(0).max(20),
  couleur: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$|^$/)
    .optional()
    .or(z.literal(""))
    .nullable(),
  ordre: z.number().int().min(0),
});

const evalSchema = z.object({
  affectation_id: z.string().uuid(),
  type_evaluation_id: z.string().uuid(),
  periode_id: z.string().uuid(),
  titre: z.string().min(1).max(200),
  description: z.string().max(1000).optional().or(z.literal("")).nullable(),
  date_evaluation: z.string().min(10),
  bareme: z.number().min(1).max(100),
  poids: z.number().min(0).max(20),
  autorise_bonus: z.boolean(),
  bonus_max: z.number().min(0).max(50).nullable(),
});

const noteSchema = z.object({
  evaluation_id: z.string().uuid(),
  eleve_id: z.string().uuid(),
  note: z.number().nullable(),
  bonus: z.number().min(0),
  absent: z.boolean(),
  commentaire: z.string().max(500).optional().or(z.literal("")).nullable(),
});

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  if (![...ROLES_DIRECTION, "prof"].includes(user.role?.code ?? "")) {
    throw new Error("Permission refusée");
  }
  return user;
}

/* === Types d'évaluation === */

export async function createTypeEvaluation(raw: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const input = typeSchema.parse(raw);
    const supabase = createAdminClient();
    const { error } = await supabase.from("types_evaluation").insert({
      etablissement_id: input.etablissement_id,
      code: input.code.toUpperCase(),
      libelle: input.libelle,
      poids_defaut: input.poids_defaut,
      couleur: input.couleur || null,
      ordre: input.ordre,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/evaluations");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateTypeEvaluation(id: string, raw: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const input = typeSchema.parse(raw);
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("types_evaluation")
      .update({
        code: input.code.toUpperCase(),
        libelle: input.libelle,
        poids_defaut: input.poids_defaut,
        couleur: input.couleur || null,
        ordre: input.ordre,
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/evaluations");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function deleteTypeEvaluation(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("types_evaluation")
      .update({ archive_le: new Date().toISOString(), actif: false })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/evaluations");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

const DEFAULT_TYPES: Array<{ code: string; libelle: string; poids_defaut: number; couleur: string; ordre: number }> = [
  { code: "INTERRO", libelle: "Interrogation", poids_defaut: 1, couleur: "#60A5FA", ordre: 1 },
  { code: "DEVOIR", libelle: "Devoir surveillé", poids_defaut: 2, couleur: "#1F7A3A", ordre: 2 },
  { code: "COMPO", libelle: "Composition", poids_defaut: 3, couleur: "#EF4444", ordre: 3 },
  { code: "ORAL", libelle: "Oral", poids_defaut: 1, couleur: "#F59E0B", ordre: 4 },
  { code: "PROJET", libelle: "Projet", poids_defaut: 2, couleur: "#8B5CF6", ordre: 5 },
];

export async function generateDefaultTypes(etablissement_id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from("types_evaluation")
      .select("code")
      .eq("etablissement_id", etablissement_id);
    const existingCodes = new Set(existing?.map((t) => t.code));
    const toInsert = DEFAULT_TYPES.filter((t) => !existingCodes.has(t.code)).map((t) => ({
      ...t,
      etablissement_id,
    }));
    if (toInsert.length === 0) return { ok: false, error: "Tous les types standards existent déjà" };
    const { error } = await supabase.from("types_evaluation").insert(toInsert);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/evaluations");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

/* === Évaluations === */

export async function createEvaluation(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const input = evalSchema.parse(raw);
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("evaluations")
      .insert({
        affectation_id: input.affectation_id,
        type_evaluation_id: input.type_evaluation_id,
        periode_id: input.periode_id,
        titre: input.titre,
        description: input.description || null,
        date_evaluation: input.date_evaluation,
        bareme: input.bareme,
        poids: input.poids,
        autorise_bonus: input.autorise_bonus,
        bonus_max: input.autorise_bonus ? input.bonus_max : null,
        cree_par: user.id,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/evaluations");
    revalidatePath("/admin");
    return { ok: true, id: data.id };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateEvaluation(id: string, raw: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const input = evalSchema.parse(raw);
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("evaluations")
      .update({
        affectation_id: input.affectation_id,
        type_evaluation_id: input.type_evaluation_id,
        periode_id: input.periode_id,
        titre: input.titre,
        description: input.description || null,
        date_evaluation: input.date_evaluation,
        bareme: input.bareme,
        poids: input.poids,
        autorise_bonus: input.autorise_bonus,
        bonus_max: input.autorise_bonus ? input.bonus_max : null,
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/evaluations");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function togglePubliee(id: string, publiee: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("evaluations")
      .update({
        publiee,
        publiee_le: publiee ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/evaluations");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function deleteEvaluation(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase.from("evaluations").update({ archive_le: new Date().toISOString() }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/evaluations");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

/* === Notes === */

export async function saveNote(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const input = noteSchema.parse(raw);
    const supabase = createAdminClient();

    // Upsert-style: check if exists
    const { data: existing } = await supabase
      .from("notes")
      .select("id")
      .eq("evaluation_id", input.evaluation_id)
      .eq("eleve_id", input.eleve_id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("notes")
        .update({
          note: input.absent ? null : input.note,
          bonus: input.bonus,
          absent: input.absent,
          commentaire: input.commentaire || null,
          saisie_par: user.id,
          saisie_le: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) return { ok: false, error: error.message };
      revalidatePath("/admin/evaluations");
      return { ok: true, id: existing.id };
    }

    const { data, error } = await supabase
      .from("notes")
      .insert({
        evaluation_id: input.evaluation_id,
        eleve_id: input.eleve_id,
        note: input.absent ? null : input.note,
        bonus: input.bonus,
        absent: input.absent,
        commentaire: input.commentaire || null,
        saisie_par: user.id,
        saisie_le: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/evaluations");
    return { ok: true, id: data.id };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function deleteNote(): Promise<ActionResult> {
  // Conformité : les notes sont un registre officiel, jamais supprimées.
  // Pour corriger une note, la ressaisir via saveNote.
  return { ok: false, error: "Les notes ne peuvent pas être supprimées (registre officiel)" };
}

export async function getNotesForEvaluationRPC(evaluationId: string) {
  // Exposed wrapper to reload notes from the client (after mutations)
  const { getNotesForEvaluation } = await import("@/lib/queries/evaluations");
  return getNotesForEvaluation(evaluationId);
}
