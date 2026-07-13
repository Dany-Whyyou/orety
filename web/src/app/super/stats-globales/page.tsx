import { Building2, FileText, GraduationCap, School, Users, UsersRound } from "lucide-react";
import { getStatsGlobales } from "@/lib/queries/super";

export const dynamic = "force-dynamic";

export default async function Page() {
  const stats = await getStatsGlobales();

  const kpis = [
    { label: "Organisations", valeur: stats.organisations, icon: Building2 },
    { label: "Établissements", valeur: stats.etablissements, icon: School },
    { label: "Élèves actifs", valeur: stats.eleves, icon: GraduationCap },
    { label: "Professeurs", valeur: stats.profs, icon: Users },
    { label: "Parents", valeur: stats.parents, icon: UsersRound },
    { label: "Bulletins", valeur: stats.bulletins, icon: FileText },
  ];

  const maxEleves = Math.max(1, ...stats.parOrganisation.map((o) => o.eleves));

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Stats globales</h1>
        <p className="text-sm text-muted-foreground">Vue d&apos;ensemble de la plateforme.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary-50 text-primary">
              <kpi.icon className="size-4" />
            </div>
            <p className="font-display text-2xl font-bold">
              {kpi.valeur.toLocaleString("fr-FR")}
            </p>
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display font-bold">Élèves par organisation</h2>
        <div className="mt-4 space-y-3">
          {stats.parOrganisation.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune organisation.</p>
          ) : (
            stats.parOrganisation.map((o) => (
              <div key={o.nom}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{o.nom}</span>
                  <span className="text-muted-foreground">
                    {o.eleves.toLocaleString("fr-FR")} élèves · {o.utilisateurs} comptes
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${(o.eleves / maxEleves) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
