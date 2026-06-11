"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  MoreHorizontal,
  Building2,
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
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NiveauDialog } from "./niveau-dialog";
import { deleteNiveau, generateNiveauxForCycle } from "@/lib/actions/niveaux";
import type { NiveauGroup, NiveauItem } from "@/lib/queries/niveaux";

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
  groups: NiveauGroup[];
  etablissements: { id: string; nom: string }[];
};

export function NiveauxList({ groups, etablissements }: Props) {
  const [createDefault, setCreateDefault] = React.useState<string | undefined>();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<NiveauItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<NiveauItem | null>(null);

  async function onDelete() {
    if (!deleteTarget) return;
    const res = await deleteNiveau(deleteTarget.id);
    if (res.ok) {
      toast.success("Niveau supprimé");
      setDeleteTarget(null);
    } else toast.error(res.error);
  }

  async function onGenerate(etabId: string, cycle: "prescolaire" | "primaire" | "college" | "lycee") {
    const res = await generateNiveauxForCycle(etabId, cycle);
    if (res.ok) toast.success(`Niveaux de ${cycleLabels[cycle]} générés`);
    else toast.error(res.error);
  }

  function openCreate(etabId?: string) {
    setCreateDefault(etabId);
    setCreateOpen(true);
  }

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button variant="gradient" onClick={() => openCreate()}>
          <Plus /> Nouveau niveau
        </Button>
      </div>

      {etablissements.length === 0 ? (
        <EmptyState message="Créez d'abord un établissement avant d'ajouter des niveaux." icon={Building2} />
      ) : groups.length === 0 ? (
        <EmptyState
          message="Aucun niveau défini. Générez les niveaux standards par cycle ou créez-les manuellement."
          icon={GraduationCap}
          etablissements={etablissements}
          onGenerate={onGenerate}
          onCreate={openCreate}
        />
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
                </div>
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Sparkles className="size-3.5" /> Générer
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Niveaux standards</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {(["prescolaire", "primaire", "college", "lycee"] as const).map((c) => (
                        <DropdownMenuItem
                          key={c}
                          onClick={() => onGenerate(group.etablissement_id, c)}
                        >
                          {cycleLabels[c]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="ghost" size="sm" onClick={() => openCreate(group.etablissement_id)}>
                    <Plus /> Manuel
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {group.niveaux.map((n) => (
                  <div
                    key={n.id}
                    className="group/row relative rounded-lg border border-border/60 bg-background/30 px-3 py-2 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-mono font-bold text-sm">{n.code}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="size-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground opacity-0 group-hover/row:opacity-100 transition-opacity">
                            <MoreHorizontal className="size-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditTarget(n)}>
                            <Pencil /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(n)}
                            className="text-danger focus:text-danger"
                          >
                            <Trash2 /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{n.libelle}</p>
                    <Badge
                      variant="outline"
                      className={`mt-1 text-[10px] ${cycleColors[n.cycle] ?? ""} border-0 px-1.5 py-0`}
                    >
                      {cycleLabels[n.cycle]}
                    </Badge>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <NiveauDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        etablissements={etablissements}
        defaultEtablissementId={createDefault}
      />
      <NiveauDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        niveau={editTarget ?? undefined}
        etablissements={etablissements}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer le niveau ?</DialogTitle>
            <DialogDescription>
              Le niveau <strong>{deleteTarget?.libelle}</strong> sera supprimé. Les classes et
              coefficients associés seront affectés.
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

function EmptyState({
  message,
  icon: Icon,
  etablissements,
  onGenerate,
  onCreate,
}: {
  message: string;
  icon: React.ComponentType<{ className?: string }>;
  etablissements?: { id: string; nom: string }[];
  onGenerate?: (etabId: string, cycle: "prescolaire" | "primaire" | "college" | "lycee") => void;
  onCreate?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-12 text-center">
      <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mx-auto flex items-center justify-center text-primary mb-4">
        <Icon className="size-6" />
      </div>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">{message}</p>
      {etablissements && etablissements.length > 0 && onGenerate && onCreate && (
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2">
          <Button variant="gradient" onClick={onCreate}>
            <Plus /> Créer manuellement
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Sparkles /> Générer standards
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {etablissements.map((e) => (
                <React.Fragment key={e.id}>
                  <DropdownMenuLabel>{e.nom}</DropdownMenuLabel>
                  {(["prescolaire", "primaire", "college", "lycee"] as const).map((c) => (
                    <DropdownMenuItem key={c} onClick={() => onGenerate(e.id, c)}>
                      {cycleLabels[c]}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
