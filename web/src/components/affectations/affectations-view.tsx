"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  UserSquare,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Users,
  Search,
  LibraryBig,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AffectationDialog } from "./affectation-dialog";
import { deleteAffectation } from "@/lib/actions/affectations";
import type { AffectationItem } from "@/lib/queries/affectations";
import { initials, cn } from "@/lib/utils";

type Props = {
  affectations: AffectationItem[];
  profs: {
    id: string;
    pseudo: string;
    nom: string | null;
    prenom: string | null;
    matiere_ids: string[];
    etablissement_ids: string[];
  }[];
  classes: {
    id: string;
    nom: string;
    niveau_libelle: string;
    cycle: string;
    etablissement_id: string;
    annee_scolaire_id: string;
    annee_libelle: string;
    annee_active: boolean;
  }[];
  matieres: {
    id: string;
    nom: string;
    code: string;
    couleur: string | null;
    etablissement_id: string;
  }[];
  annees: { id: string; libelle: string; active: boolean }[];
};

export function AffectationsView({ affectations, profs, classes, matieres, annees }: Props) {
  const [view, setView] = React.useState<"grouped" | "list">("grouped");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [defaults, setDefaults] = React.useState<{ utilisateur_id?: string; classe_id?: string } | undefined>();
  const [editTarget, setEditTarget] = React.useState<AffectationItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<AffectationItem | null>(null);
  const [search, setSearch] = React.useState("");
  const [anneeFilter, setAnneeFilter] = React.useState<string>("active");

  async function onDelete() {
    if (!deleteTarget) return;
    const res = await deleteAffectation(deleteTarget.id);
    if (res.ok) {
      toast.success("Affectation supprimée");
      setDeleteTarget(null);
    } else toast.error(res.error);
  }

  function openCreate(d?: { utilisateur_id?: string; classe_id?: string }) {
    setDefaults(d);
    setCreateOpen(true);
  }

  const activeAnnee = annees.find((a) => a.active);
  const filtered = affectations.filter((a) => {
    if (anneeFilter === "active" && !a.annee_active) return false;
    if (anneeFilter !== "active" && anneeFilter !== "tous" && a.annee_scolaire_id !== anneeFilter)
      return false;
    const s = search.toLowerCase().trim();
    if (!s) return true;
    return (
      (a.prof_nom ?? "").toLowerCase().includes(s) ||
      (a.prof_prenom ?? "").toLowerCase().includes(s) ||
      a.classe_nom.toLowerCase().includes(s) ||
      (a.matiere_nom ?? "").toLowerCase().includes(s) ||
      (a.matiere_code ?? "").toLowerCase().includes(s)
    );
  });

  // Group by prof for the "grouped" view
  const byProf = React.useMemo(() => {
    const m = new Map<
      string,
      { utilisateur_id: string; pseudo: string; nom: string | null; prenom: string | null; items: AffectationItem[] }
    >();
    filtered.forEach((a) => {
      const existing = m.get(a.utilisateur_id);
      if (existing) {
        existing.items.push(a);
      } else {
        m.set(a.utilisateur_id, {
          utilisateur_id: a.utilisateur_id,
          pseudo: a.prof_pseudo,
          nom: a.prof_nom,
          prenom: a.prof_prenom,
          items: [a],
        });
      }
    });
    return Array.from(m.values()).sort((x, y) =>
      (x.nom ?? "").localeCompare(y.nom ?? "")
    );
  }, [filtered]);

  const disabled = profs.length === 0 || classes.length === 0;

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher prof, classe, matière…"
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-card/60 border border-border/50 backdrop-blur">
          {[
            { k: "grouped", l: "Par prof" },
            { k: "list", l: "Liste" },
          ].map((v) => {
            const active = view === v.k;
            return (
              <button
                key={v.k}
                onClick={() => setView(v.k as typeof view)}
                className={cn(
                  "relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  active ? "text-white" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="aff-view-pill"
                    className="absolute inset-0 rounded-md bg-gradient-to-r from-primary to-accent"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{v.l}</span>
              </button>
            );
          })}
        </div>

        {annees.length > 1 && (
          <select
            value={anneeFilter}
            onChange={(e) => setAnneeFilter(e.target.value)}
            className="h-10 rounded-lg border border-border bg-card/50 px-3 text-xs"
          >
            {activeAnnee && <option value="active">Année active : {activeAnnee.libelle}</option>}
            <option value="tous">Toutes les années</option>
            {annees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.libelle}
              </option>
            ))}
          </select>
        )}

        <Button variant="gradient" onClick={() => openCreate()} disabled={disabled}>
          <Plus /> Nouvelle affectation
        </Button>
      </div>

      {disabled ? (
        <EmptyBlock
          message={
            profs.length === 0
              ? "Créez d'abord des profs."
              : "Créez d'abord des classes."
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyBlock message="Aucune affectation. Créez la première pour attribuer une classe à un prof." />
      ) : view === "grouped" ? (
        <div className="space-y-3">
          {byProf.map((g, gi) => (
            <motion.div
              key={g.utilisateur_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.04 }}
              className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-4"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className="text-xs">
                      {initials(g.nom ?? "", g.prenom ?? "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">
                      {g.prenom} {g.nom}
                    </h3>
                    <p className="text-[11px] font-mono text-muted-foreground">{g.pseudo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {g.items.length} affectation{g.items.length > 1 ? "s" : ""}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCreate({ utilisateur_id: g.utilisateur_id })}
                  >
                    <Plus /> Ajouter
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {g.items.map((a) => (
                  <AffectationCard
                    key={a.id}
                    a={a}
                    onEdit={() => setEditTarget(a)}
                    onDelete={() => setDeleteTarget(a)}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border/50">
                  <th className="text-left font-medium text-xs text-muted-foreground uppercase tracking-wide px-4 py-3">Prof</th>
                  <th className="text-left font-medium text-xs text-muted-foreground uppercase tracking-wide px-4 py-3">Classe</th>
                  <th className="text-left font-medium text-xs text-muted-foreground uppercase tracking-wide px-4 py-3">Matière</th>
                  <th className="text-left font-medium text-xs text-muted-foreground uppercase tracking-wide px-4 py-3">Année</th>
                  <th className="text-left font-medium text-xs text-muted-foreground uppercase tracking-wide px-4 py-3">H/sem</th>
                  <th className="text-right font-medium text-xs text-muted-foreground uppercase tracking-wide px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.25) }}
                    className="group border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7">
                          <AvatarFallback className="text-[10px]">
                            {initials(a.prof_nom ?? "", a.prof_prenom ?? "")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {a.prof_prenom} {a.prof_nom}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground">{a.prof_pseudo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{a.classe_nom}</span>
                      <span className="text-[11px] text-muted-foreground ml-2">{a.niveau_libelle}</span>
                    </td>
                    <td className="px-4 py-3">
                      {a.matiere_code ? (
                        <span
                          className="text-[11px] font-medium rounded-md px-1.5 py-0.5"
                          style={{
                            backgroundColor: a.matiere_couleur ? `${a.matiere_couleur}15` : "hsl(var(--muted))",
                            color: a.matiere_couleur ?? "hsl(var(--muted-foreground))",
                          }}
                        >
                          {a.matiere_code} · {a.matiere_nom}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">Titulaire</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{a.annee_libelle}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {a.heures_semaine ? `${a.heures_semaine}h` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="size-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="size-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditTarget(a)}>
                            <Pencil /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(a)}
                            className="text-danger focus:text-danger"
                          >
                            <Trash2 /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AffectationDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        profs={profs}
        classes={classes}
        matieres={matieres}
        annees={annees}
        defaults={defaults}
      />
      <AffectationDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        affectation={editTarget ?? undefined}
        profs={profs}
        classes={classes}
        matieres={matieres}
        annees={annees}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;affectation ?</DialogTitle>
            <DialogDescription>
              L&apos;affectation sera supprimée. Les notes et présences déjà saisies pour cette
              classe × matière ne seront pas affectées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              <Trash2 /> Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AffectationCard({
  a,
  onEdit,
  onDelete,
}: {
  a: AffectationItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group/item relative rounded-lg border border-border/60 bg-background/30 px-3 py-2.5 hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <LibraryBig className="size-3 text-muted-foreground shrink-0" />
            <span className="font-semibold text-sm truncate">{a.classe_nom}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {a.niveau_libelle}
            {a.heures_semaine && ` · ${a.heures_semaine}h/sem`}
          </p>
          <div className="mt-1.5">
            {a.matiere_code ? (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-medium rounded-md px-1.5 py-0.5"
                style={{
                  backgroundColor: a.matiere_couleur ? `${a.matiere_couleur}15` : "hsl(var(--muted))",
                  color: a.matiere_couleur ?? "hsl(var(--muted-foreground))",
                }}
              >
                {a.matiere_code}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground italic">
                <Users className="size-2.5" /> Titulaire
              </span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="size-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity">
              <MoreHorizontal className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil /> Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-danger focus:text-danger">
              <Trash2 /> Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-12 text-center">
      <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mx-auto flex items-center justify-center text-primary mb-4">
        <UserSquare className="size-6" />
      </div>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">{message}</p>
    </div>
  );
}
