"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Eye,
  EyeOff,
  Globe,
  Building2,
  LibraryBig,
  Search,
  Calendar,
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
import { AnnonceDialog } from "./annonce-dialog";
import { deleteAnnonce, toggleAnnoncePubliee } from "@/lib/actions/annonces";
import type { AnnonceItem } from "@/lib/queries/annonces";

const cibleLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  organisation: { label: "Organisation", icon: Globe, color: "bg-primary/10 text-primary" },
  etablissement: { label: "Établissement", icon: Building2, color: "bg-accent/10 text-accent" },
  classe: { label: "Classe", icon: LibraryBig, color: "bg-warning/10 text-warning" },
};

type Props = {
  annonces: AnnonceItem[];
  etablissements: { id: string; nom: string }[];
  classes: { id: string; nom: string; niveau_libelle: string }[];
};

export function AnnoncesList({ annonces, etablissements, classes }: Props) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<AnnonceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<AnnonceItem | null>(null);
  const [search, setSearch] = React.useState("");

  async function onDelete() {
    if (!deleteTarget) return;
    const res = await deleteAnnonce(deleteTarget.id);
    if (res.ok) {
      toast.success("Annonce supprimée");
      setDeleteTarget(null);
    } else toast.error(res.error);
  }

  async function onTogglePubliee(a: AnnonceItem) {
    const res = await toggleAnnoncePubliee(a.id, !a.publiee);
    if (res.ok) toast.success(a.publiee ? "Annonce dépubliée" : "Annonce publiée");
    else toast.error(res.error);
  }

  const filtered = annonces.filter((a) => {
    const s = search.toLowerCase().trim();
    if (!s) return true;
    return (
      a.titre.toLowerCase().includes(s) ||
      a.contenu.toLowerCase().includes(s) ||
      (a.etablissement_nom ?? "").toLowerCase().includes(s) ||
      (a.classe_nom ?? "").toLowerCase().includes(s)
    );
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un titre, un contenu…"
            className="pl-10"
          />
        </div>
        <Button variant="gradient" className="sm:ml-auto" onClick={() => setCreateOpen(true)}>
          <Plus /> Nouvelle annonce
        </Button>
      </div>

      {annonces.length === 0 ? (
        <EmptyBlock message="Aucune annonce. Créez la première pour communiquer avec les parents." />
      ) : filtered.length === 0 ? (
        <EmptyBlock message="Aucune annonce ne correspond à cette recherche." />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((a, i) => {
              const ciblInfo = cibleLabels[a.cible];
              const CibleIcon = ciblInfo.icon;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                  className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${ciblInfo.color}`}
                      >
                        <CibleIcon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display font-semibold truncate">{a.titre}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">
                            {ciblInfo.label}
                            {a.etablissement_nom && ` · ${a.etablissement_nom}`}
                            {a.classe_nom && ` · ${a.classe_nom}`}
                          </Badge>
                          {a.publiee ? (
                            <Badge variant="success" className="text-[10px] gap-0.5">
                              <Eye className="size-2.5" /> Publiée
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] gap-0.5">
                              <EyeOff className="size-2.5" /> Brouillon
                            </Badge>
                          )}
                          {a.expire_le && (
                            <Badge variant="warning" className="text-[10px] gap-0.5">
                              <Calendar className="size-2.5" /> Expire le{" "}
                              {new Date(a.expire_le).toLocaleDateString("fr-FR")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="size-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground">
                          <MoreHorizontal className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditTarget(a)}>
                          <Pencil /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onTogglePubliee(a)}>
                          {a.publiee ? <EyeOff /> : <Eye />}
                          {a.publiee ? "Dépublier" : "Publier"}
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
                  </div>

                  <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-3">
                    {a.contenu}
                  </p>

                  <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      {a.auteur_nom || a.auteur_pseudo ? (
                        <>Par {a.auteur_nom?.trim() || a.auteur_pseudo}</>
                      ) : (
                        "—"
                      )}
                    </span>
                    <span>
                      {a.publiee_le
                        ? `Publiée le ${new Date(a.publiee_le).toLocaleDateString("fr-FR")}`
                        : `Créée le ${new Date(a.cree_le).toLocaleDateString("fr-FR")}`}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnnonceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        etablissements={etablissements}
        classes={classes}
      />
      <AnnonceDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        annonce={editTarget ?? undefined}
        etablissements={etablissements}
        classes={classes}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;annonce ?</DialogTitle>
            <DialogDescription>
              <strong>{deleteTarget?.titre}</strong> sera supprimée. Cette action est irréversible.
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

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-12 text-center">
      <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mx-auto flex items-center justify-center text-primary mb-4">
        <Megaphone className="size-6" />
      </div>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">{message}</p>
    </div>
  );
}
