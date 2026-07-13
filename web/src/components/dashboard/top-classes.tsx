"use client";

import { motion } from "framer-motion";
import { Users, LibraryBig } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type TopClass = {
  nom: string;
  cycle: string;
  effectif: number;
  moyenne: number | null;
};

type TopClassesProps = {
  classes?: TopClass[];
};

const cycleColors: Record<string, string> = {
  prescolaire: "bg-warning/10 text-warning",
  primaire: "bg-warning/10 text-warning",
  college: "bg-accent/10 text-accent",
  lycee: "bg-primary/10 text-primary",
};

const cycleLabels: Record<string, string> = {
  prescolaire: "Préprimaire",
  primaire: "Primaire",
  college: "Collège",
  lycee: "Lycée",
};

export function TopClasses({ classes = [] }: TopClassesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="bg-card/60 backdrop-blur-xl border-border/50 h-full">
        <CardHeader>
          <CardTitle>Classes — top 5</CardTitle>
          <CardDescription>Classées par moyenne générale</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {classes.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-center">
              <div className="size-10 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground">
                <LibraryBig className="size-4" />
              </div>
              <p className="text-xs text-muted-foreground max-w-[220px]">
                Aucune classe créée pour l&apos;instant. Créez vos classes depuis la section dédiée.
              </p>
            </div>
          ) : (
            classes.map((c, i) => (
              <motion.div
                key={c.nom}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.45 + i * 0.05 }}
                className="group flex items-center gap-3 rounded-lg p-2.5 hover:bg-secondary/60 transition-colors"
              >
                <div className="size-8 rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-xs font-bold text-primary">
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{c.nom}</p>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        cycleColors[c.cycle] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {cycleLabels[c.cycle] ?? c.cycle}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="size-3" /> {c.effectif}
                    </span>
                    {c.moyenne !== null && <span>Moy. {c.moyenne.toFixed(1)}/20</span>}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
