"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertOwned, messageErreur } from "@/lib/authz";
import { getCurrentUser, ROLES_ADMINISTRATIFS } from "@/lib/auth";

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
  if (!ROLES_ADMINISTRATIFS.includes(user.role?.code ?? "")) {
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
    if (input.etablissement_id) await assertOwned(user, "etablissements", input.etablissement_id);
    if (input.classe_id) await assertOwned(user, "classes", input.classe_id);

    const { data: annonce, error } = await supabase
      .from("annonces")
      .insert({
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
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: messageErreur(error) };

    if (input.publiee && annonce) {
      await notifierAnnonce(annonce.id, user.organisation_id!, input.titre, user.id);
    }

    revalidatePath("/admin/communications");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateAnnonce(id: string, raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    await assertOwned(user, "annonces", id);
    const input = schema.parse(raw);
    if (input.etablissement_id) await assertOwned(user, "etablissements", input.etablissement_id);
    if (input.classe_id) await assertOwned(user, "classes", input.classe_id);
    const supabase = createAdminClient();

    const { data: avant } = await supabase
      .from("annonces")
      .select("publiee")
      .eq("id", id)
      .single();

    const { data: annonce, error } = await supabase
      .from("annonces")
      .update({
        titre: input.titre,
        contenu: input.contenu,
        cible: input.cible,
        etablissement_id: input.cible === "organisation" ? null : input.etablissement_id || null,
        classe_id: input.cible === "classe" ? input.classe_id : null,
        expire_le: input.expire_le || null,
        publiee: input.publiee,
        // Ne pas écraser la date de première publication à chaque édition
        publiee_le: input.publiee
          ? avant?.publiee
            ? undefined
            : new Date().toISOString()
          : null,
      })
      .eq("id", id)
      .select("id, titre, organisation_id")
      .single();
    if (error) return { ok: false, error: messageErreur(error) };

    // Passage brouillon → publiée via le formulaire d'édition : on notifie aussi
    if (input.publiee && avant && !avant.publiee && annonce) {
      await notifierAnnonce(annonce.id, annonce.organisation_id, annonce.titre, user.id);
    }

    revalidatePath("/admin/communications");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function toggleAnnoncePubliee(id: string, publiee: boolean): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    await assertOwned(user, "annonces", id);
    const supabase = createAdminClient();
    const { data: annonce, error } = await supabase
      .from("annonces")
      .update({ publiee, publiee_le: publiee ? new Date().toISOString() : null })
      .eq("id", id)
      .select("id, titre, organisation_id")
      .single();
    if (error) return { ok: false, error: messageErreur(error) };

    if (publiee && annonce) {
      await notifierAnnonce(annonce.id, annonce.organisation_id, annonce.titre, user.id);
    }

    revalidatePath("/admin/communications");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

/**
 * Notifie le personnel de l'organisation (hors parents, qui consultent les
 * annonces directement dans l'app mobile). Idempotent par annonce.
 */
async function notifierAnnonce(
  annonceId: string,
  organisationId: string,
  titre: string,
  auteurId: string
) {
  const supabase = createAdminClient();

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("type", "annonce")
    .contains("donnees", { annonce_id: annonceId });
  if ((count ?? 0) > 0) return;

  const { data: destinataires } = await supabase
    .from("utilisateurs")
    .select("id, roles:role_id!inner(code)")
    .eq("organisation_id", organisationId)
    .eq("actif", true)
    .neq("id", auteurId)
    .neq("roles.code", "parent");
  if (!destinataires?.length) return;

  await supabase.from("notifications").insert(
    destinataires.map((d) => ({
      destinataire_id: d.id,
      type: "annonce" as const,
      titre: `Annonce : ${titre}`,
      url_action: "/admin/communications",
      donnees: { annonce_id: annonceId },
    }))
  );
}

export async function deleteAnnonce(id: string): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    await assertOwned(user, "annonces", id);
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("annonces")
      .update({ archive_le: new Date().toISOString(), publiee: false })
      .eq("id", id);
    if (error) return { ok: false, error: messageErreur(error) };
    revalidatePath("/admin/communications");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}
