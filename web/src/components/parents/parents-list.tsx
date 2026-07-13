"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound,
  Plus,
  Pencil,
  Power,
  Trash2,
  MoreHorizontal,
  Mail,
  Phone,
  Users,
  Search,
  Lock,
  Unlock,
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
import { ParentDialog } from "./parent-dialog";
import { CredentialsDialog } from "@/components/profs/prof-dialog";
import {
  toggleParentActif,
  deleteParent,
  regenerateParentPassword,
} from "@/lib/actions/parents";
import type { ParentListItem } from "@/lib/queries/parents";

type Props = { parents: ParentListItem[] };

export function ParentsList({ parents }: Props) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<ParentListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ParentListItem | null>(null);
  const [archiving, setArchiving] = React.useState(false);
  const [credentials, setCredentials] = React.useState<{ pseudo: string; password: string } | null>(
    null
  );
  const [search, setSearch] = React.useState("");

  async function onToggle(p: ParentListItem) {
    const res = await toggleParentActif(p.utilisateur_id, !p.actif);
    if (res.ok) toast.success(p.actif ? "Compte désactivé" : "Compte réactivé");
    else toast.error(res.error);
  }

  async function onDelete() {
    if (!deleteTarget) return;
    setArchiving(true);
    const res = await deleteParent(deleteTarget.utilisateur_id);
    setArchiving(false);
    if (res.ok) {
      toast.success("Compte parent archivé");
      setDeleteTarget(null);
    } else toast.error(res.error);
  }

  async function onRegenerate(p: ParentListItem) {
    const res = await regenerateParentPassword(p.utilisateur_id);
    if (res.ok && res.pseudo && res.password) {
      setCredentials({ pseudo: res.pseudo, password: res.password });
    } else if (!res.ok) {
      toast.error(res.error);
    }
  }

  const filtered = parents.filter((p) => {
    const s = search.toLowerCase().trim();
    if (!s) return true;
    return (
      p.pseudo.toLowerCase().includes(s) ||
      (p.nom ?? "").toLowerCase().includes(s) ||
      (p.prenom ?? "").toLowerCase().includes(s) ||
      (p.email ?? "").toLowerCase().includes(s) ||
      p.enfants.some(
        (e) =>
          e.nom.toLowerCase().includes(s) ||
          e.prenom.toLowerCase().includes(s)
      )
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
            placeholder="Rechercher pseudo, nom, enfant…"
            className="pl-10"
          />
        </div>
        <Button variant="gradient" className="sm:ml-auto" onClick={() => setCreateOpen(true)}>
          <Plus /> Nouveau parent
        </Button>
      </div>

      {parents.length === 0 ? (
        <EmptyBlock message="Aucun compte parent. Créez un compte, puis liez les enfants via leur clé parentale lors de l'inscription." />
      ) : filtered.length === 0 ? (
        <EmptyBlock message="Aucun parent ne correspond à cette recherche." />
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
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-primary/5 blur-3xl"
                />

                <div className="relative flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="size-11 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-primary shrink-0">
                      <KeyRound className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <code className="font-mono font-bold text-sm truncate block">
                        {p.pseudo}
                      </code>
                      {(p.prenom || p.nom) && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {p.prenom} {p.nom}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="size-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground shrink-0">
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
                      <DropdownMenuItem onClick={() => onToggle(p)}>
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

                <div className="relative space-y-1.5 text-xs text-muted-foreground mb-3">
                  {p.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="size-3 shrink-0" />
                      <span className="truncate">{p.email}</span>
                    </div>
                  )}
                  {p.telephone && (
                    <div className="flex items-center gap-2">
                      <Phone className="size-3 shrink-0" />
                      <span>{p.telephone}</span>
                    </div>
                  )}
                </div>

                {p.enfants.length > 0 && (
                  <div className="relative mb-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Users className="size-3 text-muted-foreground" />
                      <span className="text-[11px] font-semibold">
                        {p.enfants.length} enfant{p.enfants.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {p.enfants.slice(0, 4).map((e) => (
                        <span
                          key={e.id}
                          className="text-[10px] rounded-md bg-muted/40 border border-border/50 px-1.5 py-0.5 truncate"
                        >
                          {e.prenom} {e.nom}
                        </span>
                      ))}
                      {p.enfants.length > 4 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{p.enfants.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="relative pt-3 border-t border-border/50 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {p.pin_defined ? (
                      <Badge variant="success" className="text-[10px] gap-1">
                        <Lock className="size-2.5" /> PIN défini
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <Unlock className="size-2.5" /> PIN non défini
                      </Badge>
                    )}
                  </div>
                  <Badge variant={p.actif ? "success" : "warning"} className="text-[10px]">
                    {p.actif ? "Actif" : "Suspendu"}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ParentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCredentialsGenerated={setCredentials}
      />
      <ParentDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        parent={editTarget ?? undefined}
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
            <DialogTitle>Archiver le compte parent ?</DialogTitle>
            <DialogDescription>
              Le compte <code className="font-mono">{deleteTarget?.pseudo}</code> sera archivé.
              Action impossible si des enfants sont encore liés à cette clé parentale.
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
        <KeyRound className="size-6" />
      </div>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">{message}</p>
    </div>
  );
}
