"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Search,
  Bell,
  BellOff,
  Heart,
  Shield,
  Frown,
  MessageSquare,
  BookOpen,
  MapPin,
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  CircleDot,
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
import { IncidentDialog } from "./incident-dialog";
import {
  deleteIncident,
  updateIncidentStatut,
} from "@/lib/actions/incidents";
import type { IncidentItem } from "@/lib/queries/incidents";
import { cn, initials } from "@/lib/utils";

const typeMeta: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  sante: { label: "Santé", icon: Heart, color: "bg-rose-500/10 text-rose-500" },
  comportement: { label: "Comportement", icon: Frown, color: "bg-amber-500/10 text-amber-500" },
  securite: { label: "Sécurité", icon: Shield, color: "bg-red-500/10 text-red-500" },
  materiel: { label: "Matériel", icon: AlertTriangle, color: "bg-orange-500/10 text-orange-500" },
  academique: { label: "Académique", icon: BookOpen, color: "bg-blue-500/10 text-blue-500" },
  autre: { label: "Autre", icon: MessageSquare, color: "bg-slate-500/10 text-slate-500" },
};

const graviteMeta: Record<string, { label: string; className: string }> = {
  info: { label: "Info", className: "bg-accent/10 text-accent" },
  mineur: { label: "Mineur", className: "bg-emerald-500/10 text-emerald-600" },
  moyen: { label: "Moyen", className: "bg-warning/10 text-warning" },
  grave: { label: "Grave", className: "bg-danger/10 text-danger" },
};

const statutMeta: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  signale: { label: "Signalé", icon: CircleDot, className: "bg-accent/10 text-accent" },
  en_cours: { label: "En cours", icon: Clock, className: "bg-warning/10 text-warning" },
  traite: { label: "Traité", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600" },
  clos: { label: "Clos", icon: CheckCircle2, className: "bg-muted text-muted-foreground" },
};

type Eleve = {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  etablissement_nom: string;
};

type Props = {
  incidents: IncidentItem[];
  eleves: Eleve[];
};

export function IncidentsList({ incidents, eleves }: Props) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<IncidentItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<IncidentItem | null>(null);
  const [archiving, setArchiving] = React.useState(false);
  const [photoViewer, setPhotoViewer] = React.useState<{ photos: string[]; index: number } | null>(null);
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("tous");
  const [statutFilter, setStatutFilter] = React.useState<string>("tous");

  async function onDelete() {
    if (!deleteTarget) return;
    setArchiving(true);
    const res = await deleteIncident(deleteTarget.id);
    setArchiving(false);
    if (res.ok) {
      toast.success("Signalement archivé");
      setDeleteTarget(null);
    } else toast.error(res.error);
  }

  async function onChangeStatut(i: IncidentItem, statut: "signale" | "en_cours" | "traite" | "clos") {
    const res = await updateIncidentStatut(i.id, statut);
    if (res.ok) toast.success("Statut mis à jour");
    else toast.error(res.error);
  }

  const filtered = incidents.filter((i) => {
    if (typeFilter !== "tous" && i.type !== typeFilter) return false;
    if (statutFilter !== "tous" && i.statut !== statutFilter) return false;
    const s = search.toLowerCase().trim();
    if (!s) return true;
    return (
      i.titre.toLowerCase().includes(s) ||
      i.description.toLowerCase().includes(s) ||
      i.eleve_nom.toLowerCase().includes(s) ||
      i.eleve_prenom.toLowerCase().includes(s)
    );
  });

  // KPIs
  const stats = {
    total: incidents.length,
    en_cours: incidents.filter((i) => i.statut === "en_cours" || i.statut === "signale").length,
    graves: incidents.filter((i) => i.gravite === "grave").length,
    notifies: incidents.filter((i) => i.notifie_parent).length,
  };

  return (
    <>
      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard label="Total" value={stats.total} icon={<AlertTriangle className="size-4" />} />
        <StatCard
          label="À traiter"
          value={stats.en_cours}
          icon={<Clock className="size-4" />}
          accent="warning"
        />
        <StatCard
          label="Graves"
          value={stats.graves}
          icon={<AlertTriangle className="size-4" />}
          accent="danger"
        />
        <StatCard
          label="Parents notifiés"
          value={stats.notifies}
          icon={<Bell className="size-4" />}
          accent="primary"
        />
      </section>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher titre, élève, description…"
            className="pl-10"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card/50 px-3 text-xs"
        >
          <option value="tous">Tous les types</option>
          {Object.entries(typeMeta).map(([k, m]) => (
            <option key={k} value={k}>
              {m.label}
            </option>
          ))}
        </select>

        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card/50 px-3 text-xs"
        >
          <option value="tous">Tous statuts</option>
          {Object.entries(statutMeta).map(([k, m]) => (
            <option key={k} value={k}>
              {m.label}
            </option>
          ))}
        </select>

        <Button
          variant="gradient"
          className="sm:ml-auto"
          onClick={() => setCreateOpen(true)}
          disabled={eleves.length === 0}
        >
          <Plus /> Nouveau signalement
        </Button>
      </div>

      {incidents.length === 0 ? (
        <EmptyBlock message="Aucun incident signalé — parfait ! Signalez-en un dès qu'un événement concerne un élève." />
      ) : filtered.length === 0 ? (
        <EmptyBlock message="Aucun incident ne correspond à cette recherche." />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((i, idx) => (
              <motion.div
                key={i.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.3) }}
                className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5 hover:shadow-md transition-shadow"
              >
                <IncidentCard
                  incident={i}
                  onEdit={() => setEditTarget(i)}
                  onDelete={() => setDeleteTarget(i)}
                  onChangeStatut={(s) => onChangeStatut(i, s)}
                  onPhotoClick={(index) => setPhotoViewer({ photos: i.photos, index })}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <IncidentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        eleves={eleves}
      />
      <IncidentDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        incident={editTarget ?? undefined}
        eleves={eleves}
      />

      {photoViewer && (
        <Dialog open={true} onOpenChange={() => setPhotoViewer(null)}>
          <DialogContent className="max-w-3xl p-2">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoViewer.photos[photoViewer.index]}
                alt=""
                className="w-full max-h-[80vh] object-contain rounded-lg"
              />
              {photoViewer.photos.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setPhotoViewer({
                        photos: photoViewer.photos,
                        index: (photoViewer.index - 1 + photoViewer.photos.length) % photoViewer.photos.length,
                      })
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/70 text-white flex items-center justify-center"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() =>
                      setPhotoViewer({
                        photos: photoViewer.photos,
                        index: (photoViewer.index + 1) % photoViewer.photos.length,
                      })
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/70 text-white flex items-center justify-center"
                  >
                    ›
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs bg-black/70 text-white px-2 py-0.5 rounded">
                    {photoViewer.index + 1} / {photoViewer.photos.length}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Archiver le signalement ?</DialogTitle>
            <DialogDescription>
              <strong>{deleteTarget?.titre}</strong> et ses photos seront archivés
              définitivement. Le parent ne sera pas re-notifié.
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

function IncidentCard({
  incident: i,
  onEdit,
  onDelete,
  onChangeStatut,
  onPhotoClick,
}: {
  incident: IncidentItem;
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatut: (s: "signale" | "en_cours" | "traite" | "clos") => void;
  onPhotoClick: (index: number) => void;
}) {
  const TypeIcon = typeMeta[i.type].icon;
  const StatutIcon = statutMeta[i.statut].icon;

  return (
    <>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "size-11 rounded-xl flex items-center justify-center shrink-0",
              typeMeta[i.type].color
            )}
          >
            <TypeIcon className="size-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-semibold leading-tight truncate">{i.titre}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline" className={cn("text-[10px] border-0", graviteMeta[i.gravite].className)}>
                {graviteMeta[i.gravite].label}
              </Badge>
              <Badge
                variant="outline"
                className={cn("text-[10px] border-0 gap-0.5", statutMeta[i.statut].className)}
              >
                <StatutIcon className="size-2.5" />
                {statutMeta[i.statut].label}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {typeMeta[i.type].label}
              </Badge>
              {i.notifie_parent ? (
                <Badge variant="success" className="text-[10px] gap-0.5">
                  <Bell className="size-2.5" /> Parent notifié
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] gap-0.5">
                  <BellOff className="size-2.5" /> Interne
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
            <DropdownMenuItem onClick={onEdit}>
              <Pencil /> Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px]">Changer le statut</DropdownMenuLabel>
            {(["signale", "en_cours", "traite", "clos"] as const).map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => onChangeStatut(s)}
                disabled={i.statut === s}
              >
                {statutMeta[s].label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-danger focus:text-danger">
              <Trash2 /> Archiver
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Élève */}
      <div className="flex items-center gap-2 mb-3 rounded-lg bg-muted/30 border border-border/40 px-3 py-2">
        <Avatar className="size-7">
          <AvatarFallback className="text-[10px]">
            {initials(i.eleve_nom, i.eleve_prenom)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">
            {i.eleve_prenom} {i.eleve_nom}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground truncate">
            {i.matricule} · {i.etablissement_nom}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-3 mb-3">
        {i.description}
      </p>

      {i.action_prise && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-0.5">
            Action prise
          </p>
          <p className="text-xs">{i.action_prise}</p>
        </div>
      )}

      {/* Photos */}
      {i.photos.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <ImageIcon className="size-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">
              {i.photos.length} photo{i.photos.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {i.photos.slice(0, 6).map((url, idx) => (
              <button
                type="button"
                key={url}
                onClick={() => onPhotoClick(idx)}
                className="group relative aspect-square rounded-md overflow-hidden border border-border/60 hover:border-primary/40 transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                {idx === 5 && i.photos.length > 6 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-semibold">
                    +{i.photos.length - 6}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center flex-wrap gap-3 pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="size-3" />
          {new Date(i.date_incident).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {i.lieu && (
          <span className="flex items-center gap-1">
            <MapPin className="size-3" />
            {i.lieu}
          </span>
        )}
        {i.auteur_pseudo && (
          <span className="ml-auto truncate">
            Par {i.auteur_nom?.trim() || i.auteur_pseudo}
            {i.auteur_role && (
              <span className="text-muted-foreground/60 ml-1">({i.auteur_role})</span>
            )}
          </span>
        )}
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent = "primary",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: "primary" | "warning" | "danger";
}) {
  const grad = {
    primary: "from-primary to-primary-500",
    warning: "from-warning to-warning/70",
    danger: "from-danger to-danger/70",
  }[accent];
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card/60 backdrop-blur-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <div
          className={cn(
            "size-7 rounded-md bg-gradient-to-br text-white flex items-center justify-center",
            grad
          )}
        >
          {icon}
        </div>
      </div>
      <p className="font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-12 text-center">
      <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mx-auto flex items-center justify-center text-primary mb-4">
        <AlertTriangle className="size-6" />
      </div>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">{message}</p>
    </div>
  );
}
