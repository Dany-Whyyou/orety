"use client";

import * as React from "react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initials } from "@/lib/utils";
import { changerMonMotDePasse } from "@/lib/actions/profil";

type Props = {
  user: {
    pseudo: string;
    nom: string | null;
    prenom: string | null;
    email: string | null;
    photo_url: string | null;
    role: string | null;
  };
};

export function ProfilView({ user }: Props) {
  const [actuel, setActuel] = React.useState("");
  const [nouveau, setNouveau] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nouveau !== confirmation) {
      toast.error("La confirmation ne correspond pas au nouveau mot de passe");
      return;
    }
    setSaving(true);
    const res = await changerMonMotDePasse({
      mot_de_passe_actuel: actuel,
      nouveau_mot_de_passe: nouveau,
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Mot de passe mis à jour");
      setActuel("");
      setNouveau("");
      setConfirmation("");
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6">
        <Avatar className="size-16">
          {user.photo_url && <AvatarImage src={user.photo_url} alt={user.pseudo} />}
          <AvatarFallback className="text-lg">
            {initials(user.nom ?? "", user.prenom ?? undefined)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h2 className="truncate font-display text-xl font-bold">
            {user.prenom ? `${user.prenom} ${user.nom}` : (user.nom ?? user.pseudo)}
          </h2>
          <p className="font-mono text-sm text-muted-foreground">{user.pseudo}</p>
          <div className="mt-1.5 flex items-center gap-2">
            {user.role && <Badge variant="secondary">{user.role}</Badge>}
            {user.email && (
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary-50 text-primary">
            <KeyRound className="size-5" />
          </div>
          <div>
            <h3 className="font-display font-bold">Changer mon mot de passe</h3>
            <p className="text-xs text-muted-foreground">
              8 caractères minimum, avec au moins une lettre et un chiffre.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="actuel">Mot de passe actuel</Label>
            <Input
              id="actuel"
              type="password"
              autoComplete="current-password"
              value={actuel}
              onChange={(e) => setActuel(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nouveau">Nouveau mot de passe</Label>
              <Input
                id="nouveau"
                type="password"
                autoComplete="new-password"
                value={nouveau}
                onChange={(e) => setNouveau(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmation">Confirmation</Label>
              <Input
                id="confirmation"
                type="password"
                autoComplete="new-password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" variant="gradient" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
            Mettre à jour
          </Button>
        </div>
      </form>
    </div>
  );
}
