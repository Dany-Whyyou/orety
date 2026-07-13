import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type BulletinListItem = {
  id: string;
  inscription_id: string;
  eleve_id: string;
  eleve_nom: string;
  eleve_prenom: string;
  matricule: string;
  classe_id: string;
  classe_nom: string;
  niveau_libelle: string;
  cycle: string;
  annee_libelle: string;
  annee_active: boolean;
  periode_id: string | null;
  periode_libelle: string | null;
  est_annuel: boolean;
  moyenne_generale: number | null;
  moyenne_classe: number | null;
  rang: number | null;
  effectif_classe: number | null;
  appreciation_generale: string | null;
  decision_conseil: string | null;
  publie: boolean;
  publie_le: string | null;
  pdf_url: string | null;
  cree_le: string;
};

export async function getBulletins(): Promise<BulletinListItem[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("bulletins")
    .select(
      `id, inscription_id, periode_id, est_annuel, moyenne_generale, moyenne_classe, rang,
       effectif_classe, appreciation_generale, decision_conseil, publie, publie_le, pdf_url, cree_le,
       periodes_scolaires(libelle),
       inscriptions(
         eleve_id, classe_id,
         eleves(nom, prenom, matricule),
         classes(nom, niveaux(libelle, cycle)),
         annees_scolaires(libelle, active)
       )`
    )
    .is("archive_le", null)
    .order("cree_le", { ascending: false });

  if (error) {
    console.error("getBulletins:", error);
    return [];
  }

  return (data ?? []).map((b) => {
    const rec = b as {
      id: string;
      inscription_id: string;
      periode_id: string | null;
      est_annuel: boolean;
      moyenne_generale: number | null;
      moyenne_classe: number | null;
      rang: number | null;
      effectif_classe: number | null;
      appreciation_generale: string | null;
      decision_conseil: string | null;
      publie: boolean;
      publie_le: string | null;
      pdf_url: string | null;
      cree_le: string;
      periodes_scolaires: { libelle: string } | { libelle: string }[] | null;
      inscriptions: {
        eleve_id: string;
        classe_id: string;
        eleves: { nom: string; prenom: string; matricule: string } | { nom: string; prenom: string; matricule: string }[] | null;
        classes: { nom: string; niveaux: { libelle: string; cycle: string } | { libelle: string; cycle: string }[] | null } | { nom: string; niveaux: { libelle: string; cycle: string } | { libelle: string; cycle: string }[] | null }[] | null;
        annees_scolaires: { libelle: string; active: boolean } | { libelle: string; active: boolean }[] | null;
      } | {
        eleve_id: string;
        classe_id: string;
        eleves: { nom: string; prenom: string; matricule: string } | { nom: string; prenom: string; matricule: string }[] | null;
        classes: { nom: string; niveaux: { libelle: string; cycle: string } | { libelle: string; cycle: string }[] | null } | { nom: string; niveaux: { libelle: string; cycle: string } | { libelle: string; cycle: string }[] | null }[] | null;
        annees_scolaires: { libelle: string; active: boolean } | { libelle: string; active: boolean }[] | null;
      }[] | null;
    };
    const periode = Array.isArray(rec.periodes_scolaires) ? rec.periodes_scolaires[0] : rec.periodes_scolaires;
    const insc = Array.isArray(rec.inscriptions) ? rec.inscriptions[0] : rec.inscriptions;
    const eleve = insc
      ? Array.isArray(insc.eleves)
        ? insc.eleves[0]
        : insc.eleves
      : null;
    const classe = insc
      ? Array.isArray(insc.classes)
        ? insc.classes[0]
        : insc.classes
      : null;
    const niveau = classe
      ? Array.isArray(classe.niveaux)
        ? classe.niveaux[0]
        : classe.niveaux
      : null;
    const annee = insc
      ? Array.isArray(insc.annees_scolaires)
        ? insc.annees_scolaires[0]
        : insc.annees_scolaires
      : null;

    return {
      id: rec.id,
      inscription_id: rec.inscription_id,
      eleve_id: insc?.eleve_id ?? "",
      eleve_nom: eleve?.nom ?? "?",
      eleve_prenom: eleve?.prenom ?? "?",
      matricule: eleve?.matricule ?? "",
      classe_id: insc?.classe_id ?? "",
      classe_nom: classe?.nom ?? "?",
      niveau_libelle: niveau?.libelle ?? "?",
      cycle: niveau?.cycle ?? "autre",
      annee_libelle: annee?.libelle ?? "?",
      annee_active: annee?.active ?? false,
      periode_id: rec.periode_id,
      periode_libelle: periode?.libelle ?? null,
      est_annuel: rec.est_annuel,
      moyenne_generale: rec.moyenne_generale !== null ? Number(rec.moyenne_generale) : null,
      moyenne_classe: rec.moyenne_classe !== null ? Number(rec.moyenne_classe) : null,
      rang: rec.rang,
      effectif_classe: rec.effectif_classe,
      appreciation_generale: rec.appreciation_generale,
      decision_conseil: rec.decision_conseil,
      publie: rec.publie,
      publie_le: rec.publie_le,
      pdf_url: rec.pdf_url,
      cree_le: rec.cree_le,
    };
  });
}

export async function getBulletinFormData() {
  const supabase = createAdminClient();
  const [{ data: classes }, { data: periodes }, { data: annees }] = await Promise.all([
    supabase
      .from("classes")
      .select(
        "id, nom, niveau_id, annee_scolaire_id, niveaux(libelle, cycle, etablissement_id), annees_scolaires(libelle, active)"
      )
      .order("nom"),
    supabase
      .from("periodes_scolaires")
      .select(
        "id, libelle, numero, date_debut, date_fin, config_bulletins(etablissement_id, annee_scolaire_id)"
      )
      .order("numero"),
    supabase
      .from("annees_scolaires")
      .select("id, libelle, active")
      .order("date_debut", { ascending: false }),
  ]);

  return {
    classes: (classes ?? []).map((c) => {
      const rec = c as {
        id: string;
        nom: string;
        niveau_id: string;
        annee_scolaire_id: string;
        niveaux: { libelle: string; cycle: string; etablissement_id: string } | { libelle: string; cycle: string; etablissement_id: string }[] | null;
        annees_scolaires: { libelle: string; active: boolean } | { libelle: string; active: boolean }[] | null;
      };
      const n = Array.isArray(rec.niveaux) ? rec.niveaux[0] : rec.niveaux;
      const y = Array.isArray(rec.annees_scolaires) ? rec.annees_scolaires[0] : rec.annees_scolaires;
      return {
        id: rec.id,
        nom: rec.nom,
        niveau_id: rec.niveau_id,
        niveau_libelle: n?.libelle ?? "?",
        cycle: n?.cycle ?? "autre",
        etablissement_id: n?.etablissement_id ?? "",
        annee_scolaire_id: rec.annee_scolaire_id,
        annee_libelle: y?.libelle ?? "?",
        annee_active: y?.active ?? false,
      };
    }),
    periodes: (periodes ?? []).map((p) => {
      const rec = p as {
        id: string;
        libelle: string;
        numero: number;
        date_debut: string;
        date_fin: string;
        config_bulletins: { etablissement_id: string; annee_scolaire_id: string } | { etablissement_id: string; annee_scolaire_id: string }[] | null;
      };
      const cfg = Array.isArray(rec.config_bulletins) ? rec.config_bulletins[0] : rec.config_bulletins;
      return {
        id: rec.id,
        libelle: rec.libelle,
        numero: rec.numero,
        etablissement_id: cfg?.etablissement_id ?? "",
        annee_scolaire_id: cfg?.annee_scolaire_id ?? "",
      };
    }),
    annees: annees ?? [],
  };
}

export type BulletinDetail = BulletinListItem & {
  matieres: {
    id: string;
    matiere_id: string;
    matiere_nom: string;
    matiere_code: string;
    coefficient: number;
    moyenne: number | null;
    moyenne_classe: number | null;
    rang: number | null;
    appreciation: string | null;
    prof_nom: string | null;
    prof_prenom: string | null;
  }[];
};

export async function getBulletinDetail(id: string): Promise<BulletinDetail | null> {
  const supabase = createAdminClient();
  const bulletins = await getBulletins();
  const b = bulletins.find((x) => x.id === id);
  if (!b) return null;

  const { data: matieres } = await supabase
    .from("bulletin_matiere")
    .select(
      "id, matiere_id, coefficient, moyenne, moyenne_classe, rang, appreciation, prof_utilisateur_id, matieres(nom, code), utilisateurs:prof_utilisateur_id(nom, prenom)"
    )
    .eq("bulletin_id", id);

  return {
    ...b,
    matieres: (matieres ?? []).map((m) => {
      const rec = m as {
        id: string;
        matiere_id: string;
        coefficient: number;
        moyenne: number | null;
        moyenne_classe: number | null;
        rang: number | null;
        appreciation: string | null;
        prof_utilisateur_id: string | null;
        matieres: { nom: string; code: string } | { nom: string; code: string }[] | null;
        utilisateurs: { nom: string | null; prenom: string | null } | { nom: string | null; prenom: string | null }[] | null;
      };
      const mat = Array.isArray(rec.matieres) ? rec.matieres[0] : rec.matieres;
      const prof = Array.isArray(rec.utilisateurs) ? rec.utilisateurs[0] : rec.utilisateurs;
      return {
        id: rec.id,
        matiere_id: rec.matiere_id,
        matiere_nom: mat?.nom ?? "?",
        matiere_code: mat?.code ?? "",
        coefficient: Number(rec.coefficient),
        moyenne: rec.moyenne !== null ? Number(rec.moyenne) : null,
        moyenne_classe: rec.moyenne_classe !== null ? Number(rec.moyenne_classe) : null,
        rang: rec.rang,
        appreciation: rec.appreciation,
        prof_nom: prof?.nom ?? null,
        prof_prenom: prof?.prenom ?? null,
      };
    }),
  };
}
