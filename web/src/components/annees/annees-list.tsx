"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  CircleDot,
  Settings,
  Archive,
  MoreHorizontal,
  Calculator,
  Lock,
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
import { AnneeDialog } from "./annee-dialog";
import { ConfigDialog } from "./config-dialog";
import type { AnneeListItem, ConfigBulletinItem } from "@/lib/queries/annees";
import { setAnneeActive, deleteAnnee, deleteConfigBulletin } from "@/lib/actions/annees";

const frequenceLabel: Record<string, string> = {
  mensuel: "Mensuelle",
  trimestriel: "Trimestrielle",
  semestriel: "Semestrielle",
};

type Props = {
  annees: AnneeListItem[];
  etablissements: { id: string; nom: string }[];
};

export function AnneesList({ annees, etablissements }: Props) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<AnneeListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<AnneeListItem | null>(null);
  const [deleteConfigTarget, setDeleteConfigTarget] = React.useState<string | null>(null);
  const [configTarget, setConfigTarget] = React.useState<{
    anneeId: string;
    anneeLibelle: string;
    config?: ConfigBulletinItem;
  } | null>(null);

  async function onSetActive(a: AnneeListItem) {
    const res = await setAnneeActive(a.id);
    if (res.ok) toast.success(`${a.libelle} est maintenant l'année active`);
    else toast.error(res.error);
  }

  async function onDelete() {
    if (!deleteTarget) return;
    const res = await deleteAnnee(deleteTarget.id);
    if (res.ok) {
      toast.success("Année archivée");
      setDeleteTarget(null);
    } else toast.error(res.error);
  }

  async function onDeleteConfig() {
    if (!deleteConfigTarget) return;
    const res = await deleteConfigBulletin(deleteConfigTarget);
    if (res.ok) {
      toast.success("Configuration archivée");
      setDeleteConfigTarget(null);
    } else toast.error(res.error);
  }

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button variant="gradient" onClick={() => setCreateOpen(true)}>
          <Plus /> Nouvelle année
        </Button>
      </div>

      {annees.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-12 text-center">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mx-auto flex items-center justify-center text-primary mb-4">
            <Calendar className="size-6" />
          </div>
          <p className="font-semibold">Aucune année scolaire</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Créez votre première année scolaire et configurez la fréquence de bulletin.
          </p>
          <Button variant="gradient" className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus /> Créer la première
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {annees.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl"
              >
                {a.active && (
                  <div
                    aria-hidden
                    className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary-500 to-accent"
                  />
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="size-11 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-primary shrink-0">
                        <Calendar className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display text-lg font-semibold truncate">
                            {a.libelle}
                          </h3>
                          {a.active && (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle2 className="size-3" /> Active
                            </Badge>
                          )}
                          {a.archivee && (
                            <Badge variant="secondary" className="gap-1">
                              <Archive className="size-3" /> Archivée
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Du {formatDate(a.date_debut)} au {formatDate(a.date_fin)}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="size-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                          <MoreHorizontal className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!a.active && (
                          <DropdownMenuItem onClick={() => onSetActive(a)}>
                            <CircleDot /> Définir comme active
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setEditTarget(a)}>
                          <Pencil /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            setConfigTarget({
                              anneeId: a.id,
                              anneeLibelle: a.libelle,
                            })
                          }
                        >
                          <Settings /> Configurer bulletin
                        </DropdownMenuItem>
                        {!a.archivee && (
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/annees/${a.id}/cloture`}>
                              <Lock /> Clôturer l&apos;année
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(a)}
                          className="text-danger focus:text-danger"
                        >
                          <Trash2 /> Archiver
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Configs per etablissement */}
                  {a.configs.length === 0 ? (
                    <button
                      onClick={() =>
                        setConfigTarget({ anneeId: a.id, anneeLibelle: a.libelle })
                      }
                      className="w-full rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 px-4 py-3 text-left text-xs text-muted-foreground transition-colors flex items-center gap-2"
                    >
                      <Settings className="size-3.5" />
                      Aucune configuration de bulletin — cliquez pour créer
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {a.configs.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-lg border border-border/60 bg-background/40 px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm truncate">
                                  {c.etablissement_nom}
                                </span>
                                <Badge variant="info" className="text-[10px]">
                                  {frequenceLabel[c.frequence]}
                                </Badge>
                                <span className="text-[11px] text-muted-foreground">
                                  {c.nb_periodes} période{c.nb_periodes > 1 ? "s" : ""}
                                </span>
                              </div>
                              <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                                <Calculator className="size-3 text-muted-foreground" />
                                <code className="font-mono text-muted-foreground">
                                  {c.formule_annuelle_dsl}
                                </code>
                              </div>
                              {c.periodes.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {c.periodes.map((p) => (
                                    <span
                                      key={p.id}
                                      className="text-[10px] rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5"
                                    >
                                      {p.libelle}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() =>
                                  setConfigTarget({
                                    anneeId: a.id,
                                    anneeLibelle: a.libelle,
                                    config: c,
                                  })
                                }
                                className="size-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfigTarget(c.id)}
                                className="size-7 rounded-md hover:bg-danger/10 flex items-center justify-center text-muted-foreground hover:text-danger transition-colors"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {a.configs.length < etablissements.length && (
                        <button
                          onClick={() =>
                            setConfigTarget({ anneeId: a.id, anneeLibelle: a.libelle })
                          }
                          className="w-full rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 px-4 py-2 text-left text-[11px] text-muted-foreground transition-colors flex items-center gap-2"
                        >
                          <Plus className="size-3" />
                          Ajouter une config pour un autre site
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnneeDialog open={createOpen} onOpenChange={setCreateOpen} />
      <AnneeDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        annee={editTarget ?? undefined}
      />
      {configTarget && (
        <ConfigDialog
          open={!!configTarget}
          onOpenChange={(o) => !o && setConfigTarget(null)}
          anneeId={configTarget.anneeId}
          anneeLibelle={configTarget.anneeLibelle}
          etablissements={etablissements}
          config={configTarget.config}
        />
      )}

      <Dialog open={!!deleteConfigTarget} onOpenChange={(o) => !o && setDeleteConfigTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Archiver la configuration de bulletins ?</DialogTitle>
            <DialogDescription>
              ⚠️ Cette suppression entraîne celle des <strong>périodes scolaires</strong> associées,
              et en cascade de <strong>toutes les évaluations, notes et bulletins</strong> de ces
              périodes. Cette action est <strong>irréversible</strong>.
             Conformément à la politique de conservation, les données sont archivées (retirées des listes) mais jamais effacées : elles restent disponibles en cas de contrôle.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfigTarget(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={onDeleteConfig}>
              <Trash2 /> Archiver définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Archiver l&apos;année scolaire ?</DialogTitle>
            <DialogDescription>
              L&apos;année <strong>{deleteTarget?.libelle}</strong>, ses configurations de bulletin,
              ses périodes et ses inscriptions seront supprimées. <strong>Irréversible.</strong>
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}
