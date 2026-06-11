"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { getClotureState, getProchaineAnnee, type DecisionFinAnnee } from "@/lib/queries/cloture";

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
  if (!["super_admin", "admin_org", "directeur_site"].includes(user.role?.code ?? "")) {
    throw new Error("Permission refusée");
  }
  return user;
}

const STATUT_FROM_DECISION: Record<DecisionFinAnnee, string> = {
  admis: "admis",
  redouble: "redouble",
  diplome: "diplome",
  exclu: "exclu",
  transfere: "transfere",
  abandonne: "abandonne",
};

/** Enregistre une décision individuelle */
export async function saveDecision(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const input = decisionSchema.parse(raw);
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("inscriptions")
      .update({
        decision_fin_annee: input.decision,
        motif_decision: input.motif || null,
        decision_le: new Date().toISOString(),
        decision_par: user.id,
        statut: STATUT_FROM_DECISION[input.decision],
      })
      .eq("id", input.inscription_id);
    if (error) return { ok: false, error: error.message };

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
    const supabase = createAdminClient();

    let count = 0;
    for (const d of input.decisions) {
      const { error } = await supabase
        .from("inscriptions")
        .update({
          decision_fin_annee: d.decision,
          motif_decision: d.motif || null,
          decision_le: new Date().toISOString(),
          decision_par: user.id,
          statut: STATUT_FROM_DECISION[d.decision],
        })
        .eq("id", d.inscription_id);
      if (!error) count += 1;
    }

    revalidatePath("/admin/annees");
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
    await requireAdmin();
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
    const supabase = createAdminClient();

    const state = await getClotureState(annee_id);
    if (!state) return { ok: false, error: "Année introuvable" };
    if (state.est_archivee) return { ok: false, error: "Année déjà archivée" };

    // 1) Snapshot par établissement
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

      await supabase.from("archives_annee").upsert(
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
    }

    // 2) Désactiver les élèves sortis (exclu/diplome/transfere/abandonne)
    const sortants = state.classes.flatMap((c) =>
      c.eleves
        .filter(
          (e) =>
            e.decision_fin_annee === "exclu" ||
            e.decision_fin_annee === "diplome" ||
            e.decision_fin_annee === "transfere" ||
            e.decision_fin_annee === "abandonne"
        )
        .map((e) => e.eleve_id)
    );
    if (sortants.length > 0) {
      await supabase.from("eleves").update({ actif: false }).in("id", sortants);
    }

    // 3) Pré-inscription auto dans l'année suivante pour admis et redouble
    const prochaine = await getProchaineAnnee(annee_id);
    let nbPreinscrits = 0;
    if (prochaine) {
      for (const classe of state.classes) {
        // Cible de classe dans l'année suivante pour cette cohorte
        // - redouble : même niveau
        // - admis : niveau d'ordre directement supérieur dans le même établissement
        const { data: prochainesClasses } = await supabase
          .from("classes")
          .select("id, niveau_id, niveaux(ordre, etablissement_id)")
          .eq("annee_scolaire_id", prochaine.id);

        const targetSameLevel = (prochainesClasses ?? []).find((c) => {
          const n = Array.isArray(c.niveaux) ? c.niveaux[0] : c.niveaux;
          return c.niveau_id === classe.niveau_id;
        });
        const targetNextLevel = (prochainesClasses ?? [])
          .filter((c) => {
            const n = Array.isArray(c.niveaux) ? c.niveaux[0] : c.niveaux;
            return (
              (n as { etablissement_id: string } | null)?.etablissement_id === classe.etablissement_id &&
              (n as { ordre: number } | null)?.ordre === classe.niveau_ordre + 1
            );
          })
          .sort()[0];

        for (const eleve of classe.eleves) {
          if (eleve.decision_fin_annee === "redouble" && targetSameLevel) {
            const { data: existing } = await supabase
              .from("inscriptions")
              .select("id")
              .eq("eleve_id", eleve.eleve_id)
              .eq("annee_scolaire_id", prochaine.id)
              .maybeSingle();
            if (!existing) {
              await supabase.from("inscriptions").insert({
                eleve_id: eleve.eleve_id,
                classe_id: targetSameLevel.id,
                annee_scolaire_id: prochaine.id,
                statut: "inscrit",
              });
              nbPreinscrits += 1;
            }
          } else if (eleve.decision_fin_annee === "admis" && targetNextLevel) {
            const { data: existing } = await supabase
              .from("inscriptions")
              .select("id")
              .eq("eleve_id", eleve.eleve_id)
              .eq("annee_scolaire_id", prochaine.id)
              .maybeSingle();
            if (!existing) {
              await supabase.from("inscriptions").insert({
                eleve_id: eleve.eleve_id,
                classe_id: targetNextLevel.id,
                annee_scolaire_id: prochaine.id,
                statut: "inscrit",
              });
              nbPreinscrits += 1;
            }
          }
        }
      }
    }

    // 4) Marquer l'année archivée
    await supabase
      .from("annees_scolaires")
      .update({ archivee: true, active: false })
      .eq("id", annee_id);

    revalidatePath("/admin/annees");
    revalidatePath("/admin/archives");
    revalidatePath("/admin");
    return { ok: true, count: nbPreinscrits };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}
