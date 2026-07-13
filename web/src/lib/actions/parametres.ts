"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole, ROLES_DIRECTION } from "@/lib/auth";

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Couleur hexadécimale attendue (#RRGGBB)")
  .optional()
  .or(z.literal(""))
  .nullable();

const schema = z.object({
  nom: z.string().min(2, "Nom requis").max(120),
  devise: z.string().max(200).optional().or(z.literal("")).nullable(),
  adresse: z.string().max(300).optional().or(z.literal("")).nullable(),
  telephone: z.string().max(40).optional().or(z.literal("")).nullable(),
  email: z.string().email("Email invalide").optional().or(z.literal("")).nullable(),
  site_web: z.string().max(200).optional().or(z.literal("")).nullable(),
  logo_url: z.string().max(500).optional().or(z.literal("")).nullable(),
  couleur_primaire: hexColor,
  couleur_secondaire: hexColor,
  couleur_accent: hexColor,
});

export type ParametresActionResult = { ok: true } | { ok: false; error: string };

export async function updateOrganisation(raw: unknown): Promise<ParametresActionResult> {
  try {
    const user = await requireRole(ROLES_DIRECTION);
    if (!user.organisation_id) return { ok: false, error: "Aucune organisation rattachée" };

    const input = schema.parse(raw);
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("organisations")
      .update({
        nom: input.nom,
        devise: input.devise || null,
        adresse: input.adresse || null,
        telephone: input.telephone || null,
        email: input.email || null,
        site_web: input.site_web || null,
        logo_url: input.logo_url || null,
        couleur_primaire: input.couleur_primaire || null,
        couleur_secondaire: input.couleur_secondaire || null,
        couleur_accent: input.couleur_accent || null,
      })
      .eq("id", user.organisation_id);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/parametres");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}
