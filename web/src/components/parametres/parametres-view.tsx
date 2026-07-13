"use client";

import * as React from "react";
import Link from "next/link";
import { Building2, Loader2, Palette, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOrganisation } from "@/lib/actions/parametres";

export type OrganisationInfo = {
  nom: string;
  slug: string;
  plan: string | null;
  devise: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  site_web: string | null;
  logo_url: string | null;
  couleur_primaire: string | null;
  couleur_secondaire: string | null;
  couleur_accent: string | null;
};

function ChampCouleur({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#1b7a43"}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-md border border-input bg-background p-0.5"
          aria-label={`${label} (sélecteur)`}
        />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#1b7a43"
          className="font-mono"
        />
      </div>
    </div>
  );
}

export function ParametresView({ organisation }: { organisation: OrganisationInfo }) {
  const [form, setForm] = React.useState({
    nom: organisation.nom,
    devise: organisation.devise ?? "",
    adresse: organisation.adresse ?? "",
    telephone: organisation.telephone ?? "",
    email: organisation.email ?? "",
    site_web: organisation.site_web ?? "",
    logo_url: organisation.logo_url ?? "",
    couleur_primaire: organisation.couleur_primaire ?? "",
    couleur_secondaire: organisation.couleur_secondaire ?? "",
    couleur_accent: organisation.couleur_accent ?? "",
  });
  const [saving, setSaving] = React.useState(false);

  const set = (key: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await updateOrganisation(form);
    setSaving(false);
    if (res.ok) toast.success("Paramètres enregistrés");
    else toast.error(res.error);
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
      {/* Identité */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary-50 text-primary">
            <Building2 className="size-5" />
          </div>
          <div>
            <h3 className="font-display font-bold">Identité de l&apos;organisation</h3>
            <p className="text-xs text-muted-foreground">
              Slug : <code className="font-mono">{organisation.slug}</code>
              {organisation.plan && <> · Plan : {organisation.plan}</>}
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" value={form.nom} onChange={(e) => set("nom")(e.target.value)} required />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="devise">Devise / slogan</Label>
            <Input
              id="devise"
              value={form.devise}
              onChange={(e) => set("devise")(e.target.value)}
              placeholder="Travail — Persévérance — Succès"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="adresse">Adresse</Label>
            <Input
              id="adresse"
              value={form.adresse}
              onChange={(e) => set("adresse")(e.target.value)}
              placeholder="Quartier Transfo, BP 2110, Port-Gentil"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telephone">Téléphone</Label>
            <Input
              id="telephone"
              value={form.telephone}
              onChange={(e) => set("telephone")(e.target.value)}
              placeholder="077 95 58 51"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email")(e.target.value)}
              placeholder="contact@orety.ga"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="site_web">Site web</Label>
            <Input
              id="site_web"
              value={form.site_web}
              onChange={(e) => set("site_web")(e.target.value)}
              placeholder="https://orety.ga"
            />
          </div>
        </div>
      </section>

      {/* Branding */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Palette className="size-5" />
          </div>
          <div>
            <h3 className="font-display font-bold">Identité visuelle (white-labeling)</h3>
            <p className="text-xs text-muted-foreground">
              Logo et couleurs utilisés par la plateforme et les documents.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-3">
            <Label htmlFor="logo_url">URL du logo</Label>
            <div className="flex items-center gap-3">
              {form.logo_url && (
                <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.logo_url} alt="Aperçu du logo" className="max-h-8 max-w-8 object-contain" />
                </span>
              )}
              <Input
                id="logo_url"
                value={form.logo_url}
                onChange={(e) => set("logo_url")(e.target.value)}
                placeholder="https://…/logo.png"
              />
            </div>
          </div>
          <ChampCouleur
            id="couleur_primaire"
            label="Couleur primaire"
            value={form.couleur_primaire}
            onChange={set("couleur_primaire")}
          />
          <ChampCouleur
            id="couleur_secondaire"
            label="Couleur secondaire"
            value={form.couleur_secondaire}
            onChange={set("couleur_secondaire")}
          />
          <ChampCouleur
            id="couleur_accent"
            label="Couleur d'accent"
            value={form.couleur_accent}
            onChange={set("couleur_accent")}
          />
        </div>
      </section>

      {/* Accès rapides */}
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary-50 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h3 className="font-display font-bold">Rôles &amp; permissions</h3>
            <p className="text-xs text-muted-foreground">
              Rôles système et rôles sur mesure de l&apos;organisation.
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/parametres/roles">Gérer les rôles</Link>
        </Button>
      </section>

      <div className="flex justify-end">
        <Button type="submit" variant="gradient" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
