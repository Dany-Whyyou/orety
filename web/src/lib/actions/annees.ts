"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertOwned, messageErreur } from "@/lib/authz";
import { getCurrentUser, ROLES_DIRECTION } from "@/lib/auth";

const FREQUENCES = ["mensuel", "trimestriel", "semestriel"] as const;

const anneeSchema = z.object({
  libelle: z
    .string()
    .min(4, "Libellé requis (ex: 2026-2027)")
    .max(40),
  date_debut: z.string().min(10, "Date requise"),
  date_fin: z.string().min(10, "Date requise"),
  active: z.boolean().optional(),
});

const configSchema = z.object({
  etablissement_id: z.string().uuid(),
  frequence: z.enum(FREQUENCES),
  nb_periodes: z.number().int().min(1).max(12),
  poids: z.array(z.number().min(0).max(20)),
  diviseur: z.number().min(0.1),
  note_maximale: z.number().min(1).max(100).default(20),
  note_passage: z.number().min(0).max(100).default(10),
});

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  if (!ROLES_DIRECTION.includes(user.role?.code ?? "")) {
    throw new Error("Permission refusée");
  }
  return user;
}

export async function createAnnee(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const input = anneeSchema.parse(raw);
    if (new Date(input.date_fin) <= new Date(input.date_debut)) {
      return { ok: false, error: "Date de fin doit être après la date de début" };
    }
    const supabase = createAdminClient();

    // If active=true, deactivate others
    if (input.active) {
      await supabase
        .from("annees_scolaires")
        .update({ active: false })
        .eq("organisation_id", user.organisation_id!);
    }

    const { data, error } = await supabase
      .from("annees_scolaires")
      .insert({
        organisation_id: user.organisation_id!,
        libelle: input.libelle,
        date_debut: input.date_debut,
        date_fin: input.date_fin,
        active: input.active ?? false,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: messageErreur(error) };
    revalidatePath("/admin/annees");
    revalidatePath("/admin");
    return { ok: true, id: data.id };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { ok: false, error: e.issues[0]?.message ?? "Validation échouée" };
    }
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateAnnee(id: string, raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await assertOwned(user, "annees_scolaires", id);
    const input = anneeSchema.parse(raw);
    if (new Date(input.date_fin) <= new Date(input.date_debut)) {
      return { ok: false, error: "Date de fin doit être après la date de début" };
    }
    const supabase = createAdminClient();

    if (input.active) {
      await supabase
        .from("annees_scolaires")
        .update({ active: false })
        .eq("organisation_id", user.organisation_id!)
        .neq("id", id);
    }

    const { error } = await supabase
      .from("annees_scolaires")
      .update({
        libelle: input.libelle,
        date_debut: input.date_debut,
        date_fin: input.date_fin,
        active: input.active ?? false,
      })
      .eq("id", id);
    if (error) return { ok: false, error: messageErreur(error) };
    revalidatePath("/admin/annees");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { ok: false, error: e.issues[0]?.message ?? "Validation échouée" };
    }
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function setAnneeActive(id: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await assertOwned(user, "annees_scolaires", id);
    const supabase = createAdminClient();
    await supabase
      .from("annees_scolaires")
      .update({ active: false })
      .eq("organisation_id", user.organisation_id!);
    const { error } = await supabase
      .from("annees_scolaires")
      .update({ active: true })
      .eq("id", id);
    if (error) return { ok: false, error: messageErreur(error) };
    revalidatePath("/admin/annees");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function deleteAnnee(id: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await assertOwned(user, "annees_scolaires", id);
    const supabase = createAdminClient();
    // Conformité : jamais de suppression physique d'une année scolaire
    const { data: annee } = await supabase
      .from("annees_scolaires")
      .select("active")
      .eq("id", id)
      .single();
    if (annee?.active) return { ok: false, error: "Impossible d'archiver l'année active" };
    const { error } = await supabase.from("annees_scolaires").update({ archive_le: new Date().toISOString() }).eq("id", id);
    if (error) return { ok: false, error: messageErreur(error) };
    revalidatePath("/admin/annees");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

/**
 * Crée ou met à jour la config bulletin et génère les périodes automatiquement
 * à partir de la fréquence et des dates de début/fin de l'année.
 */
export async function saveConfigBulletin(
  anneeId: string,
  raw: unknown
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await assertOwned(user, "annees_scolaires", anneeId);
    const input = configSchema.parse(raw);
    await assertOwned(user, "etablissements", input.etablissement_id);
    if (input.poids.length !== input.nb_periodes) {
      return { ok: false, error: "Le nombre de poids doit correspondre au nombre de périodes" };
    }
    if (input.poids.some((p) => p === 0) && input.diviseur === 0) {
      return { ok: false, error: "Au moins un poids doit être non nul" };
    }
    if (input.diviseur === 0) {
      return { ok: false, error: "Diviseur non nul requis" };
    }

    const supabase = createAdminClient();

    // Fetch year dates to distribute periods
    const { data: annee, error: anneeErr } = await supabase
      .from("annees_scolaires")
      .select("date_debut, date_fin")
      .eq("id", anneeId)
      .single();
    if (anneeErr || !annee) return { ok: false, error: "Année introuvable" };

    // Build formula DSL
    const terms = input.poids.map((p, i) => {
      if (p === 0) return null;
      if (p === 1) return `P${i + 1}`;
      return `P${i + 1}*${p}`;
    }).filter(Boolean);
    const formuleDsl = `(${terms.join(" + ")}) / ${input.diviseur}`;

    // Check if config exists
    const { data: existing } = await supabase
      .from("config_bulletins")
      .select("id, archive_le")
      .eq("annee_scolaire_id", anneeId)
      .eq("etablissement_id", input.etablissement_id)
      .maybeSingle();
    // Une config archivée par erreur doit pouvoir être réactivée : sinon les
    // bulletins annuels de cet établissement/année sont morts définitivement.
    if (existing?.archive_le) {
      await supabase
        .from("config_bulletins")
        .update({ archive_le: null })
        .eq("id", existing.id);
    }

    let configId: string;
    let regenererPeriodes = true;
    if (existing) {
      configId = existing.id;

      // La structure des périodes ne peut pas changer si des données y sont
      // rattachées. On CONTRÔLE AVANT d'écrire quoi que ce soit.
      const { data: config } = await supabase
        .from("config_bulletins")
        .select("frequence, nb_periodes")
        .eq("id", configId)
        .single();
      const structureChange =
        !!config &&
        (config.frequence !== input.frequence || config.nb_periodes !== input.nb_periodes);

      const { data: periodesExistantes } = await supabase
        .from("periodes_scolaires")
        .select("id")
        .eq("config_bulletin_id", configId);
      const periodeIds = (periodesExistantes ?? []).map((p) => p.id);

      let periodesUtilisees = false;
      if (periodeIds.length > 0) {
        const [{ count: nbEvals }, { count: nbBulletins }, { count: nbObs }] = await Promise.all([
          supabase
            .from("evaluations")
            .select("*", { count: "exact", head: true })
            .in("periode_id", periodeIds),
          supabase
            .from("bulletins")
            .select("*", { count: "exact", head: true })
            .in("periode_id", periodeIds),
          supabase
            .from("observations")
            .select("*", { count: "exact", head: true })
            .in("periode_id", periodeIds),
        ]);
        periodesUtilisees = (nbEvals ?? 0) > 0 || (nbBulletins ?? 0) > 0 || (nbObs ?? 0) > 0;
      }

      if (structureChange && periodesUtilisees) {
        return {
          ok: false,
          error:
            "Des évaluations, bulletins ou observations sont déjà rattachés aux périodes : la fréquence et le nombre de périodes ne peuvent plus changer. Vous pouvez toujours modifier la formule annuelle et les seuils de notes.",
        };
      }

      // Périodes conservées si la structure ne change pas (ou si elles sont utilisées)
      regenererPeriodes = structureChange || periodeIds.length === 0;

      const { error } = await supabase
        .from("config_bulletins")
        .update({
          frequence: input.frequence,
          nb_periodes: input.nb_periodes,
          formule_annuelle_dsl: formuleDsl,
          formule_annuelle_json: { poids: input.poids, diviseur: input.diviseur },
          note_maximale: input.note_maximale,
          note_passage: input.note_passage,
        })
        .eq("id", configId);
      if (error) return { ok: false, error: messageErreur(error) };

      if (regenererPeriodes && periodeIds.length > 0) {
        await supabase.from("periodes_scolaires").delete().eq("config_bulletin_id", configId);
      }
    } else {
      const { data, error } = await supabase
        .from("config_bulletins")
        .insert({
          annee_scolaire_id: anneeId,
          etablissement_id: input.etablissement_id,
          frequence: input.frequence,
          nb_periodes: input.nb_periodes,
          formule_annuelle_dsl: formuleDsl,
          formule_annuelle_json: { poids: input.poids, diviseur: input.diviseur },
          note_maximale: input.note_maximale,
          note_passage: input.note_passage,
        })
        .select("id")
        .single();
      if (error) return { ok: false, error: messageErreur(error) };
      configId = data.id;
    }

    // Périodes : régénérées uniquement si la structure a changé (ou création).
    // Sinon on conserve celles qui portent déjà évaluations/bulletins.
    if (!regenererPeriodes) {
      revalidatePath("/admin/annees");
      return { ok: true };
    }

    // Generate periodes — split year evenly
    const start = new Date(annee.date_debut);
    const end = new Date(annee.date_fin);
    const totalMs = end.getTime() - start.getTime();
    const periodMs = totalMs / input.nb_periodes;
    const labelTemplate = {
      mensuel: (n: number) => `Mois ${n}`,
      trimestriel: (n: number) =>
        ({ 1: "1er trimestre", 2: "2ème trimestre", 3: "3ème trimestre" }[n] ?? `T${n}`),
      semestriel: (n: number) =>
        ({ 1: "1er semestre", 2: "2ème semestre" }[n] ?? `S${n}`),
    }[input.frequence];

    const periodsToInsert = Array.from({ length: input.nb_periodes }, (_, i) => {
      const periodStart = new Date(start.getTime() + i * periodMs);
      const periodEnd =
        i === input.nb_periodes - 1
          ? end
          : new Date(start.getTime() + (i + 1) * periodMs - 24 * 3600 * 1000);
      return {
        config_bulletin_id: configId,
        numero: i + 1,
        libelle: labelTemplate(i + 1),
        date_debut: periodStart.toISOString().slice(0, 10),
        date_fin: periodEnd.toISOString().slice(0, 10),
      };
    });

    const { error: insertErr } = await supabase
      .from("periodes_scolaires")
      .insert(periodsToInsert);
    if (insertErr) return { ok: false, error: messageErreur(insertErr) };

    revalidatePath("/admin/annees");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { ok: false, error: e.issues[0]?.message ?? "Validation échouée" };
    }
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function deleteConfigBulletin(id: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await assertOwned(user, "config_bulletins", id);
    const supabase = createAdminClient();
    const { error } = await supabase.from("config_bulletins").update({ archive_le: new Date().toISOString() }).eq("id", id);
    if (error) return { ok: false, error: messageErreur(error) };
    revalidatePath("/admin/annees");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}
