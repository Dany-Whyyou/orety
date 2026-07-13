"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  LibraryBig,
  ClipboardList,
  FileText,
  TrendingUp,
  Award,
  BarChart3,
  Download,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, initials, formatNumber } from "@/lib/utils";
import type { RapportData } from "@/lib/queries/rapports";
import { toast } from "sonner";

function exportRapportCsv(data: RapportData) {
  const esc = (v: string | number | null | undefined) =>
    `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lignes: string[] = [];

  lignes.push(esc("RAPPORT ORETY — " + new Date().toLocaleDateString("fr-FR")));
  lignes.push("");
  lignes.push(["Indicateur", "Valeur"].map(esc).join(";"));
  lignes.push([esc("Élèves"), data.totalEleves].join(";"));
  lignes.push([esc("Professeurs"), data.totalProfs].join(";"));
  lignes.push([esc("Classes"), data.totalClasses].join(";"));
  lignes.push([esc("Évaluations"), data.totalEvaluations].join(";"));
  lignes.push([esc("Bulletins"), data.totalBulletins].join(";"));
  lignes.push([
    esc("Moyenne générale"),
    data.moyenneGenerale !== null ? data.moyenneGenerale.toFixed(2) : "",
  ].join(";"));
  lignes.push("");
  lignes.push(esc("MOYENNES PAR CLASSE"));
  lignes.push(["Classe", "Niveau", "Cycle", "Effectif", "Moyenne"].map(esc).join(";"));
  data.moyennesParClasse.forEach((c) => {
    lignes.push(
      [esc(c.classe_nom), esc(c.niveau_libelle), esc(c.cycle), c.effectif, c.moyenne.toFixed(2)].join(";")
    );
  });

  const csv = "﻿" + lignes.join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `rapport-orety-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Rapport exporté en CSV");
}

const CYCLE_COLORS: Record<string, string> = {
  prescolaire: "hsl(var(--warning))",
  primaire: "hsl(var(--warning))",
  college: "hsl(var(--accent))",
  lycee: "hsl(var(--primary))",
};
const CYCLE_LABELS: Record<string, string> = {
  prescolaire: "Préprimaire",
  primaire: "Primaire",
  college: "Collège",
  lycee: "Lycée",
};

type Props = { data: RapportData };

export function RapportsView({ data }: Props) {
  const hasData = data.totalEleves > 0 || data.totalEvaluations > 0;

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="outline" size="sm" disabled={!hasData} onClick={() => exportRapportCsv(data)}>
          <Download /> Exporter CSV
        </Button>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <Kpi label="Élèves" value={data.totalEleves} icon={<Users className="size-4" />} delay={0} />
        <Kpi label="Profs" value={data.totalProfs} icon={<GraduationCap className="size-4" />} delay={0.05} accent="accent" />
        <Kpi label="Classes" value={data.totalClasses} icon={<LibraryBig className="size-4" />} delay={0.1} accent="warning" />
        <Kpi label="Évaluations" value={data.totalEvaluations} icon={<ClipboardList className="size-4" />} delay={0.15} accent="accent" />
        <Kpi label="Bulletins" value={data.totalBulletins} icon={<FileText className="size-4" />} delay={0.2} accent="primary" />
        <Kpi
          label="Moyenne gén."
          value={data.moyenneGenerale}
          format="decimal"
          icon={<Award className="size-4" />}
          delay={0.25}
          accent="primary"
        />
      </section>

      {!hasData ? (
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-12 text-center">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mx-auto flex items-center justify-center text-primary mb-4">
            <BarChart3 className="size-6" />
          </div>
          <p className="font-semibold">Pas encore de données</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Les rapports s&apos;alimentent automatiquement dès les premières inscriptions,
            évaluations et bulletins.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Evolution effectifs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-semibold text-sm">Évolution des effectifs</h3>
                  <p className="text-[11px] text-muted-foreground">Inscriptions cumulées par cycle</p>
                </div>
                <TrendingUp className="size-4 text-muted-foreground" />
              </div>
              {data.evolutionEffectifs.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer>
                    <AreaChart data={data.evolutionEffectifs} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="rap-primaire" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="rap-college" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="rap-lycee" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="mois" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover) / 0.95)",
                          backdropFilter: "blur(12px)",
                          border: "1px solid hsl(var(--border) / 0.6)",
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                        }}
                      />
                      <Area type="monotone" dataKey="primaire" name="Primaire" stroke="hsl(var(--warning))" strokeWidth={2} fill="url(#rap-primaire)" />
                      <Area type="monotone" dataKey="college" name="Collège" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#rap-college)" />
                      <Area type="monotone" dataKey="lycee" name="Lycée" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#rap-lycee)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptySlot message="Pas encore d'inscriptions." />
              )}
            </motion.div>

            {/* Répartition cycle */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5"
            >
              <h3 className="font-display font-semibold text-sm">Répartition par cycle</h3>
              <p className="text-[11px] text-muted-foreground mb-4">Effectif total par cycle</p>
              {data.repartitionCycle.length > 0 ? (
                <>
                  <div className="h-40">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={data.repartitionCycle.map((c) => ({
                            name: CYCLE_LABELS[c.cycle] ?? c.cycle,
                            value: c.count,
                            cycle: c.cycle,
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {data.repartitionCycle.map((c, idx) => (
                            <Cell key={idx} fill={CYCLE_COLORS[c.cycle] ?? "hsl(var(--muted))"} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover) / 0.95)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid hsl(var(--border) / 0.6)",
                            borderRadius: "0.75rem",
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 mt-2">
                    {data.repartitionCycle.map((c) => (
                      <div key={c.cycle} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: CYCLE_COLORS[c.cycle] ?? "hsl(var(--muted))" }}
                          />
                          <span className="font-medium">{CYCLE_LABELS[c.cycle] ?? c.cycle}</span>
                        </div>
                        <span className="font-mono text-muted-foreground">{c.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptySlot message="Aucun élève inscrit." />
              )}
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Moyennes par classe */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5"
            >
              <h3 className="font-display font-semibold text-sm">Moyennes par classe</h3>
              <p className="text-[11px] text-muted-foreground mb-4">
                Classement des classes par moyenne des bulletins publiés
              </p>
              {data.moyennesParClasse.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer>
                    <BarChart data={data.moyennesParClasse.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" domain={[0, 20]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="classe_nom" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover) / 0.95)",
                          backdropFilter: "blur(12px)",
                          border: "1px solid hsl(var(--border) / 0.6)",
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                        }}
                        formatter={(value) =>
                          typeof value === "number" ? value.toFixed(2) : String(value ?? "")
                        }
                      />
                      <Bar dataKey="moyenne" radius={[0, 4, 4, 0]}>
                        {data.moyennesParClasse.slice(0, 10).map((c, idx) => (
                          <Cell key={idx} fill={CYCLE_COLORS[c.cycle] ?? "hsl(var(--muted))"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptySlot message="Générez des bulletins pour voir les classements." />
              )}
            </motion.div>

            {/* Distribution moyennes */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5"
            >
              <h3 className="font-display font-semibold text-sm">Distribution des moyennes</h3>
              <p className="text-[11px] text-muted-foreground mb-4">Répartition sur 20</p>
              {data.distributionMoyennes.some((d) => d.count > 0) ? (
                <div className="h-52">
                  <ResponsiveContainer>
                    <BarChart data={data.distributionMoyennes} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="plage" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover) / 0.95)",
                          backdropFilter: "blur(12px)",
                          border: "1px solid hsl(var(--border) / 0.6)",
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {data.distributionMoyennes.map((d, idx) => (
                          <Cell key={idx} fill={d.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptySlot message="Pas assez de bulletins." />
              )}
            </motion.div>
          </div>

          {/* Top élèves */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-sm flex items-center gap-1.5">
                  <Award className="size-3.5 text-amber-500" />
                  Top 10 élèves
                </h3>
                <p className="text-[11px] text-muted-foreground">Meilleures moyennes de bulletin</p>
              </div>
            </div>
            {data.topEleves.length > 0 ? (
              <div className="divide-y divide-border/40">
                {data.topEleves.map((e, i) => (
                  <div
                    key={e.eleve_id + i}
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-muted/20 transition-colors"
                  >
                    <div
                      className={cn(
                        "size-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                        i === 0 && "bg-gradient-to-br from-amber-400 to-amber-600 text-white",
                        i === 1 && "bg-gradient-to-br from-slate-300 to-slate-500 text-white",
                        i === 2 && "bg-gradient-to-br from-amber-700 to-amber-900 text-white",
                        i > 2 && "bg-muted text-muted-foreground"
                      )}
                    >
                      #{i + 1}
                    </div>
                    <Avatar className="size-8">
                      <AvatarFallback className="text-[10px]">
                        {initials(e.nom, e.prenom)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {e.prenom} {e.nom}
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        {e.matricule} · {e.classe_nom}
                      </p>
                    </div>
                    <Badge
                      variant={e.moyenne >= 16 ? "success" : "outline"}
                      className="text-[11px] font-mono"
                    >
                      {e.moyenne.toFixed(2)}/20
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptySlot message="Aucun bulletin généré." />
            )}
          </motion.div>
        </>
      )}
    </>
  );
}

function Kpi({
  label,
  value,
  icon,
  format,
  accent = "primary",
  delay,
}: {
  label: string;
  value: number | null;
  icon: React.ReactNode;
  format?: "decimal";
  accent?: "primary" | "accent" | "warning";
  delay: number;
}) {
  const grad = {
    primary: "from-primary to-primary-500",
    accent: "from-accent to-accent/70",
    warning: "from-warning to-warning/70",
  }[accent];
  const displayValue =
    value === null ? "—" : format === "decimal" ? value.toFixed(2) : formatNumber(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="relative overflow-hidden rounded-xl border border-border/50 bg-card/60 backdrop-blur-xl p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <div className={cn("size-7 rounded-md bg-gradient-to-br text-white flex items-center justify-center", grad)}>
          {icon}
        </div>
      </div>
      <p className="font-display text-2xl font-bold">{displayValue}</p>
    </motion.div>
  );
}

function EmptySlot({ message }: { message: string }) {
  return (
    <div className="py-8 text-center text-xs text-muted-foreground">{message}</div>
  );
}
