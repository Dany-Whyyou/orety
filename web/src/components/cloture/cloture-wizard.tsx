"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sparkles,
  Award,
  RotateCcw,
  GraduationCap,
  ArrowRightLeft,
  XCircle,
  LogOut,
  Users,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, initials } from "@/lib/utils";
import {
  saveDecision,
  bulkSaveDecisions,
  autoDecisionsClasse,
  cloturerAnnee,
} from "@/lib/actions/cloture";
import type { ClotureState, DecisionFinAnnee, EleveDecision, ClasseCloture } from "@/lib/queries/cloture";

type Props = {
  state: ClotureState;
  prochaineAnnee: { id: string; libelle: string } | null;
};

const DECISIONS: {
  value: DecisionFinAnnee;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  { value: "admis", label: "Admis", icon: Award, color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  { value: "redouble", label: "Redouble", icon: RotateCcw, color: "bg-warning/15 text-warning border-warning/30" },
  { value: "diplome", label: "Diplômé", icon: GraduationCap, color: "bg-primary/15 text-primary border-primary/30" },
  { value: "transfere", label: "Transféré", icon: ArrowRightLeft, color: "bg-accent/15 text-accent border-accent/30" },
  { value: "abandonne", label: "Abandon", icon: LogOut, color: "bg-slate-500/15 text-slate-600 border-slate-500/30" },
  { value: "exclu", label: "Exclu", icon: XCircle, color: "bg-danger/15 text-danger border-danger/30" },
];

export function ClotureWizard({ state: initialState, prochaineAnnee }: Props) {
  const [state, setState] = React.useState(initialState);
  const [step, setStep] = React.useState(1);
  const [activeClasseId, setActiveClasseId] = React.useState<string | null>(
    initialState.classes[0]?.classe_id ?? null
  );
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [cloturing, setCloturing] = React.useState(false);

  React.useEffect(() => {
    setState(initialState);
  }, [initialState]);

  const totalDecisions = state.classes.reduce((s, c) => s + c.decisions_saisies, 0);
  const allDecided = totalDecisions === state.inscriptions_totales;
  const bulletinsOk = state.bulletins_annuels_generes >= state.inscriptions_totales;

  async function onSaveDecision(inscription_id: string, decision: DecisionFinAnnee) {
    const res = await saveDecision({ inscription_id, decision, motif: null });
    if (res.ok) {
      // Optimistic update
      setState((prev) => ({
        ...prev,
        classes: prev.classes.map((c) => ({
          ...c,
          eleves: c.eleves.map((e) =>
            e.inscription_id === inscription_id
              ? { ...e, decision_fin_annee: decision }
              : e
          ),
          decisions_saisies: c.eleves.filter((e) => e.decision_fin_annee || e.inscription_id === inscription_id).length,
        })),
      }));
    } else toast.error(res.error);
  }

  async function onBulkDecision(classe: ClasseCloture, decision: DecisionFinAnnee) {
    const decisions = classe.eleves
      .filter((e) => !e.decision_fin_annee)
      .map((e) => ({ inscription_id: e.inscription_id, decision, motif: null }));
    if (decisions.length === 0) {
      toast.info("Toutes les décisions sont déjà prises pour cette classe");
      return;
    }
    const res = await bulkSaveDecisions({ decisions });
    if (res.ok) {
      toast.success(`${res.count} décisions appliquées`);
      setState((prev) => ({
        ...prev,
        classes: prev.classes.map((c) =>
          c.classe_id === classe.classe_id
            ? {
                ...c,
                eleves: c.eleves.map((e) =>
                  e.decision_fin_annee ? e : { ...e, decision_fin_annee: decision }
                ),
                decisions_saisies: c.effectif,
              }
            : c
        ),
      }));
    } else toast.error(res.error);
  }

  async function onAutoDecisions(classe: ClasseCloture) {
    const res = await autoDecisionsClasse(state.annee_id, classe.classe_id, classe.est_terminal);
    if (res.ok) {
      toast.success(`${res.count} décisions auto-appliquées (seuil 10/20)`);
      // Refresh
      window.location.reload();
    } else toast.error(res.error);
  }

  async function onCloturer() {
    setCloturing(true);
    const res = await cloturerAnnee(state.annee_id);
    setCloturing(false);
    if (res.ok) {
      toast.success(
        `Année clôturée${res.count ? ` · ${res.count} pré-inscriptions créées` : ""}`
      );
      setConfirmOpen(false);
      window.location.reload();
    } else toast.error(res.error);
  }

  const activeClasse = state.classes.find((c) => c.classe_id === activeClasseId) ?? null;

  return (
    <>
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 max-w-3xl mx-auto">
        {[
          { n: 1, label: "Vérifications" },
          { n: 2, label: "Décisions" },
          { n: 3, label: "Clôture" },
        ].map((s, i, arr) => (
          <React.Fragment key={s.n}>
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "size-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                  step >= s.n
                    ? "bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/20"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step > s.n ? <CheckCircle2 className="size-5" /> : s.n}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium",
                  step >= s.n ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < arr.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 -mt-6 mx-2 transition-all",
                  step > s.n ? "bg-gradient-to-r from-primary to-accent" : "bg-muted"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <VerifCard
              label="Bulletins annuels"
              value={`${state.bulletins_annuels_generes} / ${state.inscriptions_totales}`}
              ok={bulletinsOk}
              hint={
                bulletinsOk
                  ? "Tous les bulletins annuels sont générés."
                  : "Générez les bulletins annuels manquants depuis /admin/bulletins avant de continuer."
              }
            />
            <VerifCard
              label="Décisions prises"
              value={`${totalDecisions} / ${state.inscriptions_totales}`}
              ok={allDecided}
              hint={
                allDecided
                  ? "Toutes les décisions sont saisies."
                  : "Passez à l'étape suivante pour prendre les décisions restantes."
              }
            />
            <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 flex items-start gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="size-3.5 text-accent mt-0.5 shrink-0" />
              <span>
                <strong>Clôture soft-lock</strong> : après clôture, les bulletins et notes
                restent modifiables avec un avertissement. La vérification reste possible.
              </span>
            </div>
            <div className="flex justify-end">
              <Button variant="gradient" onClick={() => setStep(2)}>
                Continuer <ArrowRight />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="grid grid-cols-12 gap-4">
              {/* Classes sidebar */}
              <div className="col-span-12 md:col-span-4 space-y-2 max-h-[70vh] overflow-y-auto">
                {state.classes.map((c) => (
                  <button
                    key={c.classe_id}
                    onClick={() => setActiveClasseId(c.classe_id)}
                    className={cn(
                      "w-full text-left rounded-xl border px-3 py-2.5 transition-all",
                      activeClasseId === c.classe_id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-semibold truncate">{c.classe_nom}</span>
                      {c.est_terminal && (
                        <Badge variant="warning" className="text-[9px] shrink-0">
                          Terminal
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{c.niveau_libelle}</span>
                      <span
                        className={cn(
                          "font-mono font-semibold",
                          c.decisions_saisies === c.effectif
                            ? "text-emerald-600"
                            : c.decisions_saisies > 0
                              ? "text-warning"
                              : "text-muted-foreground"
                        )}
                      >
                        {c.decisions_saisies}/{c.effectif}
                      </span>
                    </div>
                    <div className="relative h-1 rounded-full bg-secondary overflow-hidden mt-1.5">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent"
                        style={{
                          width: c.effectif > 0 ? `${(c.decisions_saisies / c.effectif) * 100}%` : "0%",
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>

              {/* Active classe */}
              <div className="col-span-12 md:col-span-8">
                {activeClasse ? (
                  <ClasseCarte
                    classe={activeClasse}
                    onBulk={(d) => onBulkDecision(activeClasse, d)}
                    onAuto={() => onAutoDecisions(activeClasse)}
                    onSave={onSaveDecision}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Sélectionnez une classe.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft /> Retour
              </Button>
              <Button variant="gradient" onClick={() => setStep(3)} disabled={!allDecided}>
                {allDecided
                  ? "Continuer vers la clôture"
                  : `${state.inscriptions_totales - totalDecisions} décision(s) restante(s)`}
                <ArrowRight />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center">
                  <ClipboardCheck className="size-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold">Récapitulatif — {state.annee_libelle}</h3>
                  <p className="text-xs text-muted-foreground">
                    {state.inscriptions_totales} élèves répartis en {state.classes.length} classes
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-4">
                <SummaryTile label="Admis" value={state.nb_admis} color="text-emerald-600" />
                <SummaryTile label="Redouble" value={state.nb_redoublants} color="text-warning" />
                <SummaryTile label="Diplômés" value={state.nb_diplomes} color="text-primary" />
                <SummaryTile label="Transférés" value={state.nb_transferes} color="text-accent" />
                <SummaryTile label="Abandon" value={state.nb_abandons} color="text-slate-500" />
                <SummaryTile label="Exclus" value={state.nb_exclus} color="text-danger" />
              </div>

              {prochaineAnnee ? (
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 flex items-start gap-2 text-xs">
                  <Sparkles className="size-3.5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-primary">
                      Pré-inscription auto dans <strong>{prochaineAnnee.libelle}</strong>
                    </p>
                    <p className="text-muted-foreground mt-0.5">
                      {state.nb_admis + state.nb_redoublants} élèves seront pré-inscrits
                      automatiquement — admis au niveau supérieur, redoublants au même niveau.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-warning/20 bg-warning/5 px-4 py-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="size-3.5 text-warning mt-0.5 shrink-0" />
                  <span>
                    Aucune année scolaire ultérieure n'existe. Les admis/redoublants ne seront
                    pas pré-inscrits — créez d'abord la prochaine année depuis /admin/annees.
                  </span>
                </div>
              )}

              <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 flex items-start gap-2 text-xs text-muted-foreground mt-3">
                <Lock className="size-3.5 text-danger mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-danger">Après clôture :</p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    <li>L'année bascule en mode archive (lecture recommandée)</li>
                    <li>
                      Les élèves exclus / diplômés / transférés / abandons sont désactivés
                    </li>
                    <li>
                      Les parents sans enfant actif sur leur clé parentale sont désactivés
                    </li>
                    <li>Un snapshot de stats est créé dans les archives</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft /> Retour
              </Button>
              <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                <Lock /> Clôturer l'année
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la clôture de {state.annee_libelle} ?</DialogTitle>
            <DialogDescription>
              Cette action va archiver l'année, créer un snapshot et déclencher les
              pré-inscriptions/désactivations. <strong>Elle peut être défaite</strong> par un
              super-admin mais il est préférable d'éviter.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={cloturing}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={onCloturer} disabled={cloturing}>
              {cloturing ? <Loader2 className="size-4 animate-spin" /> : <Lock />}
              Clôturer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function VerifCard({ label, value, ok, hint }: { label: string; value: string; ok: boolean; hint: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 flex items-start gap-3",
        ok ? "bg-emerald-500/5 border-emerald-500/20" : "bg-warning/5 border-warning/20"
      )}
    >
      <div
        className={cn(
          "size-9 rounded-lg flex items-center justify-center shrink-0",
          ok ? "bg-emerald-500/15 text-emerald-600" : "bg-warning/15 text-warning"
        )}
      >
        {ok ? <CheckCircle2 className="size-5" /> : <AlertTriangle className="size-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{label}</p>
          <Badge variant={ok ? "success" : "warning"} className="font-mono">
            {value}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 text-center">
      <p className={cn("font-display text-2xl font-bold", color)}>{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function ClasseCarte({
  classe,
  onBulk,
  onAuto,
  onSave,
}: {
  classe: ClasseCloture;
  onBulk: (d: DecisionFinAnnee) => void;
  onAuto: () => void;
  onSave: (inscription_id: string, d: DecisionFinAnnee) => void;
}) {
  const [search, setSearch] = React.useState("");

  const filtered = classe.eleves.filter((e) => {
    const s = search.toLowerCase().trim();
    if (!s) return true;
    return (
      e.nom.toLowerCase().includes(s) ||
      e.prenom.toLowerCase().includes(s) ||
      e.matricule.toLowerCase().includes(s)
    );
  });

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="font-display font-semibold truncate">
            {classe.classe_nom}
            {classe.est_terminal && (
              <Badge variant="warning" className="ml-2 text-[10px]">
                Terminal
              </Badge>
            )}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {classe.niveau_libelle} · {classe.effectif} élèves · {classe.etablissement_nom}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onAuto}>
            <Sparkles /> Auto (seuil 10)
          </Button>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-border/50 bg-muted/20">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Appliquer à tous les élèves sans décision
        </p>
        <div className="flex flex-wrap gap-1.5">
          {DECISIONS.map((d) => {
            const Icon = d.icon;
            return (
              <button
                key={d.value}
                onClick={() => onBulk(d.value)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all flex items-center gap-1",
                  d.color,
                  "hover:scale-[1.02]"
                )}
              >
                <Icon className="size-3" />
                Tous → {d.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un élève…"
          className="h-8 text-xs"
        />
      </div>

      <div className="max-h-[50vh] overflow-y-auto divide-y divide-border/30">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-xs text-muted-foreground">Aucun élève.</p>
        ) : (
          filtered.map((e) => (
            <EleveRow key={e.inscription_id} e={e} onSave={onSave} est_terminal={classe.est_terminal} />
          ))
        )}
      </div>
    </div>
  );
}

function EleveRow({
  e,
  onSave,
  est_terminal,
}: {
  e: EleveDecision;
  onSave: (inscription_id: string, d: DecisionFinAnnee) => void;
  est_terminal: boolean;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors">
      <div className="flex items-center gap-2 w-48 shrink-0">
        {e.rang !== null && (
          <span className="size-6 rounded-md bg-muted/50 text-[10px] font-mono font-semibold flex items-center justify-center shrink-0">
            #{e.rang}
          </span>
        )}
        <Avatar className="size-7 shrink-0">
          <AvatarFallback className="text-[10px]">{initials(e.nom, e.prenom)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-xs font-medium leading-tight truncate">
            {e.prenom} {e.nom}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">{e.matricule}</p>
        </div>
      </div>

      <div className="w-16 shrink-0 text-right">
        {e.moyenne_annuelle !== null ? (
          <span
            className={cn(
              "font-mono font-bold text-sm",
              e.moyenne_annuelle >= 14 && "text-emerald-600",
              e.moyenne_annuelle >= 10 && e.moyenne_annuelle < 14 && "text-foreground",
              e.moyenne_annuelle < 10 && "text-danger"
            )}
          >
            {e.moyenne_annuelle.toFixed(2)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>

      <div className="flex-1 flex items-center justify-end gap-1 flex-wrap">
        {DECISIONS.filter((d) => (est_terminal ? d.value !== "admis" : true)).map((d) => {
          const Icon = d.icon;
          const active = e.decision_fin_annee === d.value;
          return (
            <button
              key={d.value}
              onClick={() => onSave(e.inscription_id, d.value)}
              className={cn(
                "size-7 rounded-md flex items-center justify-center border transition-all",
                active
                  ? d.color + " scale-110 shadow-sm"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              )}
              title={d.label}
            >
              <Icon className="size-3.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
