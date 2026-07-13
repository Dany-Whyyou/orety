"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertOwned } from "@/lib/authz";
import { getCurrentUser, ROLES_DIRECTION } from "@/lib/auth";
import {
  computeBulletinsPourPeriode,
  computeBulletinsAnnuels,
  generateAppreciation,
} from "@/lib/bulletin/engine";

const generateSchema = z.object({
  classe_id: z.string().uuid(),
  periode_id: z.string().uuid().nullable(),
  est_annuel: z.boolean(),
  etablissement_id: z.string().uuid().optional().nullable(),
  annee_scolaire_id: z.string().uuid().optional().nullable(),
});

const updateSchema = z.object({
  moyenne_generale: z.number().nullable(),
  rang: z.number().int().nullable(),
  effectif_classe: z.number().int().nullable(),
  appreciation_generale: z.string().optional().or(z.literal("")).nullable(),
  decision_conseil: z.string().optional().or(z.literal("")).nullable(),
});

const updateMatiereSchema = z.object({
  moyenne: z.number().nullable(),
  rang: z.number().int().nullable(),
  appreciation: z.string().optional().or(z.literal("")).nullable(),
});

export type ActionResult =
  | { ok: true; generated?: number; id?: string }
  | { ok: false; error: string };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  if (!ROLES_DIRECTION.includes(user.role?.code ?? "")) {
    throw new Error("Permission refusée");
  }
  return user;
}

/** Génère (ou régénère) les bulletins d'une classe pour une période donnée, ou annuel. */
export async function generateBulletinsClasse(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const input = generateSchema.parse(raw);
    await assertOwned(user, "classes", input.classe_id);
    const supabase = createAdminClient();

    let computed;
    if (input.est_annuel) {
      if (!input.etablissement_id || !input.annee_scolaire_id) {
        return { ok: false, error: "Établissement et année requis pour le bulletin annuel" };
      }
      computed = await computeBulletinsAnnuels(
        input.classe_id,
        input.annee_scolaire_id,
        input.etablissement_id
      );
    } else {
      if (!input.periode_id) {
        return { ok: false, error: "Période requise" };
      }
      computed = await computeBulletinsPourPeriode(input.classe_id, input.periode_id);
    }

    if (computed.length === 0) {
      return { ok: false, error: "Aucun élève inscrit dans cette classe" };
    }

    let nbGenerated = 0;

    for (const c of computed) {
      // Régénération : l'ancien bulletin est archivé (conformité), jamais supprimé
      await supabase
        .from("bulletins")
        .update({ archive_le: new Date().toISOString() })
        .is("archive_le", null)
        .eq("inscription_id", c.inscription_id)
        .match(
          input.est_annuel
            ? { est_annuel: true }
            : { periode_id: input.periode_id, est_annuel: false }
        );

      // Insert bulletin
      const { data: bulletin, error: bulletinErr } = await supabase
        .from("bulletins")
        .insert({
          inscription_id: c.inscription_id,
          periode_id: input.est_annuel ? null : input.periode_id,
          est_annuel: input.est_annuel,
          moyenne_generale: c.moyenne_generale,
          moyenne_classe: c.moyenne_classe,
          rang: c.rang,
          effectif_classe: c.effectif_classe,
          appreciation_generale: generateAppreciation(c.moyenne_generale),
          publie: false,
        })
        .select("id")
        .single();
      // Ne jamais avaler l'erreur : l'ancien bulletin vient d'être archivé,
      // échouer ici sans le dire ferait disparaître le bulletin de la liste.
      if (bulletinErr) {
        return {
          ok: false,
          error: `Génération interrompue (${nbGenerated} bulletin(s) créé(s)) : ${bulletinErr.message}`,
        };
      }

      // Insert matières
      const matieresToInsert = c.matieres.map((m) => ({
        bulletin_id: bulletin.id,
        matiere_id: m.matiere_id,
        coefficient: m.coefficient,
        moyenne: m.moyenne,
        moyenne_classe: m.moyenne_classe,
        rang: m.rang,
        appreciation: null,
        prof_utilisateur_id: m.prof_utilisateur_id,
      }));
      if (matieresToInsert.length > 0) {
        await supabase.from("bulletin_matiere").insert(matieresToInsert);
      }
      nbGenerated += 1;
    }

    revalidatePath("/admin/bulletins");
    revalidatePath("/admin");
    return { ok: true, generated: nbGenerated };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function togglePublieBulletin(id: string, publie: boolean): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await assertOwned(user, "bulletins", id);
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("bulletins")
      .update({ publie, publie_le: publie ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/bulletins");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function publishBulletinsLot(
  classe_id: string,
  periode_id: string | null
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await assertOwned(user, "classes", classe_id);
    const supabase = createAdminClient();
    const query = supabase
      .from("bulletins")
      .update({ publie: true, publie_le: new Date().toISOString() })
      .eq("publie", false);
    // Filter by inscriptions in classe
    const { data: inscIds } = await supabase
      .from("inscriptions")
      .select("id")
      .eq("classe_id", classe_id)
      .eq("statut", "inscrit");
    const ids = (inscIds ?? []).map((i) => i.id);
    if (ids.length === 0) return { ok: false, error: "Aucune inscription dans cette classe" };
    const q2 = query.in("inscription_id", ids);
    const q3 = periode_id ? q2.eq("periode_id", periode_id) : q2.eq("est_annuel", true);
    const { error } = await q3;
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/bulletins");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function deleteBulletin(id: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await assertOwned(user, "bulletins", id);
    const supabase = createAdminClient();
    const { error } = await supabase.from("bulletins").update({ archive_le: new Date().toISOString() }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/bulletins");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateBulletinAppreciation(
  id: string,
  raw: unknown
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await assertOwned(user, "bulletins", id);
    const input = updateSchema.parse(raw);
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("bulletins")
      .update({
        moyenne_generale: input.moyenne_generale,
        rang: input.rang,
        effectif_classe: input.effectif_classe,
        appreciation_generale: input.appreciation_generale || null,
        decision_conseil: input.decision_conseil || null,
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/bulletins");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateBulletinMatiere(
  id: string,
  raw: unknown
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await assertOwned(user, "bulletin_matiere", id);
    const input = updateMatiereSchema.parse(raw);
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("bulletin_matiere")
      .update({
        moyenne: input.moyenne,
        rang: input.rang,
        appreciation: input.appreciation || null,
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/bulletins");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

/**
 * Enregistre le PDF généré côté client dans le Storage (bucket `bulletins`)
 * et renseigne `pdf_url` sur le bulletin.
 */
export async function enregistrerBulletinPdf(
  bulletinId: string,
  pdfBase64: string,
  filename: string
): Promise<ActionResult & { url?: string }> {
  try {
    const user = await requireAdmin();
    await assertOwned(user, "bulletins", bulletinId);
    if (!pdfBase64 || pdfBase64.length > 7_000_000) {
      return { ok: false, error: "PDF invalide ou trop volumineux" };
    }
    const supabase = createAdminClient();

    const chemin = `${bulletinId}/${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const contenu = Buffer.from(pdfBase64, "base64");

    const { error: upErr } = await supabase.storage
      .from("bulletins")
      .upload(chemin, contenu, { contentType: "application/pdf", upsert: true });
    if (upErr) return { ok: false, error: upErr.message };

    const { data: pub } = supabase.storage.from("bulletins").getPublicUrl(chemin);

    const { error } = await supabase
      .from("bulletins")
      .update({ pdf_url: pub.publicUrl })
      .eq("id", bulletinId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/bulletins");
    return { ok: true, url: pub.publicUrl };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}
