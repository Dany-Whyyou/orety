"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertOwned, messageErreur } from "@/lib/authz";
import { getCurrentUser, ROLES_DIRECTION } from "@/lib/auth";

const schema = z.object({
  utilisateur_id: z.string().uuid(),
  classe_id: z.string().uuid(),
  annee_scolaire_id: z.string().uuid(),
  matiere_id: z.string().uuid().nullable(),
  heures_semaine: z.number().min(0).max(50).nullable(),
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

export async function createAffectation(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const input = schema.parse(raw);
    await assertOwned(user, "classes", input.classe_id);
    await assertOwned(user, "utilisateurs", input.utilisateur_id);
    await assertOwned(user, "annees_scolaires", input.annee_scolaire_id);
    if (input.matiere_id) await assertOwned(user, "matieres", input.matiere_id);
    const supabase = createAdminClient();
    const { error } = await supabase.from("affectations").insert({
      utilisateur_id: input.utilisateur_id,
      classe_id: input.classe_id,
      annee_scolaire_id: input.annee_scolaire_id,
      matiere_id: input.matiere_id,
      heures_semaine: input.heures_semaine,
    });
    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "Cette affectation existe déjà" };
      }
      return { ok: false, error: messageErreur(error) };
    }
    revalidatePath("/admin/affectations");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateAffectation(id: string, raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await assertOwned(user, "affectations", id);
    const input = schema.parse(raw);
    await assertOwned(user, "classes", input.classe_id);
    await assertOwned(user, "utilisateurs", input.utilisateur_id);
    await assertOwned(user, "annees_scolaires", input.annee_scolaire_id);
    if (input.matiere_id) await assertOwned(user, "matieres", input.matiere_id);
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("affectations")
      .update({
        utilisateur_id: input.utilisateur_id,
        classe_id: input.classe_id,
        annee_scolaire_id: input.annee_scolaire_id,
        matiere_id: input.matiere_id,
        heures_semaine: input.heures_semaine,
      })
      .eq("id", id);
    if (error) return { ok: false, error: messageErreur(error) };
    revalidatePath("/admin/affectations");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function deleteAffectation(id: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await assertOwned(user, "affectations", id);
    const supabase = createAdminClient();
    // Une affectation portant des évaluations fait partie de l'historique
    // pédagogique : suppression refusée (conformité).
    const [{ count }, { count: nbSeances }] = await Promise.all([
      supabase
        .from("evaluations")
        .select("*", { count: "exact", head: true })
        .eq("affectation_id", id),
      supabase
        .from("seances")
        .select("*", { count: "exact", head: true })
        .eq("affectation_id", id),
    ]);
    if ((count ?? 0) > 0) {
      return {
        ok: false,
        error: `Impossible : ${count} évaluation(s) sont rattachées à cette affectation`,
      };
    }
    // Les séances cascadent sur les présences : supprimer détruirait l'historique
    // d'appel (interdit par la politique d'archivage).
    if ((nbSeances ?? 0) > 0) {
      return {
        ok: false,
        error: `Impossible : ${nbSeances} séance(s) et leurs présences sont rattachées à cette affectation`,
      };
    }
    const { error } = await supabase.from("affectations").delete().eq("id", id);
    if (error) return { ok: false, error: messageErreur(error) };
    revalidatePath("/admin/affectations");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}
