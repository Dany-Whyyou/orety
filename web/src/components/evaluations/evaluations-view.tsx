"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Search,
  Calendar,
  Tag,
  Edit3,
  Eye,
  EyeOff,
  Sparkles,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { TypeEvaluationDialog } from "./type-dialog";
import { EvaluationDialog } from "./evaluation-dialog";
import { NotesDialog } from "./notes-dialog";
import {
  deleteTypeEvaluation,
  deleteEvaluation,
  togglePubliee,
  generateDefaultTypes,
} from "@/lib/actions/evaluations";
import type {
  EvaluationItem,
  TypeEvaluationItem,
} from "@/lib/queries/evaluations";
import { cn } from "@/lib/utils";

type Affectation = {
  id: string;
  utilisateur_id: string;
  classe_id: string;
  matiere_id: string | null;
  annee_scolaire_id: string;
  classe_nom: string;
  niveau_libelle: string;
  etablissement_id: string;
  matiere_nom: string | null;
  matiere_code: string | null;
  matiere_couleur: string | null;
  prof_pseudo: string;
  prof_nom: string | null;
  prof_prenom: string | null;
  annee_libelle: string;
  annee_active: boolean;
};

type Periode = {
  id: string;
  libelle: string;
  numero: number;
  date_debut: string;
  date_fin: string;
  etablissement_id: string;
  annee_scolaire_id: string;
};

type Props = {
  evaluations: EvaluationItem[];
  types: TypeEvaluationItem[];
  affectations: Affectation[];
  periodes: Periode[];
  etablissements: { id: string; nom: string }[];
};

export function EvaluationsView({
  evaluations,
  types,
  affectations,
  periodes,
  etablissements,
}: Props) {
  const [tab, setTab] = React.useState<"evaluations" | "types">("evaluations");
  const [search, setSearch] = React.useState("");
  const [createEvalOpen, setCreateEvalOpen] = React.useState(false);
  const [editEval, setEditEval] = React.useState<EvaluationItem | null>(null);
  const [notesEval, setNotesEval] = React.useState<EvaluationItem | null>(null);
  const [deleteEval, setDeleteEval] = React.useState<EvaluationItem | null>(null);

  const [createTypeOpen, setCreateTypeOpen] = React.useState(false);
  const [createTypeDefault, setCreateTypeDefault] = React.useState<string | undefined>();
  const [editType, setEditType] = React.useState<TypeEvaluationItem | null>(null);
  const [deleteType, setDeleteType] = React.useState<TypeEvaluationItem | null>(null);

  async function onDeleteEvaluation() {
    if (!deleteEval) return;
    const res = await deleteEvaluation(deleteEval.id);
    if (res.ok) {
      toast.success("Évaluation archivée");
      setDeleteEval(null);
    } else toast.error(res.error);
  }

  async function onPubliee(e: EvaluationItem) {
    const res = await togglePubliee(e.id, !e.publiee);
    if (res.ok) toast.success(e.publiee ? "Évaluation dépubliée" : "Évaluation publiée");
    else toast.error(res.error);
  }

  async function onDeleteType() {
    if (!deleteType) return;
    const res = await deleteTypeEvaluation(deleteType.id);
    if (res.ok) {
      toast.success("Type archivé");
      setDeleteType(null);
    } else toast.error(res.error);
  }

  async function onGenerateTypes(etabId: string) {
    const res = await generateDefaultTypes(etabId);
    if (res.ok) toast.success("Types standards générés");
    else toast.error(res.error);
  }

  const filteredEvals = evaluations.filter((e) => {
    const s = search.toLowerCase().trim();
    if (!s) return true;
    return (
      e.titre.toLowerCase().includes(s) ||
      e.classe_nom.toLowerCase().includes(s) ||
      (e.matiere_nom ?? "").toLowerCase().includes(s) ||
      (e.prof_nom ?? "").toLowerCase().includes(s) ||
      e.type_libelle.toLowerCase().includes(s)
    );
  });

  // Group by classe for evaluations
  const byClasse = React.useMemo(() => {
    const m = new Map<string, { classe_nom: string; niveau_libelle: string; cycle: string; items: EvaluationItem[] }>();
    filteredEvals.forEach((e) => {
      const key = e.classe_id;
      const existing = m.get(key);
      if (existing) existing.items.push(e);
      else
        m.set(key, {
          classe_nom: e.classe_nom,
          niveau_libelle: e.niveau_libelle,
          cycle: e.cycle,
          items: [e],
        });
    });
    return Array.from(m.values()).sort((a, b) =>
      a.classe_nom.localeCompare(b.classe_nom)
    );
  }, [filteredEvals]);

  return (
    <>
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-card/60 border border-border/50 backdrop-blur w-fit mb-4">
        {(
          [
            { k: "evaluations", l: "Évaluations", icon: ClipboardList },
            { k: "types", l: "Types", icon: Tag },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          const active = tab === t.k;
          return (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={cn(
                "relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
                active ? "text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="evals-tab-pill"
                  className="absolute inset-0 rounded-md bg-gradient-to-r from-primary to-accent"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="size-3.5 relative" />
              <span className="relative">{t.l}</span>
            </button>
          );
        })}
      </div>

      {tab === "evaluations" ? (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher titre, classe, prof…"
                className="pl-10"
              />
            </div>
            <Button
              variant="gradient"
              className="sm:ml-auto"
              onClick={() => setCreateEvalOpen(true)}
              disabled={affectations.length === 0 || types.length === 0 || periodes.length === 0}
            >
              <Plus /> Nouvelle évaluation
            </Button>
          </div>

          {affectations.length === 0 ? (
            <EmptyBlock message="Créez d'abord des affectations (prof × classe × matière)." />
          ) : types.length === 0 ? (
            <EmptyBlock message="Créez d'abord des types d'évaluation (onglet 'Types')." />
          ) : periodes.length === 0 ? (
            <EmptyBlock message="Configurez d'abord la fréquence de bulletin par établissement (onglet 'Années scolaires')." />
          ) : evaluations.length === 0 ? (
            <EmptyBlock message="Aucune évaluation. Créez la première." />
          ) : filteredEvals.length === 0 ? (
            <EmptyBlock message="Aucune évaluation ne correspond à cette recherche." />
          ) : (
            <div className="space-y-3">
              {byClasse.map((group, gi) => (
                <motion.div
                  key={group.classe_nom + gi}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.03 }}
                  className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/20 border-b border-border/50">
                    <span className="font-display font-semibold text-sm">
                      {group.classe_nom}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {group.niveau_libelle}
                    </span>
                    <Badge variant="secondary" className="text-[10px] ml-auto">
                      {group.items.length} évaluation{group.items.length > 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="divide-y divide-border/40">
                    {group.items.map((e) => (
                      <EvaluationRow
                        key={e.id}
                        e={e}
                        onEdit={() => setEditEval(e)}
                        onNotes={() => setNotesEval(e)}
                        onPubliee={() => onPubliee(e)}
                        onDelete={() => setDeleteEval(e)}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <EvaluationDialog
            open={createEvalOpen}
            onOpenChange={setCreateEvalOpen}
            types={types}
            affectations={affectations}
            periodes={periodes}
          />
          <EvaluationDialog
            open={!!editEval}
            onOpenChange={(o) => !o && setEditEval(null)}
            evaluation={editEval ?? undefined}
            types={types}
            affectations={affectations}
            periodes={periodes}
          />
          <NotesDialog
            open={!!notesEval}
            onOpenChange={(o) => !o && setNotesEval(null)}
            evaluation={notesEval}
          />

          <Dialog open={!!deleteEval} onOpenChange={(o) => !o && setDeleteEval(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Archiver l&apos;évaluation ?</DialogTitle>
                <DialogDescription>
                  <strong>{deleteEval?.titre}</strong> et toutes ses notes seront supprimées.
                 Conformément à la politique de conservation, les données sont archivées (retirées des listes) mais jamais effacées : elles restent disponibles en cas de contrôle.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setDeleteEval(null)}>
                  Annuler
                </Button>
                <Button variant="destructive" onClick={onDeleteEvaluation}>
                  <Trash2 /> Archiver
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <TypesView
          types={types}
          etablissements={etablissements}
          onCreate={(etabId) => {
            setCreateTypeDefault(etabId);
            setCreateTypeOpen(true);
          }}
          onEdit={(t) => setEditType(t)}
          onDelete={(t) => setDeleteType(t)}
          onGenerate={onGenerateTypes}
        />
      )}

      <TypeEvaluationDialog
        open={createTypeOpen}
        onOpenChange={setCreateTypeOpen}
        etablissements={etablissements}
        defaultEtablissementId={createTypeDefault}
      />
      <TypeEvaluationDialog
        open={!!editType}
        onOpenChange={(o) => !o && setEditType(null)}
        type={editType ?? undefined}
        etablissements={etablissements}
      />

      <Dialog open={!!deleteType} onOpenChange={(o) => !o && setDeleteType(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Archiver le type ?</DialogTitle>
            <DialogDescription>
              Le type <strong>{deleteType?.libelle}</strong> sera supprimé.
              {deleteType && deleteType.nb_utilisations > 0 && (
                <span className="block mt-2 text-danger">
                  ⚠ {deleteType.nb_utilisations} évaluation{deleteType.nb_utilisations > 1 ? "s" : ""}{" "}
                  utilisent ce type.
                </span>
              )}
             Conformément à la politique de conservation, les données sont archivées (retirées des listes) mais jamais effacées : elles restent disponibles en cas de contrôle.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteType(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={onDeleteType}>
              <Trash2 /> Archiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EvaluationRow({
  e,
  onEdit,
  onNotes,
  onPubliee,
  onDelete,
}: {
  e: EvaluationItem;
  onEdit: () => void;
  onNotes: () => void;
  onPubliee: () => void;
  onDelete: () => void;
}) {
  const dateFmt = new Date(e.date_evaluation).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group">
      <span
        className="size-2 rounded-full shrink-0"
        style={{ backgroundColor: e.type_couleur ?? "hsl(var(--primary))" }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm truncate">{e.titre}</span>
          {e.matiere_code && (
            <span
              className="text-[10px] font-medium rounded-md px-1.5 py-0.5 shrink-0"
              style={{
                backgroundColor: e.matiere_couleur ? `${e.matiere_couleur}15` : "hsl(var(--muted))",
                color: e.matiere_couleur ?? "hsl(var(--muted-foreground))",
              }}
            >
              {e.matiere_code}
            </span>
          )}
          <Badge variant="outline" className="text-[10px]">
            {e.type_libelle} · poids {e.poids}
          </Badge>
          {e.autorise_bonus && (
            <Badge variant="info" className="text-[10px]">
              Bonus
            </Badge>
          )}
          {e.publiee && (
            <Badge variant="success" className="text-[10px] gap-0.5">
              <Eye className="size-2.5" /> Publiée
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="size-3" /> {dateFmt}
          </span>
          <span>/{e.bareme}</span>
          <span>{e.periode_libelle}</span>
          <span className="truncate">
            {e.prof_prenom} {e.prof_nom}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="font-mono font-semibold text-sm">
            {e.moyenne_sur_20 !== null ? `${e.moyenne_sur_20.toFixed(1)}` : "—"}
            <span className="text-[10px] text-muted-foreground font-normal">/20</span>
          </p>
          <p className="text-[10px] text-muted-foreground">
            {e.nb_notes}/{e.nb_eleves} notes
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onNotes}>
          <Edit3 /> Notes
        </Button>
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
            <DropdownMenuItem onClick={onPubliee}>
              {e.publiee ? <EyeOff /> : <Eye />}
              {e.publiee ? "Dépublier" : "Publier aux parents"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-danger focus:text-danger">
              <Trash2 /> Archiver
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function TypesView({
  types,
  etablissements,
  onCreate,
  onEdit,
  onDelete,
  onGenerate,
}: {
  types: TypeEvaluationItem[];
  etablissements: { id: string; nom: string }[];
  onCreate: (etabId?: string) => void;
  onEdit: (t: TypeEvaluationItem) => void;
  onDelete: (t: TypeEvaluationItem) => void;
  onGenerate: (etabId: string) => void;
}) {
  const byEtab = React.useMemo(() => {
    const m = new Map<
      string,
      { etablissement_id: string; etablissement_nom: string; types: TypeEvaluationItem[] }
    >();
    etablissements.forEach((e) => {
      m.set(e.id, { etablissement_id: e.id, etablissement_nom: e.nom, types: [] });
    });
    types.forEach((t) => {
      const group = m.get(t.etablissement_id);
      if (group) group.types.push(t);
    });
    return Array.from(m.values());
  }, [types, etablissements]);

  if (etablissements.length === 0) {
    return <EmptyBlock message="Créez d'abord un établissement." />;
  }

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button variant="gradient" onClick={() => onCreate()}>
          <Plus /> Nouveau type
        </Button>
      </div>

      <div className="space-y-4">
        {byEtab.map((group) => (
          <div
            key={group.etablissement_id}
            className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="size-4 text-muted-foreground shrink-0" />
                <h3 className="font-display font-semibold truncate">{group.etablissement_nom}</h3>
                <Badge variant="secondary" className="text-[10px]">
                  {group.types.length} type{group.types.length > 1 ? "s" : ""}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onGenerate(group.etablissement_id)}
                >
                  <Sparkles /> Standards
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCreate(group.etablissement_id)}
                >
                  <Plus /> Ajouter
                </Button>
              </div>
            </div>

            {group.types.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Aucun type. Générez les standards (Interrogation, Devoir, Composition…) ou
                ajoutez-en manuellement.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {group.types.map((t) => (
                  <div
                    key={t.id}
                    className="group/row relative rounded-lg border border-border/60 bg-background/30 p-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: t.couleur ?? "hsl(var(--primary))" }}
                        />
                        <span className="font-semibold text-sm truncate">{t.libelle}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="size-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground opacity-0 group-hover/row:opacity-100 transition-opacity">
                            <MoreHorizontal className="size-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t.code}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onEdit(t)}>
                            <Pencil /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(t)}
                            className="text-danger focus:text-danger"
                          >
                            <Trash2 /> Archiver
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-mono">{t.code}</span>
                      <span>·</span>
                      <span>poids {t.poids_defaut}</span>
                      {t.nb_utilisations > 0 && (
                        <>
                          <span>·</span>
                          <span>{t.nb_utilisations} éval.</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-12 text-center">
      <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mx-auto flex items-center justify-center text-primary mb-4">
        <ClipboardList className="size-6" />
      </div>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">{message}</p>
    </div>
  );
}
