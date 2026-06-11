"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Globe, Building2, LibraryBig, Send } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { createAnnonce, updateAnnonce } from "@/lib/actions/annonces";
import type { AnnonceItem } from "@/lib/queries/annonces";

const Schema = z.object({
  titre: z.string().min(1, "Titre requis"),
  contenu: z.string().min(1, "Contenu requis"),
  cible: z.enum(["organisation", "etablissement", "classe"]),
  etablissement_id: z.string().optional().or(z.literal("")),
  classe_id: z.string().optional().or(z.literal("")),
  expire_le: z.string().optional().or(z.literal("")),
  publiee: z.boolean(),
});
type FormValues = z.infer<typeof Schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  annonce?: AnnonceItem;
  etablissements: { id: string; nom: string }[];
  classes: { id: string; nom: string; niveau_libelle: string }[];
};

export function AnnonceDialog({ open, onOpenChange, annonce, etablissements, classes }: Props) {
  const isEdit = !!annonce;
  const [submitting, setSubmitting] = React.useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      titre: "",
      contenu: "",
      cible: "organisation",
      etablissement_id: "",
      classe_id: "",
      expire_le: "",
      publiee: true,
    },
  });

  React.useEffect(() => {
    if (open) {
      if (annonce) {
        form.reset({
          titre: annonce.titre,
          contenu: annonce.contenu,
          cible: annonce.cible,
          etablissement_id: annonce.etablissement_id ?? "",
          classe_id: annonce.classe_id ?? "",
          expire_le: annonce.expire_le ?? "",
          publiee: annonce.publiee,
        });
      } else {
        form.reset({
          titre: "",
          contenu: "",
          cible: "organisation",
          etablissement_id: "",
          classe_id: "",
          expire_le: "",
          publiee: true,
        });
      }
    }
  }, [open, annonce, form]);

  const cible = form.watch("cible");
  const publiee = form.watch("publiee");

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const res = isEdit ? await updateAnnonce(annonce!.id, values) : await createAnnonce(values);
    setSubmitting(false);
    if (res.ok) {
      toast.success(isEdit ? "Annonce mise à jour" : publiee ? "Annonce publiée" : "Annonce enregistrée");
      onOpenChange(false);
    } else toast.error(res.error);
  }

  const targets = [
    { k: "organisation" as const, l: "Toute l'organisation", icon: Globe, desc: "Tous les parents" },
    { k: "etablissement" as const, l: "Un établissement", icon: Building2, desc: "Parents d'un site" },
    { k: "classe" as const, l: "Une classe", icon: LibraryBig, desc: "Parents d'une classe" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'annonce" : "Nouvelle annonce"}</DialogTitle>
          <DialogDescription>
            Diffusée aux parents via l&apos;app mobile Orety Parent et (si configuré) par email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Cible *</Label>
            <div className="grid grid-cols-3 gap-2">
              {targets.map((t) => {
                const Icon = t.icon;
                const active = cible === t.k;
                return (
                  <button
                    type="button"
                    key={t.k}
                    onClick={() => form.setValue("cible", t.k)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs transition-all",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    <Icon className="size-4" />
                    <span className="font-semibold">{t.l}</span>
                    <span className="text-[10px] text-muted-foreground">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {cible === "etablissement" && (
            <div className="space-y-1.5">
              <Label>Établissement *</Label>
              <Select
                value={form.watch("etablissement_id")}
                onValueChange={(v) => form.setValue("etablissement_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {etablissements.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {cible === "classe" && (
            <div className="space-y-1.5">
              <Label>Classe *</Label>
              <Select
                value={form.watch("classe_id")}
                onValueChange={(v) => form.setValue("classe_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom} · {c.niveau_libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="titre">Titre *</Label>
            <Input id="titre" placeholder="Réunion de rentrée" {...form.register("titre")} />
            {form.formState.errors.titre && (
              <p className="text-[11px] text-danger">{form.formState.errors.titre.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contenu">Contenu *</Label>
            <Textarea
              id="contenu"
              rows={7}
              placeholder="Bonjour,&#10;&#10;Nous vous informons..."
              {...form.register("contenu")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="expire_le">Date d&apos;expiration</Label>
              <Input id="expire_le" type="date" {...form.register("expire_le")} />
              <p className="text-[10px] text-muted-foreground">Laisse vide pour permanent.</p>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card/40 px-4 py-3">
              <Switch
                id="publiee"
                checked={publiee}
                onCheckedChange={(v) => form.setValue("publiee", v)}
              />
              <div>
                <Label htmlFor="publiee" className="normal-case text-sm font-medium text-foreground">
                  Publier
                </Label>
                <p className="text-[10px] text-muted-foreground">Visible aux parents</p>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="gradient" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send />}
              {isEdit ? "Enregistrer" : publiee ? "Publier" : "Enregistrer en brouillon"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
