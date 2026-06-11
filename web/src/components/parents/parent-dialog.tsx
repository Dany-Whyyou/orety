"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Info, Sparkles } from "lucide-react";
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
import { createParent, updateParent } from "@/lib/actions/parents";
import type { ParentListItem } from "@/lib/queries/parents";

const Schema = z.object({
  nom: z.string().optional().or(z.literal("")),
  prenom: z.string().optional().or(z.literal("")),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  telephone: z.string().optional().or(z.literal("")),
  pseudo_custom: z.string().optional().or(z.literal("")),
});
type FormValues = z.infer<typeof Schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parent?: ParentListItem;
  onCredentialsGenerated?: (data: { pseudo: string; password: string }) => void;
};

export function ParentDialog({ open, onOpenChange, parent, onCredentialsGenerated }: Props) {
  const isEdit = !!parent;
  const [submitting, setSubmitting] = React.useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { nom: "", prenom: "", email: "", telephone: "", pseudo_custom: "" },
  });

  React.useEffect(() => {
    if (open) {
      if (parent) {
        form.reset({
          nom: parent.nom ?? "",
          prenom: parent.prenom ?? "",
          email: parent.email ?? "",
          telephone: parent.telephone ?? "",
          pseudo_custom: "",
        });
      } else {
        form.reset({ nom: "", prenom: "", email: "", telephone: "", pseudo_custom: "" });
      }
    }
  }, [open, parent, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const res = isEdit
      ? await updateParent(parent!.utilisateur_id, values)
      : await createParent(values);
    setSubmitting(false);
    if (res.ok) {
      if (!isEdit && res.pseudo && res.password && onCredentialsGenerated) {
        onCredentialsGenerated({ pseudo: res.pseudo, password: res.password });
      } else {
        toast.success(isEdit ? "Parent mis à jour" : "Parent créé");
      }
      onOpenChange(false);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le parent" : "Nouveau compte parent"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifier les informations. Le pseudo (clé parentale) ne peut pas changer."
              : "Le pseudo mnémonique est généré automatiquement, ou vous pouvez en fournir un."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {isEdit && (
            <div className="rounded-lg bg-muted/30 border border-border/60 px-3 py-2 flex items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Pseudo
              </span>
              <code className="font-mono font-semibold">{parent.pseudo}</code>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="prenom">Prénom</Label>
              <Input id="prenom" placeholder="Marie-Pauline (optionnel)" {...form.register("prenom")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nom">Nom de famille</Label>
              <Input id="nom" placeholder="Doviakon (optionnel)" {...form.register("nom")} />
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground flex items-start gap-1">
            <Info className="size-3 mt-0.5 shrink-0" />
            Infos indicatives — le parent se connecte via son pseudo uniquement.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="(optionnel)" {...form.register("email")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input id="telephone" placeholder="(optionnel)" {...form.register("telephone")} />
            </div>
          </div>

          {!isEdit && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="size-3.5 text-primary" />
                <Label className="text-primary">Pseudo personnalisé (optionnel)</Label>
              </div>
              <Input
                placeholder="DOVI-MP-26 (laissez vide pour générer automatiquement)"
                className="font-mono uppercase"
                {...form.register("pseudo_custom")}
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Si vide : format auto <code className="text-primary">NOM-INITIALES-AA</code>
              </p>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="gradient" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Créer le compte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
