"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Users, Plus, Filter, Search, Download, MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

type Eleve = {
  matricule: string;
  nom: string;
  prenom: string;
  classe: string;
  cycle: "Primaire" | "Collège" | "Lycée";
  moyenne: number;
  cleParentale: string;
  statut: "actif" | "suspendu";
};

const eleves: Eleve[] = [
  { matricule: "OR-2026-0123", nom: "Doviakon", prenom: "Marie", classe: "CE2 A", cycle: "Primaire", moyenne: 15.2, cleParentale: "DOVI-MP-26", statut: "actif" },
  { matricule: "OR-2026-0124", nom: "Doviakon", prenom: "Paul", classe: "6ème B", cycle: "Collège", moyenne: 13.8, cleParentale: "DOVI-MP-26", statut: "actif" },
  { matricule: "OR-2026-0089", nom: "Mboussou", prenom: "Lucie", classe: "5ème A", cycle: "Collège", moyenne: 14.5, cleParentale: "DOVI-MP-26", statut: "actif" },
  { matricule: "OR-2026-0211", nom: "Ndong", prenom: "Aïssa", classe: "Terminale S", cycle: "Lycée", moyenne: 16.1, cleParentale: "NDON-AJ-26", statut: "actif" },
  { matricule: "OR-2026-0302", nom: "Mba", prenom: "Ethan", classe: "CM1 A", cycle: "Primaire", moyenne: 12.4, cleParentale: "MBA-LE-26", statut: "actif" },
  { matricule: "OR-2026-0403", nom: "Ondo", prenom: "Sarah", classe: "3ème A", cycle: "Collège", moyenne: 13.9, cleParentale: "ONDO-KS-26", statut: "actif" },
  { matricule: "OR-2026-0415", nom: "Nzé", prenom: "Yohan", classe: "1ère L", cycle: "Lycée", moyenne: 11.8, cleParentale: "NZE-MY-26", statut: "suspendu" },
  { matricule: "OR-2026-0522", nom: "Obame", prenom: "Clémence", classe: "CP", cycle: "Primaire", moyenne: 14.0, cleParentale: "OBAM-AC-26", statut: "actif" },
];

const cycleColors: Record<string, string> = {
  Primaire: "bg-warning/10 text-warning",
  Collège: "bg-accent/10 text-accent",
  Lycée: "bg-primary/10 text-primary",
};

const cycles = ["Tous", "Primaire", "Collège", "Lycée"] as const;

export default function ElevesPage() {
  const [activeCycle, setActiveCycle] = React.useState<string>("Tous");
  const [search, setSearch] = React.useState("");

  const filtered = eleves.filter((e) => {
    const matchCycle = activeCycle === "Tous" || e.cycle === activeCycle;
    const s = search.toLowerCase();
    const matchSearch =
      !s ||
      e.nom.toLowerCase().includes(s) ||
      e.prenom.toLowerCase().includes(s) ||
      e.matricule.toLowerCase().includes(s) ||
      e.classe.toLowerCase().includes(s) ||
      e.cleParentale.toLowerCase().includes(s);
    return matchCycle && matchSearch;
  });

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Élèves"
        description="847 élèves inscrits pour l'année 2026-2027"
        icon={<Users className="size-5" />}
        breadcrumbs={[{ label: "Élèves" }]}
        actions={
          <>
            <Button variant="outline" size="default">
              <Download /> Exporter
            </Button>
            <Button variant="gradient" size="default">
              <Plus /> Nouvel élève
            </Button>
          </>
        }
      />

      {/* Filters bar */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un nom, matricule, classe, clé parentale…"
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-card/60 border border-border/50 backdrop-blur">
          {cycles.map((c) => {
            const active = activeCycle === c;
            return (
              <button
                key={c}
                onClick={() => setActiveCycle(c)}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  active ? "text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="cycle-pill"
                    className="absolute inset-0 rounded-md bg-gradient-to-r from-primary to-accent"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{c}</span>
              </button>
            );
          })}
        </div>

        <Button variant="outline" size="default">
          <Filter /> Filtres
        </Button>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border/50">
                <th className="text-left font-medium text-xs text-muted-foreground uppercase tracking-wide px-4 py-3">Élève</th>
                <th className="text-left font-medium text-xs text-muted-foreground uppercase tracking-wide px-4 py-3">Matricule</th>
                <th className="text-left font-medium text-xs text-muted-foreground uppercase tracking-wide px-4 py-3">Classe</th>
                <th className="text-left font-medium text-xs text-muted-foreground uppercase tracking-wide px-4 py-3">Clé parentale</th>
                <th className="text-left font-medium text-xs text-muted-foreground uppercase tracking-wide px-4 py-3">Moyenne</th>
                <th className="text-left font-medium text-xs text-muted-foreground uppercase tracking-wide px-4 py-3">Statut</th>
                <th className="text-right font-medium text-xs text-muted-foreground uppercase tracking-wide px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <motion.tr
                  key={e.matricule}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="group border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-9 shrink-0">
                        <AvatarFallback className="text-[11px]">{initials(e.nom, e.prenom)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{e.prenom} {e.nom}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-medium ${cycleColors[e.cycle]}`}>
                            {e.cycle}
                          </span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.matricule}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{e.classe}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs rounded-md bg-muted/50 border border-border/50 px-2 py-0.5">
                      {e.cleParentale}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                          style={{ width: `${(e.moyenne / 20) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono font-semibold text-sm tabular-nums">{e.moyenne.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={e.statut === "actif" ? "success" : "warning"}>
                      {e.statut === "actif" ? "Actif" : "Suspendu"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="size-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="size-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Aucun élève trouvé pour cette recherche.
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 text-xs text-muted-foreground">
          <span>
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" disabled>Précédent</Button>
            <Button variant="outline" size="sm">Suivant</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
