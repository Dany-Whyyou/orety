"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Filter,
  Search,
  MoreHorizontal,
  UserPlus,
  Pencil,
  Trash2,
  Power,
  Plus,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { EleveDialog } from "./eleve-dialog";
import { CredentialsDialog } from "@/components/profs/prof-dialog";
import { initials } from "@/lib/utils";
import { deleteEleve, toggleEleveActif } from "@/lib/actions/eleves";
import type { EleveListItem } from "@/lib/queries/eleves";

type Parent = {
  utilisateur_id: string;
  pseudo: string;
  nom: string | null;
  prenom: string | null;
  nb_enfants: number;
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

type Props = {
  eleves: EleveListItem[];
  etablissements: { id: string; nom: string }[];
  classes: Classe[];
  annees: { id: string; libelle: string; active: boolean }[];
  parents: Parent[];
};

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
  autre: "—",
};

const filters = [
  { key: "tous", label: "Tous" },
  { key: "prescolaire", label: "Préprimaire" },
  { key: "primaire", label: "Primaire" },
  { key: "college", label: "Collège" },
  { key: "lycee", label: "Lycée" },
] as const;

export function ElevesTable({ eleves, etablissements, classes, annees, parents }: Props) {
  const [activeCycle, setActiveCycle] = React.useState<string>("tous");
  const [search, setSearch] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<EleveListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<EleveListItem | null>(null);
  const [credentials, setCredentials] = React.useState<{
    pseudo: string;
    password: string;
    eleveName: string;
  } | null>(null);

  async function onDelete() {
    if (!deleteTarget) return;
    const res = await deleteEleve(deleteTarget.id);
    if (res.ok) {
      toast.success("Élève supprimé");
      setDeleteTarget(null);
    } else toast.error(res.error);
  }

  async function onToggle(e: EleveListItem) {
    const res = await toggleEleveActif(e.id, !e.actif);
    if (res.ok) toast.success(e.actif ? "Élève désactivé" : "Élève réactivé");
    else toast.error(res.error);
  }

  const filtered = eleves.filter((e) => {
    const matchCycle = activeCycle === "tous" || e.cycle === activeCycle;
    const s = search.toLowerCase().trim();
    const matchSearch =
      !s ||
      e.nom.toLowerCase().includes(s) ||
      e.prenom.toLowerCase().includes(s) ||
      e.matricule.toLowerCase().includes(s) ||
      (e.classe ?? "").toLowerCase().includes(s) ||
      e.cle_parentale.toLowerCase().includes(s);
    return matchCycle && matchSearch;
  });

  return (
    <>
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
          {filters.map((c) => {
            const active = activeCycle === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setActiveCycle(c.key)}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  active ? "text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="eleves-cycle-pill"
                    className="absolute inset-0 rounded-md bg-gradient-to-r from-primary to-accent"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{c.label}</span>
              </button>
            );
          })}
        </div>

        <Button variant="outline" size="default">
          <Filter /> Filtres
        </Button>
        <Button variant="outline" size="default" disabled={eleves.length === 0}>
          <Download /> Exporter
        </Button>
        <Button
          variant="gradient"
          size="default"
          onClick={() => setCreateOpen(true)}
          disabled={etablissements.length === 0}
        >
          <Plus /> Nouvel élève
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl"
      >
        {eleves.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
            <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-primary">
              <UserPlus className="size-6" />
            </div>
            <div className="max-w-sm">
              <p className="font-semibold">Aucun élève inscrit pour l&apos;instant</p>
              <p className="text-xs text-muted-foreground mt-1">
                Créez votre premier élève, attribuez-lui une clé parentale et inscrivez-le dans
                une classe.
              </p>
            </div>
            <Button
              variant="gradient"
              onClick={() => setCreateOpen(true)}
              disabled={etablissements.length === 0}
            >
              <UserPlus /> Ajouter un élève
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/50">
                    <th className="text-left font-medium text-xs text-muted-foreground uppercase tracking-wide px-4 py-3">Élève</th>
                    <th className="text-left font-medium text-xs text-muted-foreground uppercase tracking-wide px-4 py-3">Matricule</th>
                    <th className="text-left font-medium text-xs text-muted-foreground uppercase tracking-wide px-4 py-3">Classe</th>
                    <th className="text-left font-medium text-xs text-muted-foreground uppercase tracking-wide px-4 py-3">Clé parentale</th>
                    <th className="text-left font-medium text-xs text-muted-foreground uppercase tracking-wide px-4 py-3">Statut</th>
                    <th className="text-right font-medium text-xs text-muted-foreground uppercase tracking-wide px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e, i) => (
                    <motion.tr
                      key={e.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.3) }}
                      className="group border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="size-9 shrink-0">
                            {e.photo_url && <AvatarImage src={e.photo_url} alt={`${e.prenom} ${e.nom}`} />}
                            <AvatarFallback className="text-[11px]">{initials(e.nom, e.prenom)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {e.prenom} {e.nom}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-medium ${
                                  cycleColors[e.cycle] ?? "bg-muted text-muted-foreground"
                                }`}
                              >
                                {cycleLabels[e.cycle] ?? e.cycle}
                              </span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.matricule}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{e.classe ?? <span className="text-muted-foreground">—</span>}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs rounded-md bg-muted/50 border border-border/50 px-2 py-0.5">
                          {e.cle_parentale}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={e.actif ? "success" : "warning"}>
                          {e.actif ? "Actif" : "Suspendu"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="size-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="size-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditTarget(e)}>
                              <Pencil /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onToggle(e)}>
                              <Power />
                              {e.actif ? "Désactiver" : "Réactiver"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(e)}
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

            {filtered.length === 0 && (
              <div className="p-12 text-center text-sm text-muted-foreground">
                Aucun élève ne correspond à cette recherche.
              </div>
            )}

            <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 text-xs text-muted-foreground">
              <span>
                {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
                {filtered.length !== eleves.length && ` sur ${eleves.length}`}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" disabled>
                  Précédent
                </Button>
                <Button variant="outline" size="sm" disabled={filtered.length < 50}>
                  Suivant
                </Button>
              </div>
            </div>
          </>
        )}
      </motion.div>

      <EleveDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        etablissements={etablissements}
        classes={classes}
        annees={annees}
        parents={parents}
        onCredentialsGenerated={setCredentials}
      />
      <EleveDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        eleve={editTarget ?? undefined}
        etablissements={etablissements}
        classes={classes}
        annees={annees}
        parents={parents}
      />

      {credentials && (
        <CredentialsDialog
          open={!!credentials}
          onOpenChange={(o) => !o && setCredentials(null)}
          pseudo={credentials.pseudo}
          password={credentials.password}
        />
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;élève ?</DialogTitle>
            <DialogDescription>
              <strong>{deleteTarget?.prenom} {deleteTarget?.nom}</strong> sera supprimé, ainsi que
              ses inscriptions et notes. Le compte parent rattaché (
              <code className="font-mono">{deleteTarget?.cle_parentale}</code>) n&apos;est
              <strong> pas</strong> supprimé.
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
