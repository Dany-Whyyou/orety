"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Trash2,
  MoreHorizontal,
  Search,
  Eye,
  EyeOff,
  Users,
  Award,
  Zap,
  Send,
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
import { GenerateBulletinsDialog } from "./generate-dialog";
import {
  deleteBulletin,
  togglePublieBulletin,
  publishBulletinsLot,
} from "@/lib/actions/bulletins";
import type { BulletinListItem } from "@/lib/queries/bulletins";
import { initials, cn } from "@/lib/utils";

const cycleColors: Record<string, string> = {
  prescolaire: "bg-warning/10 text-warning",
  primaire: "bg-warning/10 text-warning",
  college: "bg-accent/10 text-accent",
  lycee: "bg-primary/10 text-primary",
};
const cycleLabels: Record<string, string> = {
  prescolaire: "Préprimaire",
  primaire: "Primaire",
  college: "Collège",
  lycee: "Lycée",
};

type Classe = {
  id: string;
  nom: string;
  niveau_libelle: string;
  cycle: string;
  etablissement_id: string;
  annee_scolaire_id: string;
  annee_libelle: string;
  annee_active: boolean;
};

type Periode = {
  id: string;
  libelle: string;
  numero: number;
  etablissement_id: string;
  annee_scolaire_id: string;
};

type Props = {
  bulletins: BulletinListItem[];
  classes: Classe[];
  periodes: Periode[];
  annees: { id: string; libelle: string; active: boolean }[];
};

export function BulletinsView({ bulletins, classes, periodes, annees }: Props) {
  const [search, setSearch] = React.useState("");
  const [cycleFilter, setCycleFilter] = React.useState<string>("tous");
  const [generateOpen, setGenerateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<BulletinListItem | null>(null);

  async function onDelete() {
    if (!deleteTarget) return;
    const res = await deleteBulletin(deleteTarget.id);
    if (res.ok) {
      toast.success("Bulletin archivé");
      setDeleteTarget(null);
    } else toast.error(res.error);
  }

  async function onTogglePublie(b: BulletinListItem) {
    const res = await togglePublieBulletin(b.id, !b.publie);
    if (res.ok) toast.success(b.publie ? "Dépublié" : "Publié aux parents");
    else toast.error(res.error);
  }

  async function onPublishLot(classeId: string, periodeId: string | null) {
    const res = await publishBulletinsLot(classeId, periodeId);
    if (res.ok) toast.success("Bulletins publiés aux parents");
    else toast.error(res.error);
  }

  const filtered = bulletins.filter((b) => {
    if (cycleFilter !== "tous" && b.cycle !== cycleFilter) return false;
    const s = search.toLowerCase().trim();
    if (!s) return true;
    return (
      b.eleve_nom.toLowerCase().includes(s) ||
      b.eleve_prenom.toLowerCase().includes(s) ||
      b.matricule.toLowerCase().includes(s) ||
      b.classe_nom.toLowerCase().includes(s)
    );
  });

  // Group by classe + periode (or annuel)
  const grouped = React.useMemo(() => {
    const m = new Map<
      string,
      {
        key: string;
        classe_id: string;
        classe_nom: string;
        niveau_libelle: string;
        cycle: string;
        periode_id: string | null;
        periode_libelle: string | null;
        est_annuel: boolean;
        items: BulletinListItem[];
      }
    >();
    filtered.forEach((b) => {
      const key = `${b.classe_id}|${b.periode_id ?? "annuel"}|${b.est_annuel}`;
      const existing = m.get(key);
      if (existing) existing.items.push(b);
      else
        m.set(key, {
          key,
          classe_id: b.classe_id,
          classe_nom: b.classe_nom,
          niveau_libelle: b.niveau_libelle,
          cycle: b.cycle,
          periode_id: b.periode_id,
          periode_libelle: b.periode_libelle,
          est_annuel: b.est_annuel,
          items: [b],
        });
    });
    return Array.from(m.values()).sort((a, b) =>
      a.classe_nom.localeCompare(b.classe_nom)
    );
  }, [filtered]);

  const cycles = ["tous", "prescolaire", "primaire", "college", "lycee"];

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un élève, une classe…"
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
                    layoutId="bulletins-cycle-pill"
                    className="absolute inset-0 rounded-md bg-gradient-to-r from-primary to-accent"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{c === "tous" ? "Tous" : cycleLabels[c]}</span>
              </button>
            );
          })}
        </div>

        <Button
          variant="gradient"
          className="sm:ml-auto"
          onClick={() => setGenerateOpen(true)}
          disabled={classes.length === 0}
        >
          <Zap /> Générer des bulletins
        </Button>
      </div>

      {bulletins.length === 0 ? (
        <EmptyBlock message="Aucun bulletin généré. Créez le premier via 'Générer des bulletins' — le moteur calculera automatiquement les moyennes à partir des notes saisies." />
      ) : filtered.length === 0 ? (
        <EmptyBlock message="Aucun bulletin ne correspond à cette recherche." />
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {grouped.map((group, gi) => {
              const nbPublies = group.items.filter((i) => i.publie).length;
              return (
                <motion.div
                  key={group.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: gi * 0.03 }}
                  className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/20 border-b border-border/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-9 rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-primary shrink-0">
                        <FileText className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display font-semibold truncate flex items-center gap-2">
                          {group.classe_nom}
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                              cycleColors[group.cycle] ?? "bg-muted"
                            )}
                          >
                            {cycleLabels[group.cycle] ?? group.cycle}
                          </span>
                        </h3>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {group.niveau_libelle} · {group.est_annuel ? "Bulletin annuel" : group.periode_libelle}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-[10px]">
                        <Users className="size-2.5 mr-0.5" /> {group.items.length}
                      </Badge>
                      {nbPublies > 0 && (
                        <Badge variant="success" className="text-[10px]">
                          <Eye className="size-2.5 mr-0.5" /> {nbPublies} publié
                          {nbPublies > 1 ? "s" : ""}
                        </Badge>
                      )}
                      {nbPublies < group.items.length && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPublishLot(group.classe_id, group.periode_id)}
                        >
                          <Send /> Publier tout
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-border/40">
                    {group.items
                      .sort((a, b) => (a.rang ?? 999) - (b.rang ?? 999))
                      .map((b) => (
                        <BulletinRow
                          key={b.id}
                          b={b}
                          onTogglePublie={() => onTogglePublie(b)}
                          onDelete={() => setDeleteTarget(b)}
                        />
                      ))}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <GenerateBulletinsDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        classes={classes}
        periodes={periodes}
        annees={annees}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Archiver le bulletin ?</DialogTitle>
            <DialogDescription>
              Le bulletin de <strong>{deleteTarget?.eleve_prenom} {deleteTarget?.eleve_nom}</strong>{" "}
              sera supprimé. Vous pourrez le régénérer.
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

function BulletinRow({
  b,
  onTogglePublie,
  onDelete,
}: {
  b: BulletinListItem;
  onTogglePublie: () => void;
  onDelete: () => void;
}) {
  return (
    <Link
      href={`/admin/bulletins/${b.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group"
    >
      {b.rang !== null && (
        <div
          className={cn(
            "size-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
            b.rang === 1 && "bg-gradient-to-br from-amber-400 to-amber-600 text-white",
            b.rang === 2 && "bg-gradient-to-br from-slate-300 to-slate-500 text-white",
            b.rang === 3 && "bg-gradient-to-br from-amber-700 to-amber-900 text-white",
            b.rang > 3 && "bg-muted text-muted-foreground"
          )}
        >
          #{b.rang}
        </div>
      )}
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className="text-[10px]">{initials(b.eleve_nom, b.eleve_prenom)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm truncate">
          {b.eleve_prenom} {b.eleve_nom}
        </p>
        <p className="text-[11px] text-muted-foreground font-mono truncate">{b.matricule}</p>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {b.moyenne_generale !== null ? (
          <div className="text-right">
            <p
              className={cn(
                "font-mono font-bold text-base",
                b.moyenne_generale >= 16 && "text-emerald-600",
                b.moyenne_generale >= 10 && b.moyenne_generale < 16 && "text-foreground",
                b.moyenne_generale < 10 && "text-danger"
              )}
            >
              {b.moyenne_generale.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground">/20</p>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground font-mono">—</span>
        )}

        {b.publie ? (
          <Badge variant="success" className="text-[10px] gap-0.5">
            <Eye className="size-2.5" /> Publié
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] gap-0.5">
            <EyeOff className="size-2.5" /> Brouillon
          </Badge>
        )}

        {b.moyenne_generale !== null &&
          b.rang === 1 && (
            <Award className="size-4 text-amber-500 shrink-0" />
          )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="size-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                onTogglePublie();
              }}
            >
              {b.publie ? <EyeOff /> : <Eye />}
              {b.publie ? "Dépublier" : "Publier aux parents"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
              className="text-danger focus:text-danger"
            >
              <Trash2 /> Archiver
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Link>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-12 text-center">
      <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mx-auto flex items-center justify-center text-primary mb-4">
        <FileText className="size-6" />
      </div>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">{message}</p>
    </div>
  );
}
