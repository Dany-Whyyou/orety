import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEtabsVisibles } from "@/lib/auth";

export type DashboardStats = {
  eleves: number;
  profs: number;
  classes: number;
  moyenne: number | null;
  tauxPresence: number | null;
  anneeActive: { id: string; libelle: string } | null;
  periodeActive: { id: string; libelle: string } | null;
  repartitionCycle: { cycle: string; count: number }[];
  effectifsParMois: { mois: string; primaire: number; college: number; lycee: number }[];
  topClasses: {
    nom: string;
    cycle: string;
    effectif: number;
    moyenne: number | null;
  }[];
  activite: { type: string; titre: string; detail: string; date: string }[];
  sante: {
    tauxReussite: number | null;
    tauxPresence: number | null;
    tauxBulletinsPublies: number | null;
  };
};

const MOIS_LABELS = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

function cycleGroupe(cycle: string | null | undefined): "primaire" | "college" | "lycee" {
  if (cycle === "college") return "college";
  if (cycle === "lycee") return "lycee";
  return "primaire"; // préscolaire + primaire regroupés
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createAdminClient();
  const etabs = await getEtabsVisibles();
  // Moyenne et taux de présence calculés en SQL sur TOUTES les lignes
  // (PostgREST plafonne les selects à 1000 lignes → chiffres faux sinon).
  type Agregats = {
    moyenne_generale: number | null;
    taux_presence: number | null;
    nb_notes: number;
    nb_presences: number;
  };
  const rpc = supabase as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: Agregats[] | null }>;
  };
  const { data: agregats } = await rpc.rpc("stats_agregees", { p_etab_ids: etabs });
  const stats = agregats?.[0] ?? null;
  if (etabs.length === 0) {
    return {
      eleves: 0, profs: 0, classes: 0, moyenne: null, tauxPresence: null,
      anneeActive: null, periodeActive: null, repartitionCycle: [],
      effectifsParMois: [], topClasses: [], activite: [],
      sante: { tauxReussite: null, tauxPresence: null, tauxBulletinsPublies: null },
    };
  }

  const [
    { count: elevesCount },
    { count: profsCount },
    { count: classesCount },
    anneeRes,
    { data: elevesByCycle },
  ] = await Promise.all([
    supabase
      .from("eleves")
      .select("*", { count: "exact", head: true })
      .eq("actif", true)
      .is("archive_le", null)
      .in("etablissement_id", etabs),
    supabase
      .from("utilisateurs")
      .select("*, role:roles!inner(code)", { count: "exact", head: true })
      .eq("actif", true)
      .eq("role.code", "prof"),
    supabase
      .from("classes")
      .select("*, niveaux!inner(etablissement_id)", { count: "exact", head: true })
      .is("archive_le", null)
      .in("niveaux.etablissement_id", etabs),
    supabase
      .from("annees_scolaires")
      .select("id, libelle")
      .eq("active", true)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("eleves")
      .select("etablissement_id, etablissements(cycle_principal)")
      .eq("actif", true)
      .is("archive_le", null)
      .in("etablissement_id", etabs),
  ]);

  // Agrégats SQL (toutes les lignes, absents exclus)
  const moyenne = stats?.moyenne_generale !== null && stats?.moyenne_generale !== undefined
    ? Number(stats.moyenne_generale)
    : null;
  const tauxPresence = stats?.taux_presence !== null && stats?.taux_presence !== undefined
    ? Number(stats.taux_presence)
    : null;

  // Répartition par cycle
  const cycleMap = new Map<string, number>();
  (elevesByCycle ?? []).forEach((e: { etablissements: { cycle_principal: string } | { cycle_principal: string }[] | null }) => {
    const etab = Array.isArray(e.etablissements) ? e.etablissements[0] : e.etablissements;
    const cycle = etab?.cycle_principal ?? "autre";
    cycleMap.set(cycle, (cycleMap.get(cycle) ?? 0) + 1);
  });
  const repartitionCycle = Array.from(cycleMap.entries()).map(([cycle, count]) => ({ cycle, count }));

  // Données complémentaires : inscriptions (série mensuelle + top classes),
  // bulletins (réussite/publication), activité récente
  const [
    { data: inscriptionsData },
    { data: bulletinsData },
    { data: dernieresInscriptions },
    { data: dernieresEvals },
    { data: dernieresAnnonces },
    { data: derniersIncidents },
  ] = await Promise.all([
    supabase
      .from("inscriptions")
      .select("date_inscription, classe_id, classes!inner(nom, archive_le, niveaux(cycle))")
      .in("statut", ["inscrit", "reinscrit"])
      .is("classes.archive_le", null)
      .limit(5000),
    supabase
      .from("bulletins")
      .select("moyenne_generale, publie, inscriptions(classe_id)")
      .eq("est_annuel", false)
      .is("archive_le", null)
      .limit(5000),
    supabase
      .from("inscriptions")
      .select("cree_le, eleves(nom, prenom), classes(nom)")
      .order("cree_le", { ascending: false })
      .limit(4),
    supabase
      .from("evaluations")
      .select("cree_le, titre, affectations(classes(nom))")
      .is("archive_le", null)
      .order("cree_le", { ascending: false })
      .limit(3),
    supabase
      .from("annonces")
      .select("cree_le, titre")
      .is("archive_le", null)
      .order("cree_le", { ascending: false })
      .limit(2),
    supabase
      .from("incidents")
      .select("cree_le, titre, gravite")
      .is("archive_le", null)
      .order("cree_le", { ascending: false })
      .limit(2),
  ]);

  const un = <T,>(v: T | T[] | null | undefined): T | null | undefined =>
    Array.isArray(v) ? v[0] : v;

  // Série cumulée des effectifs par mois (12 derniers mois)
  const effectifsParMois: DashboardStats["effectifsParMois"] = [];
  {
    const maintenant = new Date();
    const mois: { annee: number; mois: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
      mois.push({ annee: d.getFullYear(), mois: d.getMonth() });
    }
    const parGroupe = { primaire: 0, college: 0, lycee: 0 };
    const parMoisGroupe = new Map<string, { primaire: number; college: number; lycee: number }>();
    (inscriptionsData ?? []).forEach((ins) => {
      const classe = un(ins.classes);
      const niveau = un(classe?.niveaux);
      const d = ins.date_inscription ? new Date(ins.date_inscription) : null;
      if (!d) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const groupe = cycleGroupe(niveau?.cycle);
      const entry = parMoisGroupe.get(key) ?? { primaire: 0, college: 0, lycee: 0 };
      entry[groupe] += 1;
      parMoisGroupe.set(key, entry);
    });
    // Cumule les inscriptions antérieures à la fenêtre
    (inscriptionsData ?? []).forEach((ins) => {
      const d = ins.date_inscription ? new Date(ins.date_inscription) : null;
      if (!d) return;
      const debut = new Date(mois[0].annee, mois[0].mois, 1);
      if (d < debut) {
        const classe = un(ins.classes);
        const niveau = un(classe?.niveaux);
        parGroupe[cycleGroupe(niveau?.cycle)] += 1;
      }
    });
    for (const m of mois) {
      const inc = parMoisGroupe.get(`${m.annee}-${m.mois}`) ?? { primaire: 0, college: 0, lycee: 0 };
      parGroupe.primaire += inc.primaire;
      parGroupe.college += inc.college;
      parGroupe.lycee += inc.lycee;
      effectifsParMois.push({
        mois: MOIS_LABELS[m.mois],
        primaire: parGroupe.primaire,
        college: parGroupe.college,
        lycee: parGroupe.lycee,
      });
    }
  }

  // Top 5 classes : effectif + moyenne des bulletins
  const topClasses: DashboardStats["topClasses"] = [];
  {
    const parClasse = new Map<
      string,
      { nom: string; cycle: string; effectif: number; totalMoy: number; nMoy: number }
    >();
    (inscriptionsData ?? []).forEach((ins) => {
      const classe = un(ins.classes);
      const niveau = un(classe?.niveaux);
      if (!ins.classe_id || !classe) return;
      const e = parClasse.get(ins.classe_id) ?? {
        nom: classe.nom,
        cycle: niveau?.cycle ?? "autre",
        effectif: 0,
        totalMoy: 0,
        nMoy: 0,
      };
      e.effectif += 1;
      parClasse.set(ins.classe_id, e);
    });
    (bulletinsData ?? []).forEach((b) => {
      const ins = un(b.inscriptions);
      if (!ins?.classe_id || b.moyenne_generale === null) return;
      const e = parClasse.get(ins.classe_id);
      if (!e) return;
      e.totalMoy += Number(b.moyenne_generale);
      e.nMoy += 1;
    });
    topClasses.push(
      ...Array.from(parClasse.values())
        .map((c) => ({
          nom: c.nom,
          cycle: c.cycle,
          effectif: c.effectif,
          moyenne: c.nMoy > 0 ? c.totalMoy / c.nMoy : null,
        }))
        .sort((a, b) => (b.moyenne ?? -1) - (a.moyenne ?? -1) || b.effectif - a.effectif)
        .slice(0, 5)
    );
  }

  // Santé de l'établissement
  const bulletinsAvecMoyenne = (bulletinsData ?? []).filter((b) => b.moyenne_generale !== null);
  const tauxReussite =
    bulletinsAvecMoyenne.length > 0
      ? (bulletinsAvecMoyenne.filter((b) => Number(b.moyenne_generale) >= 10).length /
          bulletinsAvecMoyenne.length) *
        100
      : null;
  const tauxBulletinsPublies =
    (bulletinsData ?? []).length > 0
      ? ((bulletinsData ?? []).filter((b) => b.publie).length / (bulletinsData ?? []).length) * 100
      : null;

  // Flux d'activité récente (fusion multi-sources)
  const activite: DashboardStats["activite"] = [
    ...(dernieresInscriptions ?? []).map((i) => {
      const eleve = un(i.eleves);
      const classe = un(i.classes);
      return {
        type: "inscription",
        titre: "Nouvelle inscription",
        detail: `${eleve?.prenom ?? ""} ${eleve?.nom ?? ""}${classe ? ` — ${classe.nom}` : ""}`.trim(),
        date: i.cree_le,
      };
    }),
    ...(dernieresEvals ?? []).map((e) => {
      const affectation = un(e.affectations);
      const classe = un(affectation?.classes);
      return {
        type: "evaluation",
        titre: "Évaluation créée",
        detail: `${e.titre}${classe ? ` — ${classe.nom}` : ""}`,
        date: e.cree_le,
      };
    }),
    ...(dernieresAnnonces ?? []).map((a) => ({
      type: "annonce",
      titre: "Annonce",
      detail: a.titre,
      date: a.cree_le,
    })),
    ...(derniersIncidents ?? []).map((i) => ({
      type: "incident",
      titre: `Incident (${i.gravite})`,
      detail: i.titre,
      date: i.cree_le,
    })),
  ]
    .filter((a) => a.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

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
    effectifsParMois,
    topClasses,
    activite,
    sante: { tauxReussite, tauxPresence, tauxBulletinsPublies },
  };
}
