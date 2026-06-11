"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Lock,
  Users,
  Sparkles,
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
import { RoleDialog } from "./role-dialog";
import { deleteRole } from "@/lib/actions/roles";
import type { PermissionItem, RoleItem } from "@/lib/queries/roles";

type Props = {
  roles: RoleItem[];
  permissions: PermissionItem[];
};

export function RolesList({ roles, permissions }: Props) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<RoleItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<RoleItem | null>(null);

  async function onDelete() {
    if (!deleteTarget) return;
    const res = await deleteRole(deleteTarget.id);
    if (res.ok) {
      toast.success("Rôle supprimé");
      setDeleteTarget(null);
    } else toast.error(res.error);
  }

  const systemRoles = roles.filter((r) => r.is_system);
  const customRoles = roles.filter((r) => !r.is_system);

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button variant="gradient" onClick={() => setCreateOpen(true)}>
          <Plus /> Nouveau rôle sur mesure
        </Button>
      </div>

      {/* System roles */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="size-4 text-muted-foreground" />
          <h3 className="font-display font-semibold text-sm">Rôles système</h3>
          <Badge variant="secondary" className="text-[10px]">
            Verrouillés
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {systemRoles.map((r) => (
            <RoleCard key={r.id} role={r} />
          ))}
        </div>
      </section>

      {/* Custom roles */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="size-4 text-primary" />
          <h3 className="font-display font-semibold text-sm">Rôles sur mesure</h3>
          <Badge variant="secondary" className="text-[10px]">
            {customRoles.length}
          </Badge>
        </div>
        {customRoles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Aucun rôle personnalisé. Créez-en pour vos cas d&apos;usage spécifiques : comptable,
              surveillant, infirmier…
            </p>
            <Button variant="outline" className="mt-3" onClick={() => setCreateOpen(true)}>
              <Plus /> Créer un rôle
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {customRoles.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <RoleCard
                    role={r}
                    onEdit={() => setEditTarget(r)}
                    onDelete={() => setDeleteTarget(r)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      <RoleDialog open={createOpen} onOpenChange={setCreateOpen} permissions={permissions} />
      <RoleDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        role={editTarget ?? undefined}
        permissions={permissions}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer le rôle ?</DialogTitle>
            <DialogDescription>
              Le rôle <strong>{deleteTarget?.libelle}</strong> sera supprimé. Impossible si des
              utilisateurs y sont encore assignés.
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

function RoleCard({
  role,
  onEdit,
  onDelete,
}: {
  role: RoleItem;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const color = role.couleur ?? "hsl(var(--primary))";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full blur-2xl"
        style={{ backgroundColor: `${color}15` }}
      />

      <div className="relative flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="size-11 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
          >
            <Shield className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-display font-semibold truncate">{role.libelle}</h4>
              {role.is_system && <Lock className="size-3 text-muted-foreground shrink-0" />}
            </div>
            <p className="text-[11px] font-mono text-muted-foreground truncate">{role.code}</p>
          </div>
        </div>
        {!role.is_system && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="size-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground">
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil /> Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-danger focus:text-danger">
                <Trash2 /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {role.description && (
        <p className="relative text-xs text-muted-foreground mb-3">{role.description}</p>
      )}

      <div className="relative flex items-center justify-between gap-2 pt-3 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Users className="size-3" />
          <span>
            {role.nb_utilisateurs} utilisateur{role.nb_utilisateurs > 1 ? "s" : ""}
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] gap-1">
          <Shield className="size-2.5" />
          {role.permissions.length} perm.
        </Badge>
      </div>

      <div className="relative mt-2 pt-2 border-t border-border/30 flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">Niveau</span>
        <span className="font-mono font-semibold">{role.niveau_hierarchique}</span>
      </div>
    </div>
  );
}
