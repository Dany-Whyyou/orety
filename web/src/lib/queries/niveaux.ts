import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEtabScope } from "@/lib/auth";

export type Cycle = "prescolaire" | "primaire" | "college" | "lycee";

export type NiveauItem = {
  id: string;
  code: string;
  libelle: string;
  cycle: Cycle;
  ordre: number;
  etablissement_id: string;
  etablissement_nom: string;
};

export type NiveauGroup = {
  etablissement_id: string;
  etablissement_nom: string;
  niveaux: NiveauItem[];
};

export async function getNiveaux(): Promise<NiveauGroup[]> {
  const supabase = createAdminClient();
  const scope = await getEtabScope();

  const base = supabase
    .from("niveaux")
    .select("id, code, libelle, cycle, ordre, etablissement_id, etablissements(nom)")
    .order("ordre");
  const filtre = base.is("archive_le", null);
  const { data, error } = await (scope ? filtre.eq("etablissement_id", scope) : filtre);

  if (error) {
    console.error("getNiveaux:", error);
    return [];
  }

  const map = new Map<string, NiveauGroup>();
  (data ?? []).forEach((n: {
    id: string;
    code: string;
    libelle: string;
    cycle: Cycle;
    ordre: number;
    etablissement_id: string;
    etablissements: { nom: string } | { nom: string }[] | null;
  }) => {
    const etab = Array.isArray(n.etablissements) ? n.etablissements[0] : n.etablissements;
    const group = map.get(n.etablissement_id) ?? {
      etablissement_id: n.etablissement_id,
      etablissement_nom: etab?.nom ?? "Inconnu",
      niveaux: [],
    };
    group.niveaux.push({
      id: n.id,
      code: n.code,
      libelle: n.libelle,
      cycle: n.cycle,
      ordre: n.ordre,
      etablissement_id: n.etablissement_id,
      etablissement_nom: etab?.nom ?? "Inconnu",
    });
    map.set(n.etablissement_id, group);
  });

  return Array.from(map.values()).sort((a, b) =>
    a.etablissement_nom.localeCompare(b.etablissement_nom)
  );
}
