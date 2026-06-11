import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type Cycle = "prescolaire" | "primaire" | "college" | "lycee";

export type EtablissementListItem = {
  id: string;
  slug: string;
  nom: string;
  cycle_principal: Cycle;
  cycles_couverts: Cycle[];
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  slogan: string | null;
  logo_url: string | null;
  couleur_primaire: string | null;
  actif: boolean;
  effectif: number;
};

export async function getEtablissements(): Promise<EtablissementListItem[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("etablissements")
    .select("*")
    .order("nom");

  if (error) {
    console.error("getEtablissements:", error);
    return [];
  }

  // Count élèves per établissement
  const counts = await Promise.all(
    (data ?? []).map(async (e) => {
      const { count } = await supabase
        .from("eleves")
        .select("*", { count: "exact", head: true })
        .eq("etablissement_id", e.id)
        .eq("actif", true);
      return [e.id, count ?? 0] as const;
    })
  );
  const countMap = new Map(counts);

  return (data ?? []).map((e) => ({
    id: e.id,
    slug: e.slug,
    nom: e.nom,
    cycle_principal: e.cycle_principal,
    cycles_couverts: e.cycles_couverts,
    adresse: e.adresse,
    telephone: e.telephone,
    email: e.email,
    slogan: e.slogan,
    logo_url: e.logo_url,
    couleur_primaire: e.couleur_primaire,
    actif: e.actif,
    effectif: countMap.get(e.id) ?? 0,
  }));
}
