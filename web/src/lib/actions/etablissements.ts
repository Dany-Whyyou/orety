"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, ROLES_DIRECTION } from "@/lib/auth";
import { slugify } from "@/lib/slug";

const CYCLES = ["prescolaire", "primaire", "college", "lycee"] as const;

const schema = z.object({
  nom: z.string().min(2, "Nom trop court").max(200),
  cycle_principal: z.enum(CYCLES),
  cycles_couverts: z.array(z.enum(CYCLES)).min(1, "Au moins un cycle"),
  adresse: z.string().max(500).optional().nullable(),
  telephone: z.string().max(40).optional().nullable(),
  email: z.string().email("Email invalide").max(200).optional().or(z.literal("")).nullable(),
  slogan: z.string().max(200).optional().nullable(),
  couleur_primaire: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Format hexa requis (ex: #1F7A3A)")
    .optional()
    .or(z.literal(""))
    .nullable(),
});

export type EtablissementInput = z.infer<typeof schema>;

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  if (!ROLES_DIRECTION.includes(user.role?.code ?? "")) {
    throw new Error("Permission refusée");
  }
  return user;
}

export async function createEtablissement(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const input = schema.parse(raw);
    const supabase = createAdminClient();

    // Slug unique dans l'organisation
    let slug = slugify(input.nom);
    const { data: existing } = await supabase
      .from("etablissements")
      .select("slug")
      .eq("organisation_id", user.organisation_id!)
      .like("slug", `${slug}%`);
    const taken = new Set(existing?.map((e) => e.slug));
    if (taken.has(slug)) {
      let n = 2;
      while (taken.has(`${slug}-${n}`)) n++;
      slug = `${slug}-${n}`;
    }

    const { error } = await supabase.from("etablissements").insert({
      organisation_id: user.organisation_id!,
      slug,
      nom: input.nom,
      cycle_principal: input.cycle_principal,
      cycles_couverts: input.cycles_couverts,
      adresse: input.adresse || null,
      telephone: input.telephone || null,
      email: input.email || null,
      slogan: input.slogan || null,
      couleur_primaire: input.couleur_primaire || null,
    });
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/etablissements");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { ok: false, error: e.issues[0]?.message ?? "Validation échouée" };
    }
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

export async function updateEtablissement(id: string, raw: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const input = schema.parse(raw);
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("etablissements")
      .update({
        nom: input.nom,
        cycle_principal: input.cycle_principal,
        cycles_couverts: input.cycles_couverts,
        adresse: input.adresse || null,
        telephone: input.telephone || null,
        email: input.email || null,
        slogan: input.slogan || null,
        couleur_primaire: input.couleur_primaire || null,
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/etablissements");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { ok: false, error: e.issues[0]?.message ?? "Validation échouée" };
    }
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

export async function toggleEtablissementActif(id: string, actif: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase.from("etablissements").update({ actif }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/etablissements");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function deleteEtablissement(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("etablissements")
      .update({ archive_le: new Date().toISOString(), actif: false })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/etablissements");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}
