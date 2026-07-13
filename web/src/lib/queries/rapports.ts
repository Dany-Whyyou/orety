import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type RapportData = {
  totalEleves: number;
  totalProfs: number;
  totalClasses: number;
  totalEvaluations: number;
  totalBulletins: number;
  moyenneGenerale: number | null;
  tauxPresence: number | null;
  repartitionCycle: { cycle: string; count: number }[];
  moyennesParClasse: { classe_id: string; classe_nom: string; niveau_libelle: string; cycle: string; moyenne: number; effectif: number }[];
  topEleves: { eleve_id: string; prenom: string; nom: string; matricule: string; classe_nom: string; moyenne: number }[];
  evolutionEffectifs: { mois: string; primaire: number; college: number; lycee: number }[];
  distributionMoyennes: { plage: string; count: number; color: string }[];
};

export async function getRapportData(): Promise<RapportData> {
  const supabase = createAdminClient();

  const [
    { count: elevesCount },
    { count: profsCount },
    { count: classesCount },
    { count: evalCount },
    { count: bulletinCount },
    { data: notes },
    { data: presences },
    { data: elevesByCycle },
    { data: bulletinsDetail },
    { data: inscriptions },
  ] = await Promise.all([
    supabase.from("eleves").select("*", { count: "exact", head: true }).eq("actif", true),
    supabase
      .from("utilisateurs")
      .select("id, role:roles!inner(code)", { count: "exact", head: true })
      .eq("actif", true)
      .eq("role.code", "prof"),
    supabase.from("classes").select("*", { count: "exact", head: true }).is("archive_le", null),
    supabase.from("evaluations").select("*", { count: "exact", head: true }).is("archive_le", null),
    supabase.from("bulletins").select("*", { count: "exact", head: true }).is("archive_le", null),
    supabase
      .from("notes")
      .select("note, bonus, absent, evaluations!inner(bareme, archive_le)")
      .is("evaluations.archive_le", null)
      .limit(10000),
    supabase.from("presences").select("statut").limit(10000),
    supabase
      .from("eleves")
      .select("etablissement_id, etablissements(cycle_principal)")
      .eq("actif", true),
    supabase
      .from("bulletins")
      .select(
        "moyenne_generale, inscriptions(classe_id, eleves(id, nom, prenom, matricule), classes(nom, niveaux(libelle, cycle)))"
      )
      .eq("est_annuel", false)
      .is("archive_le", null)
      .not("moyenne_generale", "is", null),
    supabase
      .from("inscriptions")
      .select("id, date_inscription, eleves(etablissement_id, etablissements(cycle_principal))")
      .eq("statut", "inscrit"),
  ]);

  // Moyenne générale
  let moyenneGenerale: number | null = null;
  if (notes && notes.length > 0) {
    const valid = notes.filter((n) => !n.absent && n.note !== null);
    if (valid.length > 0) {
      const sum = valid.reduce((acc, n) => {
        const evaluation = Array.isArray(n.evaluations) ? n.evaluations[0] : n.evaluations;
        const bareme = Number(evaluation?.bareme) || 20;
        return acc + ((Number(n.note) + Number(n.bonus ?? 0)) / bareme) * 20;
      }, 0);
      moyenneGenerale = sum / valid.length;
    }
  }

  // Taux de présence
  let tauxPresence: number | null = null;
  if (presences && presences.length > 0) {
    const presents = presences.filter(
      (p) => p.statut === "present" || p.statut === "retard"
    ).length;
    tauxPresence = (presents / presences.length) * 100;
  }

  // Répartition par cycle
  const cycleMap = new Map<string, number>();
  (elevesByCycle ?? []).forEach((e) => {
    const rec = e as { etablissements: { cycle_principal: string } | { cycle_principal: string }[] | null };
    const etab = Array.isArray(rec.etablissements) ? rec.etablissements[0] : rec.etablissements;
    const cycle = etab?.cycle_principal ?? "autre";
    cycleMap.set(cycle, (cycleMap.get(cycle) ?? 0) + 1);
  });
  const repartitionCycle = Array.from(cycleMap.entries()).map(([cycle, count]) => ({ cycle, count }));

  // Moyennes par classe + top élèves
  type BulletinRow = {
    moyenne_generale: number;
    inscriptions: {
      classe_id: string;
      eleves: { id: string; nom: string; prenom: string; matricule: string } | { id: string; nom: string; prenom: string; matricule: string }[] | null;
      classes: { nom: string; niveaux: { libelle: string; cycle: string } | { libelle: string; cycle: string }[] | null } | { nom: string; niveaux: { libelle: string; cycle: string } | { libelle: string; cycle: string }[] | null }[] | null;
    } | {
      classe_id: string;
      eleves: { id: string; nom: string; prenom: string; matricule: string } | { id: string; nom: string; prenom: string; matricule: string }[] | null;
      classes: { nom: string; niveaux: { libelle: string; cycle: string } | { libelle: string; cycle: string }[] | null } | { nom: string; niveaux: { libelle: string; cycle: string } | { libelle: string; cycle: string }[] | null }[] | null;
    }[] | null;
  };
  const classeMoyenneMap = new Map<string, { sum: number; n: number; nom: string; niveau: string; cycle: string }>();
  const topElevesList: { eleve_id: string; prenom: string; nom: string; matricule: string; classe_nom: string; moyenne: number }[] = [];

  ((bulletinsDetail ?? []) as BulletinRow[]).forEach((b) => {
    if (b.moyenne_generale === null) return;
    const insc = Array.isArray(b.inscriptions) ? b.inscriptions[0] : b.inscriptions;
    if (!insc) return;
    const eleve = Array.isArray(insc.eleves) ? insc.eleves[0] : insc.eleves;
    const classe = Array.isArray(insc.classes) ? insc.classes[0] : insc.classes;
    const niveau = classe
      ? Array.isArray(classe.niveaux)
        ? classe.niveaux[0]
        : classe.niveaux
      : null;
    const moy = Number(b.moyenne_generale);
    const entry = classeMoyenneMap.get(insc.classe_id) ?? {
      sum: 0,
      n: 0,
      nom: classe?.nom ?? "?",
      niveau: niveau?.libelle ?? "?",
      cycle: niveau?.cycle ?? "autre",
    };
    entry.sum += moy;
    entry.n += 1;
    classeMoyenneMap.set(insc.classe_id, entry);

    if (eleve) {
      topElevesList.push({
        eleve_id: eleve.id,
        prenom: eleve.prenom,
        nom: eleve.nom,
        matricule: eleve.matricule,
        classe_nom: classe?.nom ?? "?",
        moyenne: moy,
      });
    }
  });

  const moyennesParClasse = Array.from(classeMoyenneMap.entries())
    .map(([classe_id, v]) => ({
      classe_id,
      classe_nom: v.nom,
      niveau_libelle: v.niveau,
      cycle: v.cycle,
      moyenne: v.sum / v.n,
      effectif: v.n,
    }))
    .sort((a, b) => b.moyenne - a.moyenne);

  const topEleves = topElevesList.sort((a, b) => b.moyenne - a.moyenne).slice(0, 10);

  // Evolution effectifs (monthly cumulative)
  const monthlyMap = new Map<string, { primaire: number; college: number; lycee: number }>();
  const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

  type InscRow = {
    date_inscription: string;
    eleves: {
      etablissement_id: string;
      etablissements: { cycle_principal: string } | { cycle_principal: string }[] | null;
    } | {
      etablissement_id: string;
      etablissements: { cycle_principal: string } | { cycle_principal: string }[] | null;
    }[] | null;
  };

  ((inscriptions ?? []) as InscRow[]).forEach((i) => {
    const d = new Date(i.date_inscription);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const eleve = Array.isArray(i.eleves) ? i.eleves[0] : i.eleves;
    const etab = eleve
      ? Array.isArray(eleve.etablissements)
        ? eleve.etablissements[0]
        : eleve.etablissements
      : null;
    const cycle = etab?.cycle_principal ?? "autre";
    const entry = monthlyMap.get(key) ?? { primaire: 0, college: 0, lycee: 0 };
    if (cycle === "prescolaire" || cycle === "primaire") entry.primaire += 1;
    else if (cycle === "college") entry.college += 1;
    else if (cycle === "lycee") entry.lycee += 1;
    monthlyMap.set(key, entry);
  });
  const sortedMonths = Array.from(monthlyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  let cumPri = 0, cumCol = 0, cumLyc = 0;
  const evolutionEffectifs = sortedMonths.map(([key, v]) => {
    cumPri += v.primaire;
    cumCol += v.college;
    cumLyc += v.lycee;
    const [, month] = key.split("-");
    return {
      mois: MONTHS_FR[parseInt(month, 10) - 1] ?? key,
      primaire: cumPri,
      college: cumCol,
      lycee: cumLyc,
    };
  });

  // Distribution des moyennes
  const buckets = [
    { plage: "< 8", min: 0, max: 8, count: 0, color: "hsl(var(--danger))" },
    { plage: "8-10", min: 8, max: 10, count: 0, color: "hsl(var(--warning))" },
    { plage: "10-12", min: 10, max: 12, count: 0, color: "hsl(var(--accent))" },
    { plage: "12-14", min: 12, max: 14, count: 0, color: "hsl(var(--accent))" },
    { plage: "14-16", min: 14, max: 16, count: 0, color: "hsl(var(--primary))" },
    { plage: "≥ 16", min: 16, max: 21, count: 0, color: "hsl(var(--primary))" },
  ];
  topElevesList.forEach((e) => {
    const b = buckets.find((x) => e.moyenne >= x.min && e.moyenne < x.max);
    if (b) b.count += 1;
  });

  return {
    totalEleves: elevesCount ?? 0,
    totalProfs: profsCount ?? 0,
    totalClasses: classesCount ?? 0,
    totalEvaluations: evalCount ?? 0,
    totalBulletins: bulletinCount ?? 0,
    moyenneGenerale,
    tauxPresence,
    repartitionCycle,
    moyennesParClasse,
    topEleves,
    evolutionEffectifs,
    distributionMoyennes: buckets.map(({ plage, count, color }) => ({ plage, count, color })),
  };
}
