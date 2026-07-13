"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Plus,
  Pencil,
  Power,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Users,
  MoreHorizontal,
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
import { EtablissementDialog } from "./etablissement-dialog";
import type { EtablissementListItem } from "@/lib/queries/etablissements";
import {
  toggleEtablissementActif,
  deleteEtablissement,
} from "@/lib/actions/etablissements";

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

type Props = { etablissements: EtablissementListItem[] };

export function EtablissementsList({ etablissements }: Props) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<EtablissementListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<EtablissementListItem | null>(null);
  const [archiving, setArchiving] = React.useState(false);
  const [pendingToggleId, setPendingToggleId] = React.useState<string | null>(null);

  async function onToggle(e: EtablissementListItem) {
    setPendingToggleId(e.id);
    const res = await toggleEtablissementActif(e.id, !e.actif);
    setPendingToggleId(null);
    if (res.ok) {
      toast.success(e.actif ? "Établissement désactivé" : "Établissement réactivé");
    } else {
      toast.error(res.error);
    }
  }

  async function onDelete() {
    if (!deleteTarget) return;
    setArchiving(true);
    const res = await deleteEtablissement(deleteTarget.id);
    setArchiving(false);
    if (res.ok) {
      toast.success("Établissement archivé");
      setDeleteTarget(null);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button variant="gradient" onClick={() => setCreateOpen(true)}>
          <Plus /> Nouvel établissement
        </Button>
      </div>

      {etablissements.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-12 text-center">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mx-auto flex items-center justify-center text-primary mb-4">
            <Building2 className="size-6" />
          </div>
          <p className="font-semibold">Aucun établissement</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Commencez par créer vos sites (pré-primaire, primaire, collège, lycée…).
          </p>
          <Button variant="gradient" className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus /> Créer le premier
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {etablissements.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5 hover:shadow-lg transition-all"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full blur-3xl transition-opacity"
                  style={{
                    backgroundColor: e.couleur_primaire
                      ? `${e.couleur_primaire}20`
                      : "rgba(31, 122, 58, 0.1)",
                  }}
                />

                <div className="relative flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="size-11 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
                      style={{
                        background: e.couleur_primaire
                          ? `linear-gradient(135deg, ${e.couleur_primaire}, ${e.couleur_primaire}cc)`
                          : "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                      }}
                    >
                      <Building2 className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-base leading-tight truncate">
                        {e.nom}
                      </h3>
                      {e.slogan && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5 italic">
                          {e.slogan}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="size-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0">
                        <MoreHorizontal className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditTarget(e)}>
                        <Pencil /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onToggle(e)}
                        disabled={pendingToggleId === e.id}
                      >
                        <Power />
                        {e.actif ? "Désactiver" : "Réactiver"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(e)}
                        className="text-danger focus:text-danger"
                      >
                        <Trash2 /> Archiver
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="relative flex flex-wrap gap-1.5 mb-3">
                  <Badge
                    variant="outline"
                    className={`${cycleColors[e.cycle_principal] ?? "bg-muted"} border-0`}
                  >
                    Principal : {cycleLabels[e.cycle_principal]}
                  </Badge>
                  {e.cycles_couverts
                    .filter((c) => c !== e.cycle_principal)
                    .map((c) => (
                      <Badge key={c} variant="outline" className="text-[10px]">
                        {cycleLabels[c]}
                      </Badge>
                    ))}
                </div>

                <div className="relative space-y-1.5 text-xs text-muted-foreground">
                  {e.adresse && (
                    <div className="flex items-start gap-2">
                      <MapPin className="size-3 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{e.adresse}</span>
                    </div>
                  )}
                  {e.telephone && (
                    <div className="flex items-center gap-2">
                      <Phone className="size-3 shrink-0" />
                      <span>{e.telephone}</span>
                    </div>
                  )}
                  {e.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="size-3 shrink-0" />
                      <span className="truncate">{e.email}</span>
                    </div>
                  )}
                </div>

                <div className="relative mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Users className="size-3.5 text-muted-foreground" />
                    <span className="font-semibold">{e.effectif}</span>
                    <span className="text-muted-foreground">élève{e.effectif > 1 ? "s" : ""}</span>
                  </div>
                  <Badge variant={e.actif ? "success" : "warning"} className="text-[10px]">
                    {e.actif ? "Actif" : "Suspendu"}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <EtablissementDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EtablissementDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        etablissement={editTarget ?? undefined}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Archiver l&apos;établissement ?</DialogTitle>
            <DialogDescription>
              Cette action est <strong>irréversible</strong>. Les élèves, classes, évaluations et
              bulletins rattachés à <strong>{deleteTarget?.nom}</strong> seront affectés.
              {deleteTarget && deleteTarget.effectif > 0 && (
                <span className="block mt-2 text-danger">
                  ⚠ {deleteTarget.effectif} élève{deleteTarget.effectif > 1 ? "s" : ""} rattaché
                  {deleteTarget.effectif > 1 ? "s" : ""} à ce site.
                </span>
              )}
             Conformément à la politique de conservation, les données sont archivées (retirées des listes) mais jamais effacées : elles restent disponibles en cas de contrôle.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={archiving}>
              <Trash2 /> Archiver définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
