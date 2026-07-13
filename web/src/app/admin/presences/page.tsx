import { CalendarCheck, Users, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getPresenceStats } from "@/lib/queries/presences";
import { initials, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const cycleColors: Record<string, string> = {
  prescolaire: "bg-warning/10 text-warning",
  primaire: "bg-warning/10 text-warning",
  college: "bg-accent/10 text-accent",
  lycee: "bg-primary/10 text-primary",
};
const cycleLabels: Record<string, string> = {
  prescolaire: "Préprimaire",
  primaire: "Primaire",
  college: "Collège",
  lycee: "Lycée",
};

export default async function Page() {
  const { summaries, topAbsentees } = await getPresenceStats();

  const totalSeances = summaries.reduce((s, c) => s + c.total_seances, 0);
  const totalAbsences = summaries.reduce((s, c) => s + c.total_absences, 0);
  const totalRetards = summaries.reduce((s, c) => s + c.total_retards, 0);
  const tauxGlobal =
    totalSeances > 0 ? ((totalSeances - totalAbsences) / totalSeances) * 100 : 0;

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Présences"
        description={
          totalSeances === 0
            ? "Aucune séance saisie pour l'instant"
            : `${totalSeances} séance${totalSeances > 1 ? "s" : ""} · ${totalAbsences} absence${totalAbsences > 1 ? "s" : ""}`
        }
        icon={<CalendarCheck className="size-5" />}
        breadcrumbs={[{ label: "Présences" }]}
      />

      {totalSeances === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-12 text-center">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mx-auto flex items-center justify-center text-primary mb-4">
            <CalendarCheck className="size-6" />
          </div>
          <p className="font-semibold">Aucune séance saisie</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Les profs saisissent les présences depuis l&apos;app mobile par séance. Les statistiques
            apparaîtront ici au fur et à mesure.
          </p>
        </div>
      ) : (
        <>
          {/* Global KPIs */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <KpiCard
              label="Séances"
              value={totalSeances}
              icon={<CalendarCheck className="size-4" />}
              accent="primary"
            />
            <KpiCard
              label="Taux de présence"
              value={tauxGlobal}
              format="percent"
              icon={<CheckCircle2 className="size-4" />}
              accent="primary"
            />
            <KpiCard
              label="Absences"
              value={totalAbsences}
              icon={<AlertCircle className="size-4" />}
              accent="danger"
            />
            <KpiCard
              label="Retards"
              value={totalRetards}
              icon={<Clock className="size-4" />}
              accent="warning"
            />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Par classe */}
            <section className="lg:col-span-2 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-semibold text-sm">Par classe</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Taux de présence depuis le début de l&apos;année
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {summaries.length} classe{summaries.length > 1 ? "s" : ""}
                </Badge>
              </div>

              <div className="divide-y divide-border/40">
                {summaries.map((s) => (
                  <div
                    key={s.classe_id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="size-8 rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-primary shrink-0">
                      <Users className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{s.classe_nom}</p>
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                            cycleColors[s.cycle] ?? "bg-muted"
                          )}
                        >
                          {cycleLabels[s.cycle] ?? s.cycle}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {s.total_seances} séance{s.total_seances > 1 ? "s" : ""} · {s.total_absences} abs. · {s.total_retards} retard{s.total_retards > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="shrink-0 w-40">
                      <div className="flex items-center justify-between mb-1 text-[11px]">
                        <span className="font-mono font-semibold">
                          {s.taux_presence.toFixed(1)}%
                        </span>
                      </div>
                      <div className="relative h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={cn(
                            "absolute inset-y-0 left-0 rounded-full",
                            s.taux_presence >= 95 && "bg-gradient-to-r from-emerald-500 to-primary",
                            s.taux_presence >= 85 && s.taux_presence < 95 && "bg-gradient-to-r from-primary to-accent",
                            s.taux_presence < 85 && "bg-gradient-to-r from-warning to-danger"
                          )}
                          style={{ width: `${s.taux_presence}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Top absentéistes */}
            <section className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border/50">
                <h3 className="font-display font-semibold text-sm">Top absentéistes</h3>
                <p className="text-[11px] text-muted-foreground">Les élèves à surveiller</p>
              </div>

              {topAbsentees.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Aucune absence enregistrée 🎉
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {topAbsentees.map((s, i) => (
                    <Link
                      key={s.eleve_id}
                      href={`/admin/eleves?recherche=${encodeURIComponent(s.eleve_nom)}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors"
                    >
                      <span className="size-6 rounded-md bg-muted/40 text-muted-foreground flex items-center justify-center text-[10px] font-semibold shrink-0">
                        {i + 1}
                      </span>
                      <Avatar className="size-7 shrink-0">
                        <AvatarFallback className="text-[10px]">
                          {initials(s.eleve_nom, s.eleve_prenom)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {s.eleve_prenom} {s.eleve_nom}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {s.classe_nom}
                        </p>
                      </div>
                      <Badge variant="danger" className="text-[10px] font-mono">
                        {s.absent} abs.
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="mt-6 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-xs text-muted-foreground">
            💡 La saisie détaillée des présences se fait depuis <strong>l&apos;app mobile Orety Prof</strong>,
            par séance. Cette page est une vue de supervision.
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  format,
  icon,
  accent,
}: {
  label: string;
  value: number;
  format?: "percent";
  icon: React.ReactNode;
  accent: "primary" | "danger" | "warning";
}) {
  const accentGrad = {
    primary: "from-primary to-primary-500",
    danger: "from-danger to-danger/70",
    warning: "from-warning to-warning/70",
  }[accent];
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card/60 backdrop-blur-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <div
          className={cn(
            "size-7 rounded-md bg-gradient-to-br text-white flex items-center justify-center",
            accentGrad
          )}
        >
          {icon}
        </div>
      </div>
      <p className="font-display text-2xl font-bold">
        {format === "percent" ? `${value.toFixed(1)}%` : value.toLocaleString("fr-FR")}
      </p>
    </div>
  );
}
