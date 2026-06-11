import Link from "next/link";
import {
  Archive,
  Calendar,
  Users,
  Award,
  GraduationCap,
  RotateCcw,
  XCircle,
  FileText,
  ExternalLink,
  ArrowRightLeft,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { getArchives } from "@/lib/queries/archives";

export const dynamic = "force-dynamic";

export default async function Page() {
  const archives = await getArchives();

  // Group by annee
  const byAnnee = new Map<
    string,
    { annee_libelle: string; date_debut: string; date_fin: string; items: typeof archives }
  >();
  archives.forEach((a) => {
    const g = byAnnee.get(a.annee_scolaire_id) ?? {
      annee_libelle: a.annee_libelle,
      date_debut: a.annee_date_debut,
      date_fin: a.annee_date_fin,
      items: [],
    };
    g.items.push(a);
    byAnnee.set(a.annee_scolaire_id, g);
  });

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Archives"
        description={
          archives.length === 0
            ? "Aucune année archivée"
            : `${byAnnee.size} année${byAnnee.size > 1 ? "s" : ""} clôturée${byAnnee.size > 1 ? "s" : ""}`
        }
        icon={<Archive className="size-5" />}
        breadcrumbs={[{ label: "Archives" }]}
      />

      {archives.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-12 text-center">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mx-auto flex items-center justify-center text-primary mb-4">
            <Archive className="size-6" />
          </div>
          <p className="font-semibold">Aucune année archivée</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Les années clôturées apparaîtront ici avec leur snapshot de statistiques.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(byAnnee.entries()).map(([anneeId, group]) => (
            <div key={anneeId} className="animate-fade-up">
              <div className="flex items-center gap-2 mb-3">
                <div className="size-9 rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-primary">
                  <Calendar className="size-4" />
                </div>
                <h2 className="font-display text-lg font-bold">{group.annee_libelle}</h2>
                <span className="text-[11px] text-muted-foreground">
                  Du {formatDate(group.date_debut)} au {formatDate(group.date_fin)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.items.map((a) => (
                  <div
                    key={a.id}
                    className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5"
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-primary/5 blur-3xl"
                    />
                    <div className="relative flex items-start justify-between gap-2 mb-4">
                      <div className="min-w-0">
                        <h3 className="font-display font-semibold truncate">
                          {a.etablissement_nom ?? "Tous établissements"}
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Clôturée le {formatDate(a.cloturee_le)}
                          {a.cloturee_par_pseudo && (
                            <> par {a.cloturee_par_nom || a.cloturee_par_pseudo}</>
                          )}
                        </p>
                      </div>
                      <Link
                        href={`/admin/rapport-annuel?annee=${a.annee_scolaire_id}&etab=${a.etablissement_id ?? ""}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary-700"
                      >
                        Voir rapport <ExternalLink className="size-3" />
                      </Link>
                    </div>

                    <div className="relative grid grid-cols-2 gap-3 mb-3">
                      <StatBox
                        label="Effectif"
                        value={a.effectif_fin_annee}
                        icon={<Users className="size-3.5" />}
                      />
                      <StatBox
                        label="Moyenne gén."
                        value={a.moyenne_generale_etablissement?.toFixed(2) ?? "—"}
                        icon={<Award className="size-3.5" />}
                      />
                    </div>

                    <div className="relative grid grid-cols-5 gap-1.5">
                      <Chip
                        icon={Award}
                        value={a.nb_admis}
                        label="Admis"
                        color="text-emerald-600"
                      />
                      <Chip
                        icon={RotateCcw}
                        value={a.nb_redoublants}
                        label="Redouble"
                        color="text-warning"
                      />
                      <Chip
                        icon={GraduationCap}
                        value={a.nb_diplomes}
                        label="Diplômés"
                        color="text-primary"
                      />
                      <Chip
                        icon={ArrowRightLeft}
                        value={a.nb_transferes}
                        label="Transf."
                        color="text-accent"
                      />
                      <Chip
                        icon={XCircle}
                        value={a.nb_exclus}
                        label="Exclus"
                        color="text-danger"
                      />
                    </div>

                    {a.taux_reussite !== null && (
                      <div className="relative mt-3 pt-3 border-t border-border/50">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-medium">Taux de réussite</span>
                          <Badge
                            variant={a.taux_reussite >= 80 ? "success" : "warning"}
                            className="font-mono"
                          >
                            {a.taux_reussite.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="relative h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent"
                            style={{ width: `${a.taux_reussite}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <p className="font-display text-lg font-bold mt-0.5">{value}</p>
    </div>
  );
}

function Chip({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-background/40 px-2 py-1.5 text-center">
      <Icon className={`size-3 mx-auto mb-0.5 ${color}`} />
      <p className={`font-mono text-sm font-bold ${color}`}>{value}</p>
      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</p>
    </div>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "?";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
