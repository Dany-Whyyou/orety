import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type ArchiveItem = {
  id: string;
  annee_scolaire_id: string;
  annee_libelle: string;
  annee_date_debut: string;
  annee_date_fin: string;
  etablissement_id: string | null;
  etablissement_nom: string | null;
  cloturee_le: string;
  cloturee_par_pseudo: string | null;
  cloturee_par_nom: string | null;
  effectif_fin_annee: number;
  nb_admis: number;
  nb_redoublants: number;
  nb_diplomes: number;
  nb_exclus: number;
  nb_transferes: number;
  moyenne_generale_etablissement: number | null;
  taux_reussite: number | null;
};

export async function getArchives(): Promise<ArchiveItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("archives_annee")
    .select(
      `id, annee_scolaire_id, etablissement_id, cloturee_le,
       effectif_fin_annee, nb_admis, nb_redoublants, nb_diplomes, nb_exclus, nb_transferes,
       moyenne_generale_etablissement, taux_reussite,
       annees_scolaires(libelle, date_debut, date_fin),
       etablissements(nom),
       utilisateurs:cloturee_par(pseudo, nom, prenom)`
    )
    .order("cloturee_le", { ascending: false });

  if (error) {
    console.error("getArchives:", error.message);
    return [];
  }

  return (data ?? []).map((a) => {
    const rec = a as {
      id: string;
      annee_scolaire_id: string;
      etablissement_id: string | null;
      cloturee_le: string;
      effectif_fin_annee: number;
      nb_admis: number;
      nb_redoublants: number;
      nb_diplomes: number;
      nb_exclus: number;
      nb_transferes: number;
      moyenne_generale_etablissement: number | null;
      taux_reussite: number | null;
      annees_scolaires: { libelle: string; date_debut: string; date_fin: string } | { libelle: string; date_debut: string; date_fin: string }[] | null;
      etablissements: { nom: string } | { nom: string }[] | null;
      utilisateurs: { pseudo: string; nom: string | null; prenom: string | null } | { pseudo: string; nom: string | null; prenom: string | null }[] | null;
    };
    const annee = Array.isArray(rec.annees_scolaires) ? rec.annees_scolaires[0] : rec.annees_scolaires;
    const etab = Array.isArray(rec.etablissements) ? rec.etablissements[0] : rec.etablissements;
    const u = Array.isArray(rec.utilisateurs) ? rec.utilisateurs[0] : rec.utilisateurs;
    return {
      id: rec.id,
      annee_scolaire_id: rec.annee_scolaire_id,
      annee_libelle: annee?.libelle ?? "?",
      annee_date_debut: annee?.date_debut ?? "",
      annee_date_fin: annee?.date_fin ?? "",
      etablissement_id: rec.etablissement_id,
      etablissement_nom: etab?.nom ?? null,
      cloturee_le: rec.cloturee_le,
      cloturee_par_pseudo: u?.pseudo ?? null,
      cloturee_par_nom: u ? `${u.prenom ?? ""} ${u.nom ?? ""}`.trim() || null : null,
      effectif_fin_annee: rec.effectif_fin_annee,
      nb_admis: rec.nb_admis,
      nb_redoublants: rec.nb_redoublants,
      nb_diplomes: rec.nb_diplomes,
      nb_exclus: rec.nb_exclus,
      nb_transferes: rec.nb_transferes,
      moyenne_generale_etablissement:
        rec.moyenne_generale_etablissement !== null
          ? Number(rec.moyenne_generale_etablissement)
          : null,
      taux_reussite: rec.taux_reussite !== null ? Number(rec.taux_reussite) : null,
    };
  });
}
