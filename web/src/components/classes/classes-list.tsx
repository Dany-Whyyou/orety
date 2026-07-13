"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LibraryBig,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  User,
  MapPin,
  Users,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { ClasseDialog } from "./classe-dialog";
import { deleteClasse } from "@/lib/actions/classes";
import type { ClasseItem } from "@/lib/queries/classes";

const cycleLabels: Record<string, string> = {
  prescolaire: "Préprimaire",
  primaire: "Primaire",
  college: "Collège",
  lycee: "Lycée",
};
const cycleColors: Record<string, string> = {
  prescolaire: "bg-warning/10 text-warning",
  primaire: "bg-warning/10 text-warning",
  college: "bg-accent/10 text-accent",
  lycee: "bg-primary/10 text-primary",
};

type Props = {
  classes: ClasseItem[];
  niveaux: { id: string; libelle: string; code: string; cycle: string; etablissement_id: string; ordre: number }[];
  annees: { id: string; libelle: string; active: boolean; date_debut: string }[];
  profs: { id: string; pseudo: string; nom: string | null; prenom: string | null }[];
};

export function ClassesList({ classes, niveaux, annees, profs }: Props) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<ClasseItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ClasseItem | null>(null);
  const [archiving, setArchiving] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [anneeFilter, setAnneeFilter] = React.useState<string>("active");
  const [cycleFilter, setCycleFilter] = React.useState<string>("tous");

  async function onDelete() {
    if (!deleteTarget) return;
    setArchiving(true);
    const res = await deleteClasse(deleteTarget.id);
    setArchiving(false);
    if (res.ok) {
      toast.success("Classe archivée");
      setDeleteTarget(null);
    } else toast.error(res.error);
  }

  const activeAnnee = annees.find((a) => a.active);

  const filtered = classes.filter((c) => {
    if (anneeFilter === "active" && !c.annee_active) return false;
    if (anneeFilter !== "active" && anneeFilter !== "tous" && c.annee_scolaire_id !== anneeFilter)
      return false;
    if (cycleFilter !== "tous" && c.cycle !== cycleFilter) return false;
    const s = search.toLowerCase().trim();
    if (!s) return true;
    return (
      c.nom.toLowerCase().includes(s) ||
      (c.code ?? "").toLowerCase().includes(s) ||
      c.niveau_libelle.toLowerCase().includes(s) ||
      (c.titulaire_nom ?? "").toLowerCase().includes(s)
    );
  });

  const cycles = ["tous", "prescolaire", "primaire", "college", "lycee"];

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une classe, titulaire…"
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-card/60 border border-border/50 backdrop-blur">
          {cycles.map((c) => {
            const active = cycleFilter === c;
            return (
              <button
                key={c}
                onClick={() => setCycleFilter(c)}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  active ? "text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="classes-cycle-pill"
                    className="absolute inset-0 rounded-md bg-gradient-to-r from-primary to-accent"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative capitalize">{c === "tous" ? "Tous" : cycleLabels[c]}</span>
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

        <Button
          variant="gradient"
          onClick={() => setCreateOpen(true)}
          disabled={niveaux.length === 0 || annees.length === 0}
        >
          <Plus /> Nouvelle classe
        </Button>
      </div>

      {niveaux.length === 0 || annees.length === 0 ? (
        <EmptyBlock
          message={
            niveaux.length === 0
              ? "Créez d'abord des niveaux."
              : "Créez d'abord une année scolaire."
          }
        />
      ) : classes.length === 0 ? (
        <EmptyBlock message="Aucune classe créée. Commencez par une première classe." />
      ) : filtered.length === 0 ? (
        <EmptyBlock message="Aucune classe ne correspond à cette recherche." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <AnimatePresence>
            {filtered.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                className="relative overflow-hidden rounded-xl border border-border/50 bg-card/60 backdrop-blur-xl p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-10 rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-primary shrink-0">
                      <LibraryBig className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-bold text-base leading-tight truncate">
                        {c.nom}
                      </h3>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {c.niveau_libelle} · {c.annee_libelle}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="size-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground">
                        <MoreHorizontal className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditTarget(c)}>
                        <Pencil /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(c)}
                        className="text-danger focus:text-danger"
                      >
                        <Trash2 /> Archiver
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  <Badge
                    variant="outline"
                    className={`${cycleColors[c.cycle] ?? "bg-muted"} border-0 text-[10px]`}
                  >
                    {cycleLabels[c.cycle] ?? c.cycle}
                  </Badge>
                  {c.code && (
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {c.code}
                    </Badge>
                  )}
                </div>

                {c.titulaire_pseudo && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1.5">
                    <User className="size-3 shrink-0" />
                    <span className="truncate">
                      Titulaire : {c.titulaire_prenom} {c.titulaire_nom}
                    </span>
                  </div>
                )}
                {c.salle && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1.5">
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">{c.salle}</span>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Users className="size-3 text-muted-foreground" />
                    <span className="font-semibold">{c.effectif}</span>
                    {c.capacite_max && (
                      <span className="text-muted-foreground">/ {c.capacite_max}</span>
                    )}
                    <span className="text-muted-foreground">élève{c.effectif > 1 ? "s" : ""}</span>
                  </div>
                  {c.annee_active && (
                    <Badge variant="success" className="text-[9px]">
                      En cours
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ClasseDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        niveaux={niveaux}
        annees={annees}
        profs={profs}
      />
      <ClasseDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        classe={editTarget ?? undefined}
        niveaux={niveaux}
        annees={annees}
        profs={profs}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Archiver la classe ?</DialogTitle>
            <DialogDescription>
              <strong>{deleteTarget?.nom}</strong> et ses affectations seront archivées.
              {deleteTarget && deleteTarget.effectif > 0 && (
                <span className="block mt-2 text-danger">
                  ⚠ {deleteTarget.effectif} élève{deleteTarget.effectif > 1 ? "s" : ""} rattachés.
                </span>
              )}
             Conformément à la politique de conservation, les données sont archivées (retirées des listes) mais jamais effacées : elles restent disponibles en cas de contrôle.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={archiving}>
              <Trash2 /> Archiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-12 text-center">
      <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mx-auto flex items-center justify-center text-primary mb-4">
        <LibraryBig className="size-6" />
      </div>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">{message}</p>
    </div>
  );
}
