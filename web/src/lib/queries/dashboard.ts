import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type DashboardStats = {
  eleves: number;
  profs: number;
  classes: number;
  moyenne: number | null;
  tauxPresence: number | null;
  anneeActive: { id: string; libelle: string } | null;
  periodeActive: { id: string; libelle: string } | null;
  repartitionCycle: { cycle: string; count: number }[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createAdminClient();

  const [
    { count: elevesCount },
    { count: profsCount },
    { count: classesCount },
    anneeRes,
    { data: notesData },
    { data: presencesData },
    { data: elevesByCycle },
  ] = await Promise.all([
    supabase.from("eleves").select("*", { count: "exact", head: true }).eq("actif", true),
    supabase
      .from("utilisateurs")
      .select("*, role:roles!inner(code)", { count: "exact", head: true })
      .eq("actif", true)
      .eq("role.code", "prof"),
    supabase.from("classes").select("*", { count: "exact", head: true }),
    supabase
      .from("annees_scolaires")
      .select("id, libelle")
      .eq("active", true)
      .limit(1)
      .maybeSingle(),
    supabase.from("notes").select("note, bonus, evaluations(bareme)").limit(1000),
    supabase.from("presences").select("statut").limit(2000),
    supabase
      .from("eleves")
      .select("etablissement_id, etablissements(cycle_principal)")
      .eq("actif", true),
  ]);

  // Moyenne générale (normalisée sur 20)
  let moyenne: number | null = null;
  if (notesData && notesData.length > 0) {
    const sum = notesData.reduce((acc, n) => {
      const evaluation = Array.isArray(n.evaluations) ? n.evaluations[0] : n.evaluations;
      const bareme = Number(evaluation?.bareme) || 20;
      const note = Number(n.note) || 0;
      const bonus = Number(n.bonus) || 0;
      return acc + ((note + bonus) / bareme) * 20;
    }, 0);
    moyenne = sum / notesData.length;
  }

  // Taux de présence
  let tauxPresence: number | null = null;
  if (presencesData && presencesData.length > 0) {
    const presents = presencesData.filter((p) => p.statut === "present" || p.statut === "retard").length;
    tauxPresence = (presents / presencesData.length) * 100;
  }

  // Répartition par cycle
  const cycleMap = new Map<string, number>();
  (elevesByCycle ?? []).forEach((e: { etablissements: { cycle_principal: string } | { cycle_principal: string }[] | null }) => {
    const etab = Array.isArray(e.etablissements) ? e.etablissements[0] : e.etablissements;
    const cycle = etab?.cycle_principal ?? "autre";
    cycleMap.set(cycle, (cycleMap.get(cycle) ?? 0) + 1);
  });
  const repartitionCycle = Array.from(cycleMap.entries()).map(([cycle, count]) => ({ cycle, count }));

  // Période active
  let periodeActive: { id: string; libelle: string } | null = null;
  if (anneeRes.data?.id) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: periode } = await supabase
      .from("periodes_scolaires")
      .select("id, libelle, config_bulletins!inner(annee_scolaire_id)")
      .lte("date_debut", today)
      .gte("date_fin", today)
      .limit(1)
      .maybeSingle();
    if (periode) periodeActive = { id: periode.id, libelle: periode.libelle };
  }

  return {
    eleves: elevesCount ?? 0,
    profs: profsCount ?? 0,
    classes: classesCount ?? 0,
    moyenne,
    tauxPresence,
    anneeActive: anneeRes.data ? { id: anneeRes.data.id, libelle: anneeRes.data.libelle } : null,
    periodeActive,
    repartitionCycle,
  };
}
