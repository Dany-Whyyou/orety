import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type FrequenceBulletin = "mensuel" | "trimestriel" | "semestriel";

export type ConfigBulletinItem = {
  id: string;
  etablissement_id: string;
  etablissement_nom: string;
  frequence: FrequenceBulletin;
  nb_periodes: number;
  formule_annuelle_dsl: string;
  formule_annuelle_json: { poids?: number[]; diviseur?: number } | null;
  note_maximale: number;
  note_passage: number;
  periodes: {
    id: string;
    numero: number;
    libelle: string;
    date_debut: string;
    date_fin: string;
    cloturee: boolean;
  }[];
};

export type AnneeListItem = {
  id: string;
  libelle: string;
  date_debut: string;
  date_fin: string;
  active: boolean;
  archivee: boolean;
  configs: ConfigBulletinItem[];
};

export async function getAnnees(): Promise<AnneeListItem[]> {
  const supabase = createAdminClient();

  const { data: annees, error } = await supabase
    .from("annees_scolaires")
    .select("*")
    .is("archive_le", null)
    .order("date_debut", { ascending: false });

  if (error) {
    console.error("getAnnees:", error);
    return [];
  }

  const anneeIds = (annees ?? []).map((a) => a.id);
  if (anneeIds.length === 0) return [];

  const { data: configs } = await supabase
    .from("config_bulletins")
    .select(
      "id, annee_scolaire_id, etablissement_id, frequence, nb_periodes, formule_annuelle_dsl, formule_annuelle_json, note_maximale, note_passage, etablissements(nom), periodes_scolaires(id, numero, libelle, date_debut, date_fin, cloturee)"
    )
    .is("archive_le", null)
    .in("annee_scolaire_id", anneeIds);

  const configsByAnnee = new Map<string, ConfigBulletinItem[]>();
  (configs ?? []).forEach((c: {
    id: string;
    annee_scolaire_id: string;
    etablissement_id: string;
    frequence: FrequenceBulletin;
    nb_periodes: number;
    formule_annuelle_dsl: string;
    formule_annuelle_json: unknown;
    note_maximale: number;
    note_passage: number;
    etablissements: { nom: string } | { nom: string }[] | null;
    periodes_scolaires: Array<{ id: string; numero: number; libelle: string; date_debut: string; date_fin: string; cloturee: boolean }> | null;
  }) => {
    const etab = Array.isArray(c.etablissements) ? c.etablissements[0] : c.etablissements;
    const periodes = (c.periodes_scolaires ?? []).sort((a, b) => a.numero - b.numero);
    const list = configsByAnnee.get(c.annee_scolaire_id) ?? [];
    list.push({
      id: c.id,
      etablissement_id: c.etablissement_id,
      etablissement_nom: etab?.nom ?? "Site inconnu",
      frequence: c.frequence,
      nb_periodes: c.nb_periodes,
      formule_annuelle_dsl: c.formule_annuelle_dsl,
      formule_annuelle_json: (c.formule_annuelle_json as { poids?: number[]; diviseur?: number }) ?? null,
      note_maximale: c.note_maximale,
      note_passage: c.note_passage,
      periodes,
    });
    configsByAnnee.set(c.annee_scolaire_id, list);
  });

  return (annees ?? []).map((a) => ({
    id: a.id,
    libelle: a.libelle,
    date_debut: a.date_debut,
    date_fin: a.date_fin,
    active: a.active,
    archivee: a.archivee,
    configs: configsByAnnee.get(a.id) ?? [],
  }));
}

export async function getEtablissementsForForms(): Promise<{ id: string; nom: string }[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("etablissements")
    .select("id, nom")
    .eq("actif", true)
    .order("nom");
  return data ?? [];
}
