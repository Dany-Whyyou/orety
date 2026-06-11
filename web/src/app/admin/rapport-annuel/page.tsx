import { FileText, Award, Users, GraduationCap, RotateCcw, XCircle, ArrowRightLeft, LogOut, TrendingUp, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { RapportSelector, PrintButton } from "@/components/rapport-annuel/selector";
import {
  getAnneesDisponibles,
  getEtablissementsDispo,
  getRapportAnnuel,
} from "@/lib/queries/rapport-annuel";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const cycleLabels: Record<string, string> = {
  prescolaire: "Préprimaire",
  primaire: "Primaire",
  college: "Collège",
  lycee: "Lycée",
  autre: "Autre",
};

const incidentTypeLabels: Record<string, string> = {
  sante: "Santé",
  comportement: "Comportement",
  securite: "Sécurité",
  materiel: "Matériel",
  academique: "Académique",
  autre: "Autre",
};

const graviteLabels: Record<string, string> = {
  info: "Info",
  mineur: "Mineur",
  moyen: "Moyen",
  grave: "Grave",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ annee?: string; etab?: string }>;
}) {
  const params = await searchParams;
  const annees = await getAnneesDisponibles();
  const etablissements = await getEtablissementsDispo();

  // Defaults: année active si présente, sinon première
  const defaultAnnee = annees.find((a) => a.active) ?? annees[0];
  const anneeId = params.annee || defaultAnnee?.id || "";
  const etabId = params.etab || null;

  const rapport = anneeId ? await getRapportAnnuel(anneeId, etabId) : null;

  return (
    <div className="max-w-[1600px] mx-auto">
      <div className="print:hidden">
        <PageHeader
          title="Rapport annuel"
          description="Vue complète d'une année scolaire — imprimable"
          icon={<FileText className="size-5" />}
          breadcrumbs={[{ label: "Rapport annuel" }]}
        />
      </div>

      <div className="print:hidden">
        <RapportSelector
          annees={annees}
          etablissements={etablissements}
          currentAnneeId={anneeId}
          currentEtabId={etabId}
        />
      </div>

      {!rapport ? (
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-12 text-center print:hidden">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mx-auto flex items-center justify-center text-primary mb-4">
            <FileText className="size-6" />
          </div>
          <p className="font-semibold">Sélectionnez une année scolaire</p>
        </div>
      ) : (
        <>
          <div className="print:hidden flex justify-end mb-4">
            <PrintButton />
          </div>

          <RapportContent rapport={rapport} />
        </>
      )}
    </div>
  );
}

function RapportContent({ rapport: r }: { rapport: Awaited<ReturnType<typeof getRapportAnnuel>> }) {
  if (!r) return null;
  return (
    <article className="bg-white print:bg-white rounded-2xl border border-border/50 print:border-none overflow-hidden">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-500 to-accent text-white p-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-20 dot-pattern" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold opacity-80">
              {r.organisation_nom}
            </p>
            <h1 className="font-display text-3xl font-bold mt-1">Rapport annuel {r.annee_libelle}</h1>
            <p className="text-sm opacity-90 mt-1">
              {r.etablissement_nom ?? "Tous les établissements"}
            </p>
          </div>
          <div className="text-right text-[10px] opacity-70">
            <p>Du {formatDate(r.date_debut)}</p>
            <p>Au {formatDate(r.date_fin)}</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* KPIs */}
        <section>
          <h2 className="font-display text-lg font-semibold mb-4">Vue d'ensemble</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Kpi label="Effectif" value={r.effectif} icon={<Users className="size-4" />} />
            <Kpi
              label="Moyenne gén."
              value={r.moyenne_generale?.toFixed(2) ?? "—"}
              icon={<Award className="size-4" />}
              suffix="/20"
            />
            <Kpi
              label="Réussite"
              value={r.taux_reussite !== null ? `${r.taux_reussite.toFixed(1)}%` : "—"}
              icon={<TrendingUp className="size-4" />}
              accent="primary"
            />
            <Kpi label="Admis" value={r.nb_admis} accent="success" />
            <Kpi label="Redouble" value={r.nb_redoublants} accent="warning" />
            <Kpi label="Diplômés" value={r.nb_diplomes} accent="primary" />
          </div>
        </section>

        {/* Répartition par cycle */}
        {r.repartition_cycle.length > 0 && (
          <section>
            <h2 className="font-display text-lg font-semibold mb-4">Répartition par cycle</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {r.repartition_cycle.map((c) => (
                <div
                  key={c.cycle}
                  className="rounded-xl border border-border bg-card p-4 flex items-center justify-between"
                >
                  <span className="text-sm font-medium">{cycleLabels[c.cycle] ?? c.cycle}</span>
                  <span className="font-display text-xl font-bold">{c.count}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Classes */}
        <section>
          <h2 className="font-display text-lg font-semibold mb-4">Résultats par classe</h2>
          {r.classes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune classe.</p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="text-left font-medium text-[10px] uppercase tracking-wide text-muted-foreground px-3 py-2">
                      Classe
                    </th>
                    <th className="text-left font-medium text-[10px] uppercase tracking-wide text-muted-foreground px-3 py-2">
                      Niveau
                    </th>
                    <th className="text-right font-medium text-[10px] uppercase tracking-wide text-muted-foreground px-3 py-2">
                      Effectif
                    </th>
                    <th className="text-right font-medium text-[10px] uppercase tracking-wide text-muted-foreground px-3 py-2">
                      Moyenne
                    </th>
                    <th className="text-right font-medium text-[10px] uppercase tracking-wide text-muted-foreground px-3 py-2">
                      Admis
                    </th>
                    <th className="text-right font-medium text-[10px] uppercase tracking-wide text-muted-foreground px-3 py-2">
                      Redouble
                    </th>
                    <th className="text-right font-medium text-[10px] uppercase tracking-wide text-muted-foreground px-3 py-2">
                      Réussite
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {r.classes.map((c) => {
                    const total = c.nb_admis + c.nb_redoublants;
                    const reussite = total > 0 ? (c.nb_admis / total) * 100 : 0;
                    return (
                      <tr key={c.classe_nom} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 font-medium">{c.classe_nom}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{c.niveau_libelle}</td>
                        <td className="px-3 py-2 text-right font-mono">{c.effectif}</td>
                        <td className="px-3 py-2 text-right">
                          <span
                            className={cn(
                              "font-mono font-semibold",
                              c.moyenne !== null && c.moyenne >= 16 && "text-emerald-600",
                              c.moyenne !== null && c.moyenne < 10 && "text-danger"
                            )}
                          >
                            {c.moyenne !== null ? c.moyenne.toFixed(2) : "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-emerald-600">
                          {c.nb_admis}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-warning">
                          {c.nb_redoublants}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {total > 0 ? (
                            <Badge
                              variant={reussite >= 75 ? "success" : "warning"}
                              className="font-mono"
                            >
                              {reussite.toFixed(0)}%
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Top élèves */}
        <section>
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="size-4 text-amber-500" />
            Top 10 élèves
          </h2>
          {r.top_eleves.length === 0 ? (
            <p className="text-sm text-muted-foreground">Pas assez de bulletins pour établir un classement.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {r.top_eleves.map((e, i) => (
                <div
                  key={e.eleve_id + i}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
                >
                  <div
                    className={cn(
                      "size-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0",
                      i === 0 && "bg-gradient-to-br from-amber-400 to-amber-600 text-white",
                      i === 1 && "bg-gradient-to-br from-slate-300 to-slate-500 text-white",
                      i === 2 && "bg-gradient-to-br from-amber-700 to-amber-900 text-white",
                      i > 2 && "bg-muted text-muted-foreground"
                    )}
                  >
                    #{i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {e.prenom} {e.nom}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {e.matricule} · {e.classe_nom}
                    </p>
                  </div>
                  <Badge
                    variant={e.moyenne >= 16 ? "success" : "outline"}
                    className="text-xs font-mono"
                  >
                    {e.moyenne.toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Évolution */}
        {r.evolution_trimestrielle.length > 0 && (
          <section>
            <h2 className="font-display text-lg font-semibold mb-4">Évolution des moyennes</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {r.evolution_trimestrielle.map((p) => (
                <div
                  key={p.periode}
                  className="rounded-xl border border-border bg-card p-4 text-center"
                >
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {p.periode}
                  </p>
                  <p className="font-display text-2xl font-bold mt-1">
                    {p.moyenne !== null ? p.moyenne.toFixed(2) : "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">/20</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Incidents */}
        {(r.incidents_par_type.length > 0 || r.incidents_par_gravite.length > 0) && (
          <section>
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="size-4 text-warning" />
              Incidents signalés
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {r.incidents_par_type.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Par type
                  </h3>
                  <div className="space-y-1.5">
                    {r.incidents_par_type.map((i) => (
                      <div key={i.type} className="flex items-center justify-between text-sm">
                        <span>{incidentTypeLabels[i.type] ?? i.type}</span>
                        <span className="font-mono font-semibold">{i.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {r.incidents_par_gravite.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Par gravité
                  </h3>
                  <div className="space-y-1.5">
                    {r.incidents_par_gravite.map((i) => (
                      <div key={i.gravite} className="flex items-center justify-between text-sm">
                        <span>{graviteLabels[i.gravite] ?? i.gravite}</span>
                        <span
                          className={cn(
                            "font-mono font-semibold",
                            i.gravite === "grave" && "text-danger",
                            i.gravite === "moyen" && "text-warning"
                          )}
                        >
                          {i.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Devenir des élèves */}
        <section>
          <h2 className="font-display text-lg font-semibold mb-4">Devenir des élèves</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            <DevenirTile icon={Award} label="Admis" value={r.nb_admis} color="text-emerald-600" />
            <DevenirTile icon={RotateCcw} label="Redouble" value={r.nb_redoublants} color="text-warning" />
            <DevenirTile icon={GraduationCap} label="Diplômés" value={r.nb_diplomes} color="text-primary" />
            <DevenirTile icon={ArrowRightLeft} label="Transférés" value={r.nb_transferes} color="text-accent" />
            <DevenirTile icon={LogOut} label="Abandon" value={r.nb_abandons} color="text-slate-500" />
            <DevenirTile icon={XCircle} label="Exclus" value={r.nb_exclus} color="text-danger" />
          </div>
        </section>

        {/* Signature */}
        <section className="pt-6 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <div>
            <p>Rapport généré le {new Date().toLocaleDateString("fr-FR")}</p>
            <p className="italic mt-1 font-semibold text-foreground">
              « Persévérance — Excellence »
            </p>
          </div>
          <div className="text-right">
            <p>Signature du chef d&apos;établissement</p>
            <div className="mt-8 w-40 h-px bg-border ml-auto" />
          </div>
        </section>
      </div>
    </article>
  );
}

function Kpi({
  label,
  value,
  icon,
  suffix,
  accent = "default",
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  suffix?: string;
  accent?: "default" | "primary" | "success" | "warning";
}) {
  const color = {
    default: "text-foreground",
    primary: "text-primary",
    success: "text-emerald-600",
    warning: "text-warning",
  }[accent];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p className={cn("font-display text-2xl font-bold", color)}>
        {value}
        {suffix && <span className="text-sm text-muted-foreground font-normal ml-1">{suffix}</span>}
      </p>
    </div>
  );
}

function DevenirTile({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-3 text-center">
      <Icon className={cn("size-4 mx-auto mb-1", color)} />
      <p className={cn("font-display text-xl font-bold", color)}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "?";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
