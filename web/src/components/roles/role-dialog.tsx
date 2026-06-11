"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Palette, Shield, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createRole, updateRole } from "@/lib/actions/roles";
import type { PermissionItem, RoleItem } from "@/lib/queries/roles";

const Schema = z.object({
  code: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9_]+$/, "Minuscules, chiffres, _"),
  libelle: z.string().min(1),
  description: z.string().optional().or(z.literal("")),
  niveau_hierarchique: z.number().int().min(0).max(95),
  couleur: z.string().optional().or(z.literal("")),
  permissions: z.array(z.string()),
});
type FormValues = z.infer<typeof Schema>;

const PRESET_COLORS = ["#1F7A3A", "#2563EB", "#F59E0B", "#EF4444", "#8B5CF6", "#0EA5E9", "#EC4899"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: RoleItem;
  permissions: PermissionItem[];
};

export function RoleDialog({ open, onOpenChange, role, permissions }: Props) {
  const isEdit = !!role;
  const [submitting, setSubmitting] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      code: "",
      libelle: "",
      description: "",
      niveau_hierarchique: 30,
      couleur: "",
      permissions: [],
    },
  });

  React.useEffect(() => {
    if (open) {
      if (role) {
        form.reset({
          code: role.code,
          libelle: role.libelle,
          description: role.description ?? "",
          niveau_hierarchique: role.niveau_hierarchique,
          couleur: role.couleur ?? "",
          permissions: role.permissions,
        });
      } else {
        form.reset({
          code: "",
          libelle: "",
          description: "",
          niveau_hierarchique: 30,
          couleur: "",
          permissions: [],
        });
      }
      setSearch("");
    }
  }, [open, role, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const res = isEdit ? await updateRole(role!.id, values) : await createRole(values);
    setSubmitting(false);
    if (res.ok) {
      toast.success(isEdit ? "Rôle mis à jour" : "Rôle créé");
      onOpenChange(false);
    } else toast.error(res.error);
  }

  const selectedPerms = form.watch("permissions");

  // Group permissions by domaine
  const byDomaine = React.useMemo(() => {
    const m = new Map<string, PermissionItem[]>();
    permissions
      .filter(
        (p) =>
          !search ||
          p.libelle.toLowerCase().includes(search.toLowerCase()) ||
          p.code.toLowerCase().includes(search.toLowerCase()) ||
          p.domaine.toLowerCase().includes(search.toLowerCase())
      )
      .forEach((p) => {
        if (!m.has(p.domaine)) m.set(p.domaine, []);
        m.get(p.domaine)!.push(p);
      });
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [permissions, search]);

  function toggleAllInDomaine(domaine: string, codes: string[]) {
    const allSelected = codes.every((c) => selectedPerms.includes(c));
    if (allSelected) {
      form.setValue(
        "permissions",
        selectedPerms.filter((c) => !codes.includes(c))
      );
    } else {
      const merged = Array.from(new Set([...selectedPerms, ...codes]));
      form.setValue("permissions", merged);
    }
  }

  const couleur = form.watch("couleur");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le rôle" : "Nouveau rôle sur mesure"}</DialogTitle>
          <DialogDescription>
            Attribuez un ensemble de permissions granulaires. Vous ne pouvez pas accorder de
            permissions au-dessus de votre propre niveau.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="libelle">Libellé *</Label>
              <Input id="libelle" placeholder="Comptable" {...form.register("libelle")} />
              {form.formState.errors.libelle && (
                <p className="text-[11px] text-danger">{form.formState.errors.libelle.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                placeholder="comptable"
                className="font-mono"
                disabled={isEdit}
                {...form.register("code")}
              />
              {form.formState.errors.code && (
                <p className="text-[11px] text-danger">{form.formState.errors.code.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={2}
                placeholder="Peut gérer la facturation et les paiements"
                {...form.register("description")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Niveau</Label>
              <Input
                type="number"
                min={0}
                max={95}
                {...form.register("niveau_hierarchique", { valueAsNumber: true })}
              />
              <p className="text-[10px] text-muted-foreground">
                0-95 (admin_org = 80)
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Couleur</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Palette className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="#1F7A3A"
                  className="pl-9 font-mono text-xs"
                  {...form.register("couleur")}
                />
              </div>
              {couleur && (
                <div
                  className="size-10 rounded-lg border border-border shrink-0"
                  style={{ backgroundColor: couleur }}
                />
              )}
            </div>
            <div className="flex gap-1.5 mt-2">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => form.setValue("couleur", c)}
                  className="size-6 rounded-md border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <Shield className="size-3.5" /> Permissions · {selectedPerms.length} sélectionnée
                {selectedPerms.length > 1 ? "s" : ""}
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrer…"
                  className="pl-8 h-8 w-48 text-xs"
                />
              </div>
            </div>

            <div className="rounded-lg border border-border/60 max-h-80 overflow-y-auto divide-y divide-border/40">
              {byDomaine.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Aucune permission pour cette recherche.
                </div>
              ) : (
                byDomaine.map(([domaine, perms]) => {
                  const allSelected = perms.every((p) => selectedPerms.includes(p.code));
                  const anySelected = perms.some((p) => selectedPerms.includes(p.code));
                  return (
                    <div key={domaine} className="p-3">
                      <button
                        type="button"
                        onClick={() => toggleAllInDomaine(domaine, perms.map((p) => p.code))}
                        className="flex items-center justify-between w-full mb-2"
                      >
                        <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
                          {domaine}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] rounded-md px-1.5 py-0.5 font-medium",
                            allSelected
                              ? "bg-primary text-white"
                              : anySelected
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                          )}
                        >
                          {perms.filter((p) => selectedPerms.includes(p.code)).length}/{perms.length}
                        </span>
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {perms.map((p) => {
                          const selected = selectedPerms.includes(p.code);
                          return (
                            <label
                              key={p.code}
                              className={cn(
                                "flex items-start gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer border transition-colors",
                                selected
                                  ? "bg-primary/10 border-primary/30"
                                  : "border-transparent hover:bg-muted/40"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => {
                                  if (selected) {
                                    form.setValue(
                                      "permissions",
                                      selectedPerms.filter((c) => c !== p.code)
                                    );
                                  } else {
                                    form.setValue("permissions", [...selectedPerms, p.code]);
                                  }
                                }}
                                className="mt-0.5 size-3.5 rounded border-border text-primary focus:ring-ring"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium leading-tight truncate">{p.libelle}</p>
                                <p className="font-mono text-[10px] text-muted-foreground truncate">
                                  {p.code}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="gradient" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Créer le rôle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
