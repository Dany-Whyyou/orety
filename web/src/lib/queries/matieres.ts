import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEtabScope } from "@/lib/auth";

export type MatiereItem = {
  id: string;
  code: string;
  nom: string;
  couleur: string | null;
  ordre: number;
  actif: boolean;
  etablissement_id: string;
  etablissement_nom: string;
  coefficients: { niveau_id: string; niveau_libelle: string; coefficient: number }[];
};

export type MatiereGroup = {
  etablissement_id: string;
  etablissement_nom: string;
  matieres: MatiereItem[];
  niveaux: { id: string; libelle: string; cycle: string; ordre: number }[];
};

export async function getMatieres(): Promise<MatiereGroup[]> {
  const supabase = createAdminClient();
  const scope = await getEtabScope();

  const matieresBase = supabase
    .from("matieres")
    .select("id, code, nom, couleur, ordre, actif, etablissement_id, etablissements(nom)")
    .order("ordre");
  const niveauxBase = supabase
    .from("niveaux")
    .select("id, libelle, cycle, ordre, etablissement_id")
    .order("ordre");

  const [{ data: matieresData }, { data: niveauxData }, { data: coefsData }] =
    await Promise.all([
      scope
        ? matieresBase.is("archive_le", null).eq("etablissement_id", scope)
        : matieresBase.is("archive_le", null),
      scope
        ? niveauxBase.is("archive_le", null).eq("etablissement_id", scope)
        : niveauxBase.is("archive_le", null),
      supabase.from("coefficients_matiere").select("matiere_id, niveau_id, coefficient"),
    ]);

  const coefsByMatiere = new Map<string, { niveau_id: string; coefficient: number }[]>();
  (coefsData ?? []).forEach((c) => {
    const list = coefsByMatiere.get(c.matiere_id) ?? [];
    list.push({ niveau_id: c.niveau_id, coefficient: c.coefficient });
    coefsByMatiere.set(c.matiere_id, list);
  });

  const niveauById = new Map(
    (niveauxData ?? []).map((n) => [n.id, n])
  );

  const groups = new Map<string, MatiereGroup>();

  (matieresData ?? []).forEach((m: {
    id: string;
    code: string;
    nom: string;
    couleur: string | null;
    ordre: number;
    actif: boolean;
    etablissement_id: string;
    etablissements: { nom: string } | { nom: string }[] | null;
  }) => {
    const etab = Array.isArray(m.etablissements) ? m.etablissements[0] : m.etablissements;
    const group = groups.get(m.etablissement_id) ?? {
      etablissement_id: m.etablissement_id,
      etablissement_nom: etab?.nom ?? "Inconnu",
      matieres: [],
      niveaux: (niveauxData ?? [])
        .filter((n) => n.etablissement_id === m.etablissement_id)
        .map((n) => ({ id: n.id, libelle: n.libelle, cycle: n.cycle, ordre: n.ordre })),
    };
    const coefs = (coefsByMatiere.get(m.id) ?? [])
      .map((c) => ({
        niveau_id: c.niveau_id,
        niveau_libelle: niveauById.get(c.niveau_id)?.libelle ?? "?",
        coefficient: c.coefficient,
      }))
      .filter((c) => c.niveau_libelle !== "?");
    group.matieres.push({
      id: m.id,
      code: m.code,
      nom: m.nom,
      couleur: m.couleur,
      ordre: m.ordre,
      actif: m.actif,
      etablissement_id: m.etablissement_id,
      etablissement_nom: etab?.nom ?? "Inconnu",
      coefficients: coefs,
    });
    groups.set(m.etablissement_id, group);
  });

  // Also include etablissements that have niveaux but no matieres yet
  (niveauxData ?? []).forEach((n) => {
    if (!groups.has(n.etablissement_id)) {
      // No matieres yet, but niveaux exist — still create group
      // Need etab name
    }
  });

  // Fetch etab names for groups without matieres
  const { data: etabsData } = await supabase
    .from("etablissements")
    .select("id, nom")
    .eq("actif", true);
  (etabsData ?? []).forEach((e) => {
    if (!groups.has(e.id)) {
      const niveaux = (niveauxData ?? [])
        .filter((n) => n.etablissement_id === e.id)
        .map((n) => ({ id: n.id, libelle: n.libelle, cycle: n.cycle, ordre: n.ordre }));
      if (niveaux.length > 0) {
        groups.set(e.id, {
          etablissement_id: e.id,
          etablissement_nom: e.nom,
          matieres: [],
          niveaux,
        });
      }
    }
  });

  return Array.from(groups.values()).sort((a, b) =>
    a.etablissement_nom.localeCompare(b.etablissement_nom)
  );
}
