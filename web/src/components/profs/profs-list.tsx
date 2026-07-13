"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck,
  Plus,
  Pencil,
  Power,
  Trash2,
  KeyRound,
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  BookOpen,
  Search,
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
import { ProfDialog, CredentialsDialog } from "./prof-dialog";
import {
  toggleProfActif,
  deleteProf,
  regenerateProfPassword,
} from "@/lib/actions/profs";
import type { ProfListItem } from "@/lib/queries/profs";
import { initials } from "@/lib/utils";

type Props = {
  profs: ProfListItem[];
  etablissements: { id: string; nom: string }[];
  matieres: { id: string; nom: string; code: string; couleur: string | null; etablissement_id: string }[];
};

export function ProfsList({ profs, etablissements, matieres }: Props) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<ProfListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ProfListItem | null>(null);
  const [archiving, setArchiving] = React.useState(false);
  const [credentials, setCredentials] = React.useState<{ pseudo: string; password: string } | null>(null);
  const [togglePending, setTogglePending] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  async function onToggle(p: ProfListItem) {
    setTogglePending(p.utilisateur_id);
    const res = await toggleProfActif(p.utilisateur_id, !p.actif);
    setTogglePending(null);
    if (res.ok) toast.success(p.actif ? "Prof désactivé" : "Prof réactivé");
    else toast.error(res.error);
  }

  async function onDelete() {
    if (!deleteTarget) return;
    setArchiving(true);
    const res = await deleteProf(deleteTarget.utilisateur_id);
    setArchiving(false);
    if (res.ok) {
      toast.success("Professeur archivé");
      setDeleteTarget(null);
    } else toast.error(res.error);
  }

  async function onRegenerate(p: ProfListItem) {
    const res = await regenerateProfPassword(p.utilisateur_id);
    if (res.ok && res.pseudo && res.password) {
      setCredentials({ pseudo: res.pseudo, password: res.password });
    } else if (!res.ok) {
      toast.error(res.error);
    }
  }

  const filtered = profs.filter((p) => {
    const s = search.toLowerCase().trim();
    if (!s) return true;
    return (
      (p.nom ?? "").toLowerCase().includes(s) ||
      (p.prenom ?? "").toLowerCase().includes(s) ||
      p.pseudo.toLowerCase().includes(s) ||
      (p.matricule ?? "").toLowerCase().includes(s) ||
      p.matieres.some((m) => m.nom.toLowerCase().includes(s))
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
            placeholder="Rechercher un prof (nom, pseudo, matière)…"
            className="pl-10"
          />
        </div>
        <div className="sm:ml-auto">
          <Button
            variant="gradient"
            onClick={() => setCreateOpen(true)}
            disabled={etablissements.length === 0}
          >
            <Plus /> Nouveau prof
          </Button>
        </div>
      </div>

      {etablissements.length === 0 ? (
        <EmptyBlock message="Créez d'abord un établissement avant d'ajouter des profs." />
      ) : profs.length === 0 ? (
        <EmptyBlock message="Aucun prof. Créez le premier — pseudo et mot de passe seront générés automatiquement." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((p, i) => (
              <motion.div
                key={p.utilisateur_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar className="size-11 shrink-0">
                      <AvatarFallback className="text-xs">
                        {initials(p.nom ?? "", p.prenom ?? "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold truncate">
                        {p.prenom} {p.nom}
                      </h3>
                      <p className="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">
                        {p.pseudo}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="size-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0">
                        <MoreHorizontal className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditTarget(p)}>
                        <Pencil /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onRegenerate(p)}>
                        <KeyRound /> Régénérer mot de passe
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onToggle(p)}
                        disabled={togglePending === p.utilisateur_id}
                      >
                        <Power />
                        {p.actif ? "Désactiver" : "Réactiver"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(p)}
                        className="text-danger focus:text-danger"
                      >
                        <Trash2 /> Archiver
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                  {p.matricule && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono">{p.matricule}</span>
                    </div>
                  )}
                  {p.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="size-3 shrink-0" />
                      <span className="truncate">{p.email}</span>
                    </div>
                  )}
                  {p.telephone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="size-3 shrink-0" />
                      <span>{p.telephone}</span>
                    </div>
                  )}
                </div>

                {p.etablissements.length > 0 && (
                  <div className="flex items-start gap-1.5 mb-2">
                    <Building2 className="size-3 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {p.etablissements.map((e) => (
                        <span
                          key={e.id}
                          className="text-[10px] rounded-md bg-muted/40 border border-border/50 px-1.5 py-0.5 truncate"
                        >
                          {e.nom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {p.matieres.length > 0 && (
                  <div className="flex items-start gap-1.5">
                    <BookOpen className="size-3 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {p.matieres.slice(0, 5).map((m) => (
                        <span
                          key={m.id}
                          className="text-[10px] font-medium rounded-md px-1.5 py-0.5"
                          style={{
                            backgroundColor: m.couleur ? `${m.couleur}15` : "hsl(var(--muted))",
                            color: m.couleur ?? "hsl(var(--muted-foreground))",
                          }}
                        >
                          {m.code}
                        </span>
                      ))}
                      {p.matieres.length > 5 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{p.matieres.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                  <Badge variant="secondary" className="text-[10px]">
                    {p.nb_affectations} affectation{p.nb_affectations > 1 ? "s" : ""}
                  </Badge>
                  <Badge variant={p.actif ? "success" : "warning"} className="text-[10px]">
                    {p.actif ? "Actif" : "Suspendu"}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ProfDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        etablissements={etablissements}
        matieres={matieres}
        onCredentialsGenerated={setCredentials}
      />
      <ProfDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        prof={editTarget ?? undefined}
        etablissements={etablissements}
        matieres={matieres}
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
            <DialogTitle>Archiver le professeur ?</DialogTitle>
            <DialogDescription>
              Le compte de <strong>{deleteTarget?.prenom} {deleteTarget?.nom}</strong> (
              <span className="font-mono">{deleteTarget?.pseudo}</span>) sera archivé
              définitivement, ainsi que ses affectations.
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
        <UserCheck className="size-6" />
      </div>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">{message}</p>
    </div>
  );
}
