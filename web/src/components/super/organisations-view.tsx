"use client";

import * as React from "react";
import { Building2, Loader2, Plus, Power } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createOrganisationSuper,
  toggleOrganisationActive,
} from "@/lib/actions/super";
import type { OrganisationItem } from "@/lib/queries/super";

export function OrganisationsView({ organisations }: { organisations: OrganisationItem[] }) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    nom: "",
    slug: "",
    plan: "standard",
    ville: "",
    couleur_primaire: "",
  });

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await createOrganisationSuper(form);
    setSaving(false);
    if (res.ok) {
      toast.success("Organisation créée");
      setCreateOpen(false);
      setForm({ nom: "", slug: "", plan: "standard", ville: "", couleur_primaire: "" });
    } else toast.error(res.error);
  }

  async function onToggle(o: OrganisationItem) {
    const res = await toggleOrganisationActive(o.id, !o.actif);
    if (res.ok) toast.success(o.actif ? "Organisation suspendue" : "Organisation réactivée");
    else toast.error(res.error);
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="gradient" onClick={() => setCreateOpen(true)}>
          <Plus /> Nouvelle organisation
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Organisation</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Sites</th>
                <th className="px-4 py-3 font-medium">Utilisateurs</th>
                <th className="px-4 py-3 font-medium">Élèves</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {organisations.map((o) => (
                <tr key={o.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex size-9 items-center justify-center rounded-lg text-white"
                        style={{ backgroundColor: o.couleur_primaire ?? "hsl(var(--primary))" }}
                      >
                        <Building2 className="size-4" />
                      </span>
                      <div>
                        <p className="font-medium">{o.nom}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {o.slug}
                          {o.ville && ` · ${o.ville}`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={o.plan === "premium" ? "default" : "secondary"}>
                      {o.plan ?? "standard"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{o.nb_etablissements}</td>
                  <td className="px-4 py-3">{o.nb_utilisateurs}</td>
                  <td className="px-4 py-3">{o.nb_eleves}</td>
                  <td className="px-4 py-3">
                    <Badge variant={o.actif ? "success" : "warning"}>
                      {o.actif ? "Active" : "Suspendue"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onToggle(o)}
                      aria-label={o.actif ? "Suspendre" : "Réactiver"}
                    >
                      <Power className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle organisation</DialogTitle>
            <DialogDescription>
              Une école cliente de la plateforme (multi-tenant, white-labeling).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="org-nom">Nom</Label>
              <Input
                id="org-nom"
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                placeholder="Complexe Scolaire …"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="org-slug">Slug</Label>
                <Input
                  id="org-slug"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))}
                  placeholder="mon-ecole"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="org-plan">Plan</Label>
                <select
                  id="org-plan"
                  value={form.plan}
                  onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="org-ville">Ville</Label>
                <Input
                  id="org-ville"
                  value={form.ville}
                  onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value }))}
                  placeholder="Port-Gentil"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="org-couleur">Couleur primaire</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.couleur_primaire || "#1b7a43"}
                    onChange={(e) => setForm((f) => ({ ...f, couleur_primaire: e.target.value }))}
                    className="size-9 shrink-0 cursor-pointer rounded-md border border-input bg-background p-0.5"
                    aria-label="Couleur primaire"
                  />
                  <Input
                    id="org-couleur"
                    value={form.couleur_primaire}
                    onChange={(e) => setForm((f) => ({ ...f, couleur_primaire: e.target.value }))}
                    placeholder="#1b7a43"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="gradient" disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : <Plus />}
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
