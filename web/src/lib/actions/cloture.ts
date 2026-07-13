"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertOwned, messageErreur } from "@/lib/authz";
import { getCurrentUser, ROLES_DIRECTION } from "@/lib/auth";
import { getClotureState, type DecisionFinAnnee } from "@/lib/queries/cloture";

const decisionSchema = z.object({
  inscription_id: z.string().uuid(),
  decision: z.enum(["admis", "redouble", "diplome", "exclu", "transfere", "abandonne"]),
  motif: z.string().max(1000).optional().or(z.literal("")).nullable(),
});

const bulkSchema = z.object({
  decisions: z.array(decisionSchema),
});

export type ActionResult = { ok: true; count?: number; archive_id?: string } | { ok: false; error: string };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  if (!ROLES_DIRECTION.includes(user.role?.code ?? "")) {
    throw new Error("Permission refusée");
  }
  return user;
}

/** Enregistre une décision individuelle */
export async function saveDecision(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const input = decisionSchema.parse(raw);
    await assertOwned(user, "inscriptions", input.inscription_id);
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("inscriptions")
      .update({
        // Le statut d'inscription reste "inscrit" tant que l'année n'est pas
        // clôturée : sinon l'élève disparaît des effectifs, des notes et des
        // bulletins avant même la fin de l'année.
        decision_fin_annee: input.decision,
        motif_decision: input.motif || null,
        decision_le: new Date().toISOString(),
        decision_par: user.id,
      })
      .eq("id", input.inscription_id);
    if (error) return { ok: false, error: messageErreur(error) };

    revalidatePath("/admin/annees");
    return { ok: true, count: 1 };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

/** Applique une décision en masse sur plusieurs inscriptions */
export async function bulkSaveDecisions(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const input = bulkSchema.parse(raw);
    for (const d of input.decisions) {
      await assertOwned(user, "inscriptions", d.inscription_id);
    }
    const supabase = createAdminClient();

    let count = 0;
    const echecs: string[] = [];
    for (const d of input.decisions) {
      const { error } = await supabase
        .from("inscriptions")
        .update({
          decision_fin_annee: d.decision,
          motif_decision: d.motif || null,
          decision_le: new Date().toISOString(),
          decision_par: user.id,
        })
        .eq("id", d.inscription_id);
      if (error) echecs.push(error.message);
      else count += 1;
    }

    revalidatePath("/admin/annees");
    if (echecs.length > 0) {
      return {
        ok: false,
        error: `${count} décision(s) enregistrée(s), ${echecs.length} en échec : ${echecs[0]}`,
      };
    }
    return { ok: true, count };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Validation" };
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

/**
 * Auto-décision : pour chaque élève sans décision, applique une règle simple
 * basée sur la moyenne annuelle et le niveau.
 */
export async function autoDecisionsClasse(
  annee_id: string,
  classe_id: string,
  est_terminal: boolean,
  seuil: number = 10
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await assertOwned(user, "annees_scolaires", annee_id);
    await assertOwned(user, "classes", classe_id);
    const state = await getClotureState(annee_id);
    if (!state) return { ok: false, error: "Année introuvable" };
    const classe = state.classes.find((c) => c.classe_id === classe_id);
    if (!classe) return { ok: false, error: "Classe introuvable" };

    const sansDecision = classe.eleves.filter((e) => !e.decision_fin_annee);
    const decisions = sansDecision.map((e) => {
      const moy = e.moyenne_annuelle ?? 0;
      let decision: DecisionFinAnnee;
      if (est_terminal) {
        decision = moy >= seuil ? "diplome" : "redouble";
      } else {
        decision = moy >= seuil ? "admis" : "redouble";
      }
      return { inscription_id: e.inscription_id, decision, motif: null };
    });

    return await bulkSaveDecisions({ decisions });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

/**
 * Clôture d'année : calcule les stats globales, crée snapshots par établissement,
 * déclenche la pré-inscription auto pour les admis/redouble, désactive les élèves exclus/diplômés/transférés/abandons.
 */
export async function cloturerAnnee(annee_id: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await assertOwned(user, "annees_scolaires", annee_id);
    const supabase = createAdminClient();

    const state = await getClotureState(annee_id);
    if (!state) return { ok: false, error: "Année introuvable" };
    if (state.est_archivee) return { ok: false, error: "Année déjà archivée" };
    if (state.nb_sans_decision > 0) {
      return {
        ok: false,
        error: `${state.nb_sans_decision} élève(s) n'ont pas de décision de fin d'année. Renseignez-les avant de clôturer.`,
      };
    }

    // 2-5) Statuts, désactivations, pré-inscriptions et archivage :
    //      une seule transaction SQL, atomique et idempotente (un échec ne peut
    //      plus laisser l'année à moitié clôturée).
    const rpc = supabase as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{
        data: { nb_statuts: number; nb_desactives: number; nb_preinscrits: number }[] | null;
        error: { message: string } | null;
      }>;
    };
    const { data: resultat, error: clotureErr } = await rpc.rpc("cloturer_annee", {
      p_annee_id: annee_id,
      p_organisation_id: user.organisation_id,
    });
    if (clotureErr) return { ok: false, error: messageErreur(clotureErr) };
    const bilan = resultat?.[0];


    // 6) Snapshots d'archives (non destructifs, apres la transaction)
    const parEtab = new Map<string, {
      nom: string;
      effectif: number;
      nb_admis: number;
      nb_redoublants: number;
      nb_diplomes: number;
      nb_exclus: number;
      nb_transferes: number;
      nb_abandons: number;
      total_moy: number;
      n_moy: number;
      classes: { nom: string; effectif: number; moyenne: number | null }[];
    }>();

    state.classes.forEach((c) => {
      const e = parEtab.get(c.etablissement_id) ?? {
        nom: c.etablissement_nom,
        effectif: 0,
        nb_admis: 0,
        nb_redoublants: 0,
        nb_diplomes: 0,
        nb_exclus: 0,
        nb_transferes: 0,
        nb_abandons: 0,
        total_moy: 0,
        n_moy: 0,
        classes: [],
      };
      e.effectif += c.effectif;
      c.eleves.forEach((el) => {
        if (el.decision_fin_annee === "admis") e.nb_admis += 1;
        else if (el.decision_fin_annee === "redouble") e.nb_redoublants += 1;
        else if (el.decision_fin_annee === "diplome") e.nb_diplomes += 1;
        else if (el.decision_fin_annee === "exclu") e.nb_exclus += 1;
        else if (el.decision_fin_annee === "transfere") e.nb_transferes += 1;
        else if (el.decision_fin_annee === "abandonne") e.nb_abandons += 1;
        if (el.moyenne_annuelle !== null) {
          e.total_moy += el.moyenne_annuelle;
          e.n_moy += 1;
        }
      });
      const moyennesClasse = c.eleves.map((el) => el.moyenne_annuelle).filter((x): x is number => x !== null);
      e.classes.push({
        nom: c.classe_nom,
        effectif: c.effectif,
        moyenne:
          moyennesClasse.length > 0
            ? moyennesClasse.reduce((a, b) => a + b, 0) / moyennesClasse.length
            : null,
      });
      parEtab.set(c.etablissement_id, e);
    });

    for (const [etablissement_id, stats] of parEtab.entries()) {
      const moyenneGen = stats.n_moy > 0 ? stats.total_moy / stats.n_moy : null;
      const totalSortants = stats.nb_admis + stats.nb_redoublants + stats.nb_diplomes;
      const reussite = totalSortants > 0
        ? ((stats.nb_admis + stats.nb_diplomes) / totalSortants) * 100
        : null;

      const { error: archiveErr } = await supabase.from("archives_annee").upsert(
        {
          organisation_id: user.organisation_id!,
          annee_scolaire_id: annee_id,
          etablissement_id,
          cloturee_par: user.id,
          cloturee_le: new Date().toISOString(),
          effectif_fin_annee: stats.effectif,
          nb_admis: stats.nb_admis,
          nb_redoublants: stats.nb_redoublants,
          nb_diplomes: stats.nb_diplomes,
          nb_exclus: stats.nb_exclus,
          nb_transferes: stats.nb_transferes,
          moyenne_generale_etablissement: moyenneGen,
          taux_reussite: reussite,
          donnees_agregees: { classes: stats.classes },
        },
        { onConflict: "annee_scolaire_id,etablissement_id" }
      );
      if (archiveErr) {
        return {
          ok: false,
          error: "Annee cloturee, mais l'archive n'a pas pu etre enregistree : " + archiveErr.message,
        };
      }
    }

    revalidatePath("/admin/annees");
    revalidatePath("/admin/archives");
    revalidatePath("/admin");
    return { ok: true, count: bilan?.nb_preinscrits ?? 0 };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}
