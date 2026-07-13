"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, KeyRound, Copy, CheckCheck, Mail, MessageCircle } from "lucide-react";
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
import { createProf, updateProf } from "@/lib/actions/profs";
import type { ProfListItem } from "@/lib/queries/profs";

const Schema = z.object({
  nom: z.string().min(2, "Nom requis"),
  prenom: z.string().min(1, "Prénom requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  telephone: z.string().optional().or(z.literal("")),
  matricule: z.string().optional().or(z.literal("")),
  date_embauche: z.string().optional().or(z.literal("")),
  diplome: z.string().optional().or(z.literal("")),
  specialite: z.string().optional().or(z.literal("")),
  etablissement_ids: z.array(z.string().uuid()).min(1, "Au moins un site"),
  matiere_ids: z.array(z.string().uuid()),
});
type FormValues = z.infer<typeof Schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prof?: ProfListItem;
  etablissements: { id: string; nom: string }[];
  matieres: { id: string; nom: string; code: string; couleur: string | null; etablissement_id: string }[];
  onCredentialsGenerated?: (data: { pseudo: string; password: string }) => void;
};

export function ProfDialog({
  open,
  onOpenChange,
  prof,
  etablissements,
  matieres,
  onCredentialsGenerated,
}: Props) {
  const isEdit = !!prof;
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      matricule: "",
      date_embauche: "",
      diplome: "",
      specialite: "",
      etablissement_ids: [],
      matiere_ids: [],
    },
  });

  React.useEffect(() => {
    if (open) {
      if (prof) {
        form.reset({
          nom: prof.nom ?? "",
          prenom: prof.prenom ?? "",
          email: prof.email ?? "",
          telephone: prof.telephone ?? "",
          matricule: prof.matricule ?? "",
          date_embauche: prof.date_embauche ?? "",
          diplome: prof.diplome ?? "",
          specialite: prof.specialite ?? "",
          etablissement_ids: prof.etablissements.map((e) => e.id),
          matiere_ids: prof.matieres.map((m) => m.id),
        });
      } else {
        form.reset({
          nom: "",
          prenom: "",
          email: "",
          telephone: "",
          matricule: "",
          date_embauche: "",
          diplome: "",
          specialite: "",
          etablissement_ids: etablissements[0] ? [etablissements[0].id] : [],
          matiere_ids: [],
        });
      }
    }
  }, [open, prof, etablissements, form]);

  const selectedEtabs = form.watch("etablissement_ids");
  const selectedMats = form.watch("matiere_ids");
  const availableMatieres = matieres.filter((m) =>
    selectedEtabs.includes(m.etablissement_id)
  );

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const res = isEdit
      ? await updateProf(prof!.utilisateur_id, values)
      : await createProf(values);
    setSubmitting(false);

    if (res.ok) {
      if (!isEdit && res.pseudo && res.password && onCredentialsGenerated) {
        onCredentialsGenerated({ pseudo: res.pseudo, password: res.password });
      } else {
        toast.success(isEdit ? "Prof mis à jour" : "Prof créé");
      }
      onOpenChange(false);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le professeur" : "Nouveau professeur"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Mettre à jour les informations et affectations du prof."
              : "Le pseudo (ex: PR-DOVI-D) et un mot de passe seront générés automatiquement."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="prenom">Prénom *</Label>
              <Input id="prenom" {...form.register("prenom")} />
              {form.formState.errors.prenom && (
                <p className="text-[11px] text-danger">{form.formState.errors.prenom.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nom">Nom *</Label>
              <Input id="nom" {...form.register("nom")} />
              {form.formState.errors.nom && (
                <p className="text-[11px] text-danger">{form.formState.errors.nom.message}</p>
              )}
            </div>
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="matricule">Matricule</Label>
              <Input id="matricule" placeholder="PR-2026-001" className="font-mono" {...form.register("matricule")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date_embauche">Date d&apos;embauche</Label>
              <Input id="date_embauche" type="date" {...form.register("date_embauche")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="diplome">Diplôme</Label>
            <Input id="diplome" placeholder="Master sciences de l'éducation" {...form.register("diplome")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="specialite">Spécialité</Label>
            <Textarea id="specialite" rows={2} placeholder="Mathématiques, physique-chimie" {...form.register("specialite")} />
          </div>

          <div className="space-y-1.5">
            <Label>Établissements d&apos;intervention *</Label>
            <div className="flex flex-wrap gap-2">
              {etablissements.map((e) => {
                const selected = selectedEtabs.includes(e.id);
                return (
                  <button
                    type="button"
                    key={e.id}
                    onClick={() => {
                      const next = selected
                        ? selectedEtabs.filter((id) => id !== e.id)
                        : [...selectedEtabs, e.id];
                      form.setValue("etablissement_ids", next, { shouldValidate: true });
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      selected
                        ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
                        : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {e.nom}
                  </button>
                );
              })}
            </div>
            {form.formState.errors.etablissement_ids && (
              <p className="text-[11px] text-danger">
                {form.formState.errors.etablissement_ids.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Matières enseignables</Label>
            <p className="text-[10px] text-muted-foreground">
              {availableMatieres.length === 0
                ? "Aucune matière disponible dans les sites sélectionnés."
                : "Choisissez les matières que ce prof PEUT enseigner (affectations réelles dans l'onglet Affectations)."}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {availableMatieres.map((m) => {
                const selected = selectedMats.includes(m.id);
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => {
                      const next = selected
                        ? selectedMats.filter((id) => id !== m.id)
                        : [...selectedMats, m.id];
                      form.setValue("matiere_ids", next);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all flex items-center gap-1.5",
                      selected
                        ? "border-primary/40 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    )}
                    style={{
                      backgroundColor: selected && m.couleur ? `${m.couleur}15` : undefined,
                    }}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: m.couleur ?? "hsl(var(--primary))" }}
                    />
                    <span className="font-mono">{m.code}</span>
                    <span>{m.nom}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="gradient" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Créer le prof"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Dialog qui affiche les credentials générés après création (à remettre au prof). */
export function CredentialsDialog({
  open,
  onOpenChange,
  pseudo,
  password,
  nomEcole = "Complexe Scolaire Orety",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pseudo: string;
  password: string;
  nomEcole?: string;
}) {
  const [copiedField, setCopiedField] = React.useState<"pseudo" | "password" | null>(null);

  function copy(value: string, field: "pseudo" | "password") {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
    toast.success("Copié");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="size-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
              <KeyRound className="size-4" />
            </span>
            Accès générés
          </DialogTitle>
          <DialogDescription>
            Remettez ces identifiants au professeur. <strong>Ils ne seront plus affichés</strong>,
            mais peuvent être régénérés depuis la liste.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-3">
          <CredentialRow
            label="Pseudo"
            value={pseudo}
            isMono
            copied={copiedField === "pseudo"}
            onCopy={() => copy(pseudo, "pseudo")}
          />
          <CredentialRow
            label="Mot de passe"
            value={password}
            isMono
            copied={copiedField === "password"}
            onCopy={() => copy(password, "password")}
          />
        </div>

        <div className="mt-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-[11px] text-muted-foreground">
          À la première connexion mobile, le prof définit un <strong>PIN</strong> pour accéder plus
          rapidement ensuite.
        </div>

        <DialogFooter className="flex-col gap-2 pt-2 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <a
                href={`mailto:?subject=${encodeURIComponent(`Vos accès ${nomEcole}`)}&body=${encodeURIComponent(
                  `Bonjour,\n\nVoici vos identifiants d'accès à la plateforme ${nomEcole} :\n\nPseudo : ${pseudo}\nMot de passe : ${password}\n\nTéléchargez l'application ou connectez-vous en ligne, puis définissez votre code PIN à la première connexion.\n\nCordialement,\nLe secrétariat`
                )}`}
              >
                <Mail /> Email
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `🏫 *${nomEcole}* — vos accès :\n\n👤 Pseudo : ${pseudo}\n🔑 Mot de passe : ${password}\n\nDéfinissez votre code PIN à la première connexion.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle /> WhatsApp
              </a>
            </Button>
          </div>
          <Button variant="default" onClick={() => onOpenChange(false)}>
            J&apos;ai noté
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CredentialRow({
  label,
  value,
  isMono,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  isMono?: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm",
            isMono && "font-mono font-semibold"
          )}
        >
          {value}
        </div>
        <Button variant="outline" size="icon" type="button" onClick={onCopy}>
          {copied ? <CheckCheck className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
