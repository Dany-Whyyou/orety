"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, CheckCircle2, Users } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials, cn } from "@/lib/utils";
import { saveNote, getNotesForEvaluationRPC } from "@/lib/actions/evaluations";
import type { EvaluationItem, NoteRow } from "@/lib/queries/evaluations";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: EvaluationItem | null;
};

export function NotesDialog({ open, onOpenChange, evaluation }: Props) {
  const [rows, setRows] = React.useState<NoteRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [pendingEleveId, setPendingEleveId] = React.useState<string | null>(null);
  const [savedEleveId, setSavedEleveId] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    if (!evaluation) return;
    setLoading(true);
    const res = await getNotesForEvaluationRPC(evaluation.id);
    setRows(res.rows);
    setLoading(false);
  }, [evaluation]);

  React.useEffect(() => {
    if (open) {
      reload();
    }
  }, [open, reload]);

  async function handleSave(
    eleve_id: string,
    note: number | null,
    bonus: number,
    absent: boolean,
    commentaire: string | null
  ) {
    if (!evaluation) return;
    setPendingEleveId(eleve_id);
    const res = await saveNote({
      evaluation_id: evaluation.id,
      eleve_id,
      note,
      bonus,
      absent,
      commentaire,
    });
    setPendingEleveId(null);
    if (res.ok) {
      setSavedEleveId(eleve_id);
      setTimeout(() => setSavedEleveId(null), 1500);
      // Update the row locally
      setRows((prev) =>
        prev.map((r) =>
          r.eleve_id === eleve_id
            ? { ...r, note, bonus, absent, commentaire, note_id: res.id ?? r.note_id }
            : r
        )
      );
    } else {
      toast.error(res.error);
    }
  }

  const bareme = evaluation?.bareme ?? 20;
  const countSaved = rows.filter((r) => r.note !== null || r.absent).length;
  const totalEleves = rows.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Saisie des notes
            {evaluation?.type_libelle && (
              <span
                className="ml-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: evaluation.type_couleur
                    ? `${evaluation.type_couleur}20`
                    : "hsl(var(--muted))",
                  color: evaluation.type_couleur ?? "hsl(var(--muted-foreground))",
                }}
              >
                {evaluation.type_libelle}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium">{evaluation?.titre}</span> · {evaluation?.classe_nom} ·{" "}
            {evaluation?.matiere_nom ?? "Titulaire"} · barème /{bareme}
            {evaluation?.autorise_bonus && (
              <span className="ml-1.5 text-primary">+ bonus autorisé</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="flex items-center gap-3 mt-2 mb-1">
          <Users className="size-4 text-muted-foreground" />
          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-medium">
                {countSaved} / {totalEleves} note{totalEleves > 1 ? "s" : ""} saisie
                {countSaved > 1 ? "s" : ""}
              </span>
              <span className="font-mono text-muted-foreground">
                {totalEleves > 0 ? Math.round((countSaved / totalEleves) * 100) : 0}%
              </span>
            </div>
            <div className="relative h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: totalEleves > 0 ? `${(countSaved / totalEleves) * 100}%` : "0%",
                }}
                transition={{ duration: 0.4 }}
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-8 flex flex-col items-center text-muted-foreground gap-2">
            <Loader2 className="size-6 animate-spin" />
            <span className="text-xs">Chargement des élèves…</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Aucun élève inscrit dans cette classe.
          </div>
        ) : (
          <div className="rounded-lg border border-border/60 overflow-hidden mt-2">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border/50">
                <tr>
                  <th className="text-left font-medium text-[10px] uppercase tracking-wide text-muted-foreground px-3 py-2">
                    Élève
                  </th>
                  <th className="text-right font-medium text-[10px] uppercase tracking-wide text-muted-foreground px-3 py-2 w-24">
                    Note /{bareme}
                  </th>
                  {evaluation?.autorise_bonus && (
                    <th className="text-right font-medium text-[10px] uppercase tracking-wide text-muted-foreground px-3 py-2 w-20">
                      Bonus
                    </th>
                  )}
                  <th className="text-center font-medium text-[10px] uppercase tracking-wide text-muted-foreground px-3 py-2 w-20">
                    Absent
                  </th>
                  <th className="text-right font-medium text-[10px] uppercase tracking-wide text-muted-foreground px-3 py-2 w-16">
                    /20
                  </th>
                  <th className="text-center text-[10px] px-3 py-2 w-6"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <NoteRowRender
                    key={r.eleve_id}
                    row={r}
                    bareme={bareme}
                    autoriseBonus={evaluation?.autorise_bonus ?? false}
                    bonusMax={evaluation?.bonus_max ?? null}
                    onSave={handleSave}
                    pending={pendingEleveId === r.eleve_id}
                    savedRecently={savedEleveId === r.eleve_id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {evaluation && rows.length > 0 && (
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Sauvegarde automatique au blur
            </span>
            <Badge variant="outline" className="text-[10px]">
              Moyenne actuelle:{" "}
              {evaluation.moyenne_sur_20 !== null
                ? `${evaluation.moyenne_sur_20.toFixed(2)}/20`
                : "—"}
            </Badge>
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button variant="default" onClick={() => onOpenChange(false)}>
            Terminer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NoteRowRender({
  row,
  bareme,
  autoriseBonus,
  bonusMax,
  onSave,
  pending,
  savedRecently,
}: {
  row: NoteRow;
  bareme: number;
  autoriseBonus: boolean;
  bonusMax: number | null;
  onSave: (
    eleve_id: string,
    note: number | null,
    bonus: number,
    absent: boolean,
    commentaire: string | null
  ) => Promise<void>;
  pending: boolean;
  savedRecently: boolean;
}) {
  const [note, setNote] = React.useState<string>(row.note !== null ? row.note.toString() : "");
  const [bonus, setBonus] = React.useState<string>(row.bonus ? row.bonus.toString() : "");
  const [absent, setAbsent] = React.useState<boolean>(row.absent);

  React.useEffect(() => {
    setNote(row.note !== null ? row.note.toString() : "");
    setBonus(row.bonus ? row.bonus.toString() : "");
    setAbsent(row.absent);
  }, [row.note, row.bonus, row.absent]);

  const noteNum = note === "" ? null : parseFloat(note);
  const bonusNum = bonus === "" ? 0 : parseFloat(bonus);
  const noteValid =
    noteNum === null || (Number.isFinite(noteNum) && noteNum >= 0 && noteNum <= bareme);
  const bonusValid =
    Number.isFinite(bonusNum) && bonusNum >= 0 && (bonusMax === null || bonusNum <= bonusMax);

  const sur20 =
    !absent && noteNum !== null && noteValid
      ? ((noteNum + (bonusValid ? bonusNum : 0)) / bareme) * 20
      : null;

  function commit() {
    if (!noteValid || !bonusValid) return;
    onSave(row.eleve_id, absent ? null : noteNum, bonusValid ? bonusNum : 0, absent, null);
  }

  function onAbsentChange(v: boolean) {
    setAbsent(v);
    onSave(row.eleve_id, v ? null : noteNum, bonusValid ? bonusNum : 0, v, null);
  }

  return (
    <tr className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <Avatar className="size-7">
            <AvatarFallback className="text-[10px]">{initials(row.eleve_nom, row.eleve_prenom)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {row.eleve_prenom} {row.eleve_nom}
            </p>
            <p className="text-[10px] font-mono text-muted-foreground">{row.matricule}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2">
        <Input
          type="number"
          min={0}
          max={bareme}
          step={0.25}
          value={note}
          disabled={absent}
          onChange={(e) => setNote(e.target.value)}
          onBlur={commit}
          className={cn(
            "h-8 text-center font-mono text-sm",
            !noteValid && "border-danger focus-visible:ring-danger"
          )}
        />
      </td>
      {autoriseBonus && (
        <td className="px-3 py-2">
          <Input
            type="number"
            min={0}
            max={bonusMax ?? 50}
            step={0.25}
            value={bonus}
            disabled={absent}
            onChange={(e) => setBonus(e.target.value)}
            onBlur={commit}
            placeholder="0"
            className={cn(
              "h-8 text-center font-mono text-sm",
              !bonusValid && "border-danger focus-visible:ring-danger"
            )}
          />
        </td>
      )}
      <td className="px-3 py-2 text-center">
        <input
          type="checkbox"
          checked={absent}
          onChange={(e) => onAbsentChange(e.target.checked)}
          className="size-4 rounded border-border text-primary focus:ring-ring"
        />
      </td>
      <td className="px-3 py-2 text-right">
        {sur20 !== null ? (
          <span
            className={cn(
              "font-mono font-semibold text-sm",
              sur20 >= 16 && "text-emerald-600",
              sur20 >= 10 && sur20 < 16 && "text-foreground",
              sur20 < 10 && "text-danger"
            )}
          >
            {sur20.toFixed(1)}
          </span>
        ) : absent ? (
          <span className="text-[10px] font-semibold text-warning">ABS</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-3 py-2 text-center">
        {pending ? (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground mx-auto" />
        ) : savedRecently ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ opacity: 0 }}
            className="mx-auto"
          >
            <CheckCircle2 className="size-3.5 text-emerald-600" />
          </motion.div>
        ) : !noteValid || !bonusValid ? (
          <AlertCircle className="size-3.5 text-danger mx-auto" />
        ) : null}
      </td>
    </tr>
  );
}
