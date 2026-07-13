"use client";

import { Power } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { toggleUtilisateurSystemeActif } from "@/lib/actions/super";
import type { UtilisateurSystemeItem } from "@/lib/queries/super";

const roleBadges: Record<string, "default" | "secondary" | "success" | "warning"> = {
  super_admin: "default",
  admin_org: "success",
  directeur_site: "secondary",
  secretariat: "warning",
};

export function UtilisateursSystemeView({ utilisateurs }: { utilisateurs: UtilisateurSystemeItem[] }) {
  async function onToggle(u: UtilisateurSystemeItem) {
    const res = await toggleUtilisateurSystemeActif(u.id, !u.actif);
    if (res.ok) toast.success(u.actif ? "Compte désactivé" : "Compte réactivé");
    else toast.error(res.error);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Utilisateur</th>
              <th className="px-4 py-3 font-medium">Rôle</th>
              <th className="px-4 py-3 font-medium">Organisation</th>
              <th className="px-4 py-3 font-medium">Dernière connexion</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {utilisateurs.map((u) => (
              <tr key={u.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-[10px]">
                        {initials(u.nom ?? "", u.prenom ?? undefined)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {u.prenom ? `${u.prenom} ${u.nom}` : (u.nom ?? u.pseudo)}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">{u.pseudo}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={roleBadges[u.role_code] ?? "secondary"}>{u.role_libelle}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {u.organisation_nom ?? <span className="italic">Plateforme</span>}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {u.dernier_login
                    ? new Date(u.dernier_login).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Jamais"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.actif ? "success" : "warning"}>
                    {u.actif ? "Actif" : "Désactivé"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onToggle(u)}
                    aria-label={u.actif ? "Désactiver" : "Réactiver"}
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
  );
}
