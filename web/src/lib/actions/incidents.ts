"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertOwned, messageErreur } from "@/lib/authz";
import { getCurrentUser, ROLES_ADMINISTRATIFS } from "@/lib/auth";

const schema = z.object({
  eleve_id: z.string().uuid(),
  type: z.enum(["sante", "comportement", "securite", "materiel", "academique", "autre"]),
  gravite: z.enum(["info", "mineur", "moyen", "grave"]),
  titre: z.string().min(2).max(200),
  description: z.string().min(1).max(5000),
  date_incident: z.string().min(10),
  lieu: z.string().max(200).optional().or(z.literal("")).nullable(),
  photos: z.array(z.string().url()).default([]),
  action_prise: z.string().max(2000).optional().or(z.literal("")).nullable(),
  notifie_parent: z.boolean(),
});

const updateSchema = schema.extend({
  statut: z.enum(["signale", "en_cours", "traite", "clos"]),
});

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  if (![...ROLES_ADMINISTRATIFS, "prof"].includes(user.role?.code ?? "")) {
    throw new Error("Permission refusée");
  }
  return user;
}

async function notifyParent(eleveId: string, incidentId: string, titre: string) {
  const supabase = createAdminClient();
  // Find parent via cle_parentale
  const { data: eleve } = await supabase
    .from("eleves")
    .select("cle_parentale, nom, prenom")
    .eq("id", eleveId)
    .single();
  if (!eleve) return;

  const { data: parent } = await supabase
    .from("utilisateurs")
    .select("id")
    .eq("pseudo", eleve.cle_parentale)
    .maybeSingle();
  if (!parent) return;

  await supabase.from("notifications").insert({
    destinataire_id: parent.id,
    type: "incident",
    titre: `Signalement : ${titre}`,
    contenu: `Un signalement concernant ${eleve.prenom} ${eleve.nom} a été émis par l'école.`,
    url_action: `/incidents/${incidentId}`,
    donnees: { incident_id: incidentId, eleve_id: eleveId },
  });
}

export async function createIncident(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    const input = schema.parse(raw);
    const supabase = createAdminClient();

    await assertOwned(user, "eleves", input.eleve_id);
    const { data: eleve } = await supabase
      .from("eleves")
      .select("etablissement_id")
      .eq("id", input.eleve_id)
      .single();
    if (!eleve) return { ok: false, error: "Élève introuvable" };

    const { data, error } = await supabase
      .from("incidents")
      .insert({
        organisation_id: user.organisation_id!,
        etablissement_id: eleve.etablissement_id,
        eleve_id: input.eleve_id,
        auteur_id: user.id,
        type: input.type,
        gravite: input.gravite,
        titre: input.titre,
        description: input.description,
        date_incident: input.date_incident,
        lieu: input.lieu || null,
        photos: input.photos,
        action_prise: input.action_prise || null,
        notifie_parent: input.notifie_parent,
        notifie_le: input.notifie_parent ? new Date().toISOString() : null,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: messageErreur(error) };

    if (input.notifie_parent) {
      await notifyParent(input.eleve_id, data.id, input.titre);
    }

    revalidatePath("/admin/incidents");
    revalidatePath("/admin");
    return { ok: true, id: data.id };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateIncident(id: string, raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    await assertOwned(user, "incidents", id);
    const input = updateSchema.parse(raw);
    const supabase = createAdminClient();

    // Check if notifie_parent changed from false to true
    const { data: existing } = await supabase
      .from("incidents")
      .select("notifie_parent, eleve_id, titre")
      .eq("id", id)
      .single();
    const shouldNotifyNow = existing && !existing.notifie_parent && input.notifie_parent;

    const { error } = await supabase
      .from("incidents")
      .update({
        eleve_id: input.eleve_id,
        type: input.type,
        gravite: input.gravite,
        statut: input.statut,
        titre: input.titre,
        description: input.description,
        date_incident: input.date_incident,
        lieu: input.lieu || null,
        photos: input.photos,
        action_prise: input.action_prise || null,
        notifie_parent: input.notifie_parent,
        notifie_le:
          shouldNotifyNow || (input.notifie_parent && existing?.notifie_parent === false)
            ? new Date().toISOString()
            : undefined,
      })
      .eq("id", id);
    if (error) return { ok: false, error: messageErreur(error) };

    if (shouldNotifyNow) {
      await notifyParent(input.eleve_id, id, input.titre);
    }

    revalidatePath("/admin/incidents");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateIncidentStatut(
  id: string,
  statut: "signale" | "en_cours" | "traite" | "clos"
): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    await assertOwned(user, "incidents", id);
    const supabase = createAdminClient();
    const { error } = await supabase.from("incidents").update({ statut }).eq("id", id);
    if (error) return { ok: false, error: messageErreur(error) };
    revalidatePath("/admin/incidents");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function deleteIncident(id: string): Promise<ActionResult> {
  try {
    // Suppression réservée au personnel administratif (pas aux profs)
    const user = await requireAuth();
    if (!ROLES_ADMINISTRATIFS.includes(user.role?.code ?? "")) {
      return { ok: false, error: "Seule l'administration peut supprimer un signalement" };
    }
    await assertOwned(user, "incidents", id);
    const supabase = createAdminClient();

    // Conformité : archivage (photos conservées dans le Storage), pas de suppression
    const { error } = await supabase
      .from("incidents")
      .update({ archive_le: new Date().toISOString() })
      .eq("id", id);
    if (error) return { ok: false, error: messageErreur(error) };
    revalidatePath("/admin/incidents");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

/**
 * Upload a single photo to the "incidents" bucket. Returns the public URL.
 * Called from client before creating the incident.
 */
export async function uploadIncidentPhoto(file: FormData): Promise<
  { ok: true; url: string } | { ok: false; error: string }
> {
  try {
    await requireAuth();
    const photo = file.get("file") as File | null;
    if (!photo) return { ok: false, error: "Aucun fichier" };
    if (photo.size > 10 * 1024 * 1024) return { ok: false, error: "Photo trop lourde (max 10 Mo)" };
    if (!photo.type.startsWith("image/"))
      return { ok: false, error: "Seules les images sont acceptées" };

    const supabase = createAdminClient();
    const ext = (photo.name.split(".").pop() || "jpg").toLowerCase().slice(0, 5);
    const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("incidents")
      .upload(path, photo, { contentType: photo.type, upsert: false });
    if (error) return { ok: false, error: messageErreur(error) };

    const { data } = supabase.storage.from("incidents").getPublicUrl(path);
    return { ok: true, url: data.publicUrl };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}
