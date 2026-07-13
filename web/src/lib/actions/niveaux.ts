"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, ROLES_DIRECTION } from "@/lib/auth";

const CYCLES = ["prescolaire", "primaire", "college", "lycee"] as const;

const schema = z.object({
  etablissement_id: z.string().uuid(),
  code: z.string().min(1).max(20),
  libelle: z.string().min(1).max(80),
  cycle: z.enum(CYCLES),
  ordre: z.number().int().min(0).max(100),
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

export async function createNiveau(raw: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const input = schema.parse(raw);
    const supabase = createAdminClient();
    const { error } = await supabase.from("niveaux").insert(input);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/niveaux");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateNiveau(id: string, raw: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const input = schema.parse(raw);
    const supabase = createAdminClient();
    const { error } = await supabase.from("niveaux").update(input).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/niveaux");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function deleteNiveau(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase.from("niveaux").update({ archive_le: new Date().toISOString() }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/niveaux");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

const CYCLE_PRESETS: Record<(typeof CYCLES)[number], { code: string; libelle: string; ordre: number }[]> = {
  prescolaire: [
    { code: "TPS", libelle: "Très petite section", ordre: 1 },
    { code: "PS", libelle: "Petite section", ordre: 2 },
    { code: "MS", libelle: "Moyenne section", ordre: 3 },
    { code: "GS", libelle: "Grande section", ordre: 4 },
  ],
  primaire: [
    { code: "CP", libelle: "Cours préparatoire", ordre: 10 },
    { code: "CE1", libelle: "Cours élémentaire 1", ordre: 11 },
    { code: "CE2", libelle: "Cours élémentaire 2", ordre: 12 },
    { code: "CM1", libelle: "Cours moyen 1", ordre: 13 },
    { code: "CM2", libelle: "Cours moyen 2", ordre: 14 },
  ],
  college: [
    { code: "6EME", libelle: "6ème", ordre: 20 },
    { code: "5EME", libelle: "5ème", ordre: 21 },
    { code: "4EME", libelle: "4ème", ordre: 22 },
    { code: "3EME", libelle: "3ème", ordre: 23 },
  ],
  lycee: [
    { code: "2NDE", libelle: "Seconde", ordre: 30 },
    { code: "1ERE", libelle: "Première", ordre: 31 },
    { code: "TERM", libelle: "Terminale", ordre: 32 },
  ],
};

export async function generateNiveauxForCycle(
  etablissement_id: string,
  cycle: (typeof CYCLES)[number]
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const presets = CYCLE_PRESETS[cycle];
    const { data: existing } = await supabase
      .from("niveaux")
      .select("code")
      .eq("etablissement_id", etablissement_id)
      .eq("cycle", cycle);
    const existingCodes = new Set(existing?.map((e) => e.code));
    const toInsert = presets
      .filter((p) => !existingCodes.has(p.code))
      .map((p) => ({ ...p, cycle, etablissement_id }));
    if (toInsert.length === 0) return { ok: false, error: "Tous les niveaux de ce cycle existent déjà" };
    const { error } = await supabase.from("niveaux").insert(toInsert);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/niveaux");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}
