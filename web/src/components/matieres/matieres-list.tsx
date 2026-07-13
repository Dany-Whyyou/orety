"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Building2,
  Calculator,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { MatiereDialog } from "./matiere-dialog";
import { CoefficientsDialog } from "./coefficients-dialog";
import { deleteMatiere } from "@/lib/actions/matieres";
import type { MatiereGroup, MatiereItem } from "@/lib/queries/matieres";

type Props = {
  groups: MatiereGroup[];
  etablissements: { id: string; nom: string }[];
};

export function MatieresList({ groups, etablissements }: Props) {
  const [createDefault, setCreateDefault] = React.useState<string | undefined>();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<MatiereItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<MatiereItem | null>(null);
  const [coefTarget, setCoefTarget] = React.useState<{
    matiere: MatiereItem;
    niveaux: { id: string; libelle: string; cycle: string; ordre: number }[];
  } | null>(null);

  async function onDelete() {
    if (!deleteTarget) return;
    const res = await deleteMatiere(deleteTarget.id);
    if (res.ok) {
      toast.success("Matière archivée");
      setDeleteTarget(null);
    } else toast.error(res.error);
  }

  function openCreate(etabId?: string) {
    setCreateDefault(etabId);
    setCreateOpen(true);
  }

  if (etablissements.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-12 text-center">
        <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mx-auto flex items-center justify-center text-primary mb-4">
          <BookOpen className="size-6" />
        </div>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Créez d&apos;abord un établissement avant d&apos;ajouter des matières.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button variant="gradient" onClick={() => openCreate()}>
          <Plus /> Nouvelle matière
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-12 text-center">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mx-auto flex items-center justify-center text-primary mb-4">
            <BookOpen className="size-6" />
          </div>
          <p className="font-semibold">Aucune matière</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Ajoutez les matières enseignées par établissement, puis définissez leurs coefficients
            par niveau.
          </p>
          <Button variant="gradient" className="mt-4" onClick={() => openCreate()}>
            <Plus /> Créer la première
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group, gi) => (
            <motion.div
              key={group.etablissement_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.05 }}
              className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-9 rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-primary shrink-0">
                    <Building2 className="size-4" />
                  </div>
                  <h3 className="font-display font-semibold truncate">{group.etablissement_nom}</h3>
                  <Badge variant="secondary" className="text-[10px]">
                    {group.matieres.length} matière{group.matieres.length > 1 ? "s" : ""}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => openCreate(group.etablissement_id)}>
                  <Plus /> Ajouter
                </Button>
              </div>

              {group.matieres.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Aucune matière pour ce site.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {group.matieres.map((m) => (
                    <div
                      key={m.id}
                      className="group/row relative rounded-lg border border-border/60 bg-background/30 p-3 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <div
                            className="size-8 rounded-md flex items-center justify-center text-white shrink-0 shadow-sm"
                            style={{
                              background: m.couleur
                                ? `linear-gradient(135deg, ${m.couleur}, ${m.couleur}bb)`
                                : "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                            }}
                          >
                            <BookOpen className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm truncate">{m.nom}</span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {m.code}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Calculator className="size-3 text-muted-foreground" />
                              <span className="text-[11px] text-muted-foreground">
                                {m.coefficients.length === 0
                                  ? "Aucun coef."
                                  : `${m.coefficients.length} coef.`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="size-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <MoreHorizontal className="size-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                setCoefTarget({ matiere: m, niveaux: group.niveaux })
                              }
                            >
                              <Calculator /> Coefficients
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditTarget(m)}>
                              <Pencil /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(m)}
                              className="text-danger focus:text-danger"
                            >
                              <Trash2 /> Archiver
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {m.coefficients.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/50 flex flex-wrap gap-1">
                          {m.coefficients.slice(0, 5).map((c) => (
                            <span
                              key={c.niveau_id}
                              className="text-[10px] rounded-md bg-primary/10 text-primary font-mono px-1.5 py-0.5"
                            >
                              {c.niveau_libelle} × {c.coefficient}
                            </span>
                          ))}
                          {m.coefficients.length > 5 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{m.coefficients.length - 5}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <MatiereDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        etablissements={etablissements}
        defaultEtablissementId={createDefault}
      />
      <MatiereDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        matiere={editTarget ?? undefined}
        etablissements={etablissements}
      />
      <CoefficientsDialog
        open={!!coefTarget}
        onOpenChange={(o) => !o && setCoefTarget(null)}
        matiere={coefTarget?.matiere ?? null}
        niveaux={coefTarget?.niveaux ?? []}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Archiver la matière ?</DialogTitle>
            <DialogDescription>
              La matière <strong>{deleteTarget?.nom}</strong> et ses coefficients seront supprimés.
              Les évaluations associées seront affectées.
             Conformément à la politique de conservation, les données sont archivées (retirées des listes) mais jamais effacées : elles restent disponibles en cas de contrôle.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              <Trash2 /> Archiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
