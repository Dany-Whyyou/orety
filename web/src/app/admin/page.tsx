import {
  GraduationCap,
  Users,
  BookOpenCheck,
  TrendingUp,
  UserPlus,
  ClipboardList,
  Megaphone,
  AlertTriangle,
} from "lucide-react";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { StatCard } from "@/components/dashboard/stat-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { EnrollmentChart } from "@/components/dashboard/enrollment-chart";
import { ActivityFeed, type ActivityItem } from "@/components/dashboard/activity-feed";
import { TopClasses } from "@/components/dashboard/top-classes";
import { getDashboardStats } from "@/lib/queries/dashboard";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function tempsRelatif(dateIso: string): string {
  const diff = Date.now() - new Date(dateIso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.floor(h / 24);
  if (j < 30) return `il y a ${j} j`;
  return new Date(dateIso).toLocaleDateString("fr-FR");
}

const activiteVisuel: Record<string, { icon: React.ReactNode; color: string }> = {
  inscription: { icon: <UserPlus className="size-3.5" />, color: "bg-primary/10 text-primary" },
  evaluation: { icon: <ClipboardList className="size-3.5" />, color: "bg-accent/10 text-accent" },
  annonce: { icon: <Megaphone className="size-3.5" />, color: "bg-warning/10 text-warning" },
  incident: { icon: <AlertTriangle className="size-3.5" />, color: "bg-danger/10 text-danger" },
};

export default async function DashboardPage() {
  const [stats, user] = await Promise.all([getDashboardStats(), getCurrentUser()]);

  const activityItems: ActivityItem[] = stats.activite.map((a) => ({
    icon: activiteVisuel[a.type]?.icon ?? <TrendingUp className="size-3.5" />,
    title: a.titre,
    detail: a.detail,
    time: tempsRelatif(a.date),
    color: activiteVisuel[a.type]?.color ?? "bg-muted text-muted-foreground",
  }));

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <WelcomeBanner
        firstName={user?.prenom ?? user?.nom ?? user?.pseudo ?? ""}
        anneeLibelle={stats.anneeActive?.libelle ?? null}
        periodeLibelle={stats.periodeActive?.libelle ?? null}
      />

      <QuickActions />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Élèves inscrits"
          value={stats.eleves}
          icon={<Users className="size-5" />}
          accent="primary"
          delay={0.05}
          hint="Total actifs"
        />
        <StatCard
          label="Professeurs actifs"
          value={stats.profs}
          icon={<GraduationCap className="size-5" />}
          accent="accent"
          delay={0.1}
          hint="Comptes actifs"
        />
        <StatCard
          label="Moyenne générale"
          value={stats.moyenne}
          icon={<BookOpenCheck className="size-5" />}
          accent="warning"
          delay={0.15}
          hint="Sur 20, toutes notes confondues"
        />
        <StatCard
          label="Taux de présence"
          value={stats.tauxPresence}
          format="percent"
          icon={<TrendingUp className="size-5" />}
          accent="primary"
          delay={0.2}
          hint="Sur les séances saisies"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <EnrollmentChart data={stats.effectifsParMois} />
        </div>
        <TopClasses classes={stats.topClasses} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ActivityFeed items={activityItems} />
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <DistributionCard
            segments={stats.repartitionCycle}
            totalEleves={stats.eleves}
          />
          <SchoolHealthCard sante={stats.sante} />
        </div>
      </section>
    </div>
  );
}

const cycleColorsHsl: Record<string, string> = {
  prescolaire: "hsl(var(--warning))",
  primaire: "hsl(var(--warning))",
  college: "hsl(var(--accent))",
  lycee: "hsl(var(--primary))",
};

const cycleLabels: Record<string, string> = {
  prescolaire: "Préprimaire",
  primaire: "Primaire",
  college: "Collège",
  lycee: "Lycée",
  autre: "Autre",
};

function DistributionCard({
  segments,
  totalEleves,
}: {
  segments: { cycle: string; count: number }[];
  totalEleves: number;
}) {
  const total = segments.reduce((s, x) => s + x.count, 0);
  const hasData = total > 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5">
      <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full bg-accent/8 blur-3xl" />
      <div className="relative">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Répartition par cycle</p>
        <p className="font-display text-2xl font-bold mt-1">
          {hasData ? `${totalEleves.toLocaleString("fr-FR")} élèves` : "Aucun élève"}
        </p>
      </div>
      {hasData ? (
        <>
          <div className="mt-4 flex h-2.5 w-full rounded-full overflow-hidden bg-secondary relative">
            {segments.map((s, i) => (
              <div
                key={s.cycle}
                className="h-full transition-all"
                style={{
                  width: `${(s.count / total) * 100}%`,
                  backgroundColor: cycleColorsHsl[s.cycle] ?? "hsl(var(--muted))",
                  marginLeft: i === 0 ? 0 : 2,
                }}
              />
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {segments.map((s) => (
              <div key={s.cycle} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ backgroundColor: cycleColorsHsl[s.cycle] ?? "hsl(var(--muted))" }} />
                  <span className="font-medium">{cycleLabels[s.cycle] ?? s.cycle}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{s.count}</span>
                  <span className="font-mono text-[10px]">{((s.count / total) * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-6 text-xs text-muted-foreground">
          Inscrivez vos premiers élèves pour voir la répartition par cycle.
        </p>
      )}
    </div>
  );
}

function SchoolHealthCard({
  sante,
}: {
  sante: { tauxReussite: number | null; tauxPresence: number | null; tauxBulletinsPublies: number | null };
}) {
  const indicateurs = [
    { label: "Taux de réussite (moy. ≥ 10)", valeur: sante.tauxReussite },
    { label: "Taux de présence", valeur: sante.tauxPresence },
    { label: "Bulletins publiés", valeur: sante.tauxBulletinsPublies },
  ];
  const mesures = indicateurs.filter((i) => i.valeur !== null);
  const global =
    mesures.length > 0
      ? mesures.reduce((s, i) => s + (i.valeur ?? 0), 0) / mesures.length
      : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5">
      <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-16 size-44 rounded-full bg-primary/8 blur-3xl" />
      <div className="relative">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Santé de l&apos;établissement</p>
        <p className="font-display text-2xl font-bold mt-1">
          {global !== null ? `${global.toFixed(0)} %` : "En attente de données"}
        </p>
      </div>
      <div className="relative mt-4 space-y-3">
        {indicateurs.map((ind) => (
          <div key={ind.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium">{ind.label}</span>
              <span className="font-mono text-muted-foreground">
                {ind.valeur !== null ? `${ind.valeur.toFixed(0)} %` : "—"}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all ${
                  ind.valeur === null
                    ? "bg-muted"
                    : ind.valeur >= 70
                      ? "bg-primary"
                      : ind.valeur >= 40
                        ? "bg-warning"
                        : "bg-danger"
                }`}
                style={{ width: `${ind.valeur ?? 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
