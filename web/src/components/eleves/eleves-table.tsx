"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
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
  total: number;
  page: number;
  pageCount: number;
  filtres: { recherche: string; etablissement: string; cycle: string; statut: string };
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

function exportCsv(rows: EleveListItem[]) {
  const header = [
    "Matricule", "Nom", "Prénom", "Sexe", "Date de naissance", "Établissement",
    "Classe", "Cycle", "Clé parentale", "Statut",
  ];
  const escape = (v: string | null | undefined) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((e) =>
    [
      e.matricule, e.nom, e.prenom, e.sexe ?? "", e.date_naissance ?? "",
      e.etablissement_nom, e.classe ?? "", cycleLabels[e.cycle] ?? e.cycle,
      e.cle_parentale, e.actif ? "Actif" : "Suspendu",
    ].map(escape).join(";")
  );
  const csv = "﻿" + [header.map(escape).join(";"), ...lines].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `eleves-orety-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ElevesTable({
  eleves,
  total,
  page,
  pageCount,
  filtres,
  etablissements,
  classes,
  annees,
  parents,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = React.useState(filtres.recherche);

  // La recherche, les filtres et la pagination s'exécutent EN BASE : on les
  // pilote par l'URL (partageable, et compatible retour arrière).
  const naviguer = React.useCallback(
    (maj: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams();
      const etat: Record<string, string | number | undefined> = {
        recherche: filtres.recherche || undefined,
        etablissement: filtres.etablissement !== "tous" ? filtres.etablissement : undefined,
        cycle: filtres.cycle !== "tous" ? filtres.cycle : undefined,
        statut: filtres.statut !== "tous" ? filtres.statut : undefined,
        page: page || undefined,
        ...maj,
      };
      for (const [cle, val] of Object.entries(etat)) {
        if (val !== undefined && val !== "" && val !== "tous" && val !== 0) {
          params.set(cle, String(val));
        }
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, filtres, page]
  );

  // Recherche : on attend que la frappe se calme avant d'interroger la base
  React.useEffect(() => {
    if (search === filtres.recherche) return;
    const t = setTimeout(() => naviguer({ recherche: search || undefined, page: undefined }), 350);
    return () => clearTimeout(t);
  }, [search, filtres.recherche, naviguer]);

  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<EleveListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<EleveListItem | null>(null);
  const [archiving, setArchiving] = React.useState(false);
  const [credentials, setCredentials] = React.useState<{
    pseudo: string;
    password: string;
    eleveName: string;
  } | null>(null);

  async function onDelete() {
    if (!deleteTarget) return;
    setArchiving(true);
    const res = await deleteEleve(deleteTarget.id);
    setArchiving(false);
    if (res.ok) {
      toast.success("Élève archivé");
      setDeleteTarget(null);
    } else toast.error(res.error);
  }

  async function onToggle(e: EleveListItem) {
    const res = await toggleEleveActif(e.id, !e.actif);
    if (res.ok) toast.success(e.actif ? "Élève désactivé" : "Élève réactivé");
    else toast.error(res.error);
  }


  const currentPage = page;
  const pageRows = eleves;
  const nbFiltresActifs =
    (filtres.etablissement !== "tous" ? 1 : 0) + (filtres.statut !== "tous" ? 1 : 0);
  const aucunFiltre =
    !filtres.recherche && filtres.cycle === "tous" && nbFiltresActifs === 0;

  return (
    <>
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un nom, prénom, matricule, clé parentale…"
            className="pl-10"
          />
        </div>


        <div className="flex items-center gap-1 p-1 rounded-lg bg-card/60 border border-border/50 backdrop-blur">
          {filters.map((c) => {
            const active = filtres.cycle === c.key;
            return (
              <button
                key={c.key}
                onClick={() => naviguer({ cycle: c.key, page: undefined })}
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

        <Button
          variant={nbFiltresActifs > 0 ? "secondary" : "outline"}
          size="default"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <Filter /> Filtres{nbFiltresActifs > 0 && ` (${nbFiltresActifs})`}
        </Button>
        <Button
          variant="outline"
          size="default"
          disabled={eleves.length === 0}
          onClick={() => {
            exportCsv(eleves);
            toast.success(`${eleves.length} élève${eleves.length > 1 ? "s" : ""} de cette page exporté${eleves.length > 1 ? "s" : ""} en CSV`);
          }}
        >
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

      {filtersOpen && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border/50 bg-card/60 p-4 backdrop-blur sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Établissement</p>
            <select
              value={filtres.etablissement}
              onChange={(e) => naviguer({ etablissement: e.target.value, page: undefined })}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="tous">Tous les établissements</option>
              {etablissements.map((et) => (
                <option key={et.id} value={et.id}>{et.nom}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Statut</p>
            <select
              value={filtres.statut}
              onChange={(e) => naviguer({ statut: e.target.value, page: undefined })}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="tous">Tous</option>
              <option value="actif">Actifs</option>
              <option value="inactif">Suspendus</option>
            </select>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={nbFiltresActifs === 0}
            onClick={() => naviguer({ etablissement: undefined, statut: undefined, cycle: undefined, page: undefined })}
          >
            Réinitialiser
          </Button>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl"
      >
        {total === 0 && !aucunFiltre ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Aucun élève ne correspond à cette recherche.
          </div>
        ) : eleves.length === 0 ? (
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
                  {pageRows.map((e, i) => (
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
                              <Trash2 /> Archiver
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>



            <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 text-xs text-muted-foreground">
              <span>
                {total} résultat{total > 1 ? "s" : ""}
                {pageCount > 1 && ` — page ${currentPage + 1}/${pageCount}`}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === 0}
                  onClick={() => naviguer({ page: Math.max(0, page - 1) })}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= pageCount - 1}
                  onClick={() => naviguer({ page: Math.min(pageCount - 1, page + 1) })}
                >
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
            <DialogTitle>Archiver l&apos;élève ?</DialogTitle>
            <DialogDescription>
              <strong>{deleteTarget?.prenom} {deleteTarget?.nom}</strong> sera archivé, ainsi que
              ses inscriptions et notes. Le compte parent rattaché (
              <code className="font-mono">{deleteTarget?.cle_parentale}</code>) n&apos;est
              <strong> pas</strong> supprimé.
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
