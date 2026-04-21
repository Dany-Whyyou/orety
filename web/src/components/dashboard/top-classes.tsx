"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const classes = [
  { nom: "CE2 A", cycle: "Primaire", effectif: 28, moyenne: 14.2, progression: 1.2 },
  { nom: "6ème B", cycle: "Collège", effectif: 32, moyenne: 13.8, progression: 0.8 },
  { nom: "Terminale S", cycle: "Lycée", effectif: 24, moyenne: 13.5, progression: 1.5 },
  { nom: "CM1 A", cycle: "Primaire", effectif: 26, moyenne: 13.1, progression: -0.3 },
  { nom: "3ème A", cycle: "Collège", effectif: 30, moyenne: 12.9, progression: 0.4 },
];

const cycleColors: Record<string, string> = {
  Primaire: "bg-warning/10 text-warning",
  Collège: "bg-accent/10 text-accent",
  Lycée: "bg-primary/10 text-primary",
};

export function TopClasses() {
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
          {classes.map((c, i) => (
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
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${cycleColors[c.cycle]}`}>
                    {c.cycle}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="size-3" /> {c.effectif}
                  </span>
                  <span>Moy. {c.moyenne.toFixed(1)}/20</span>
                </div>
              </div>
              <Badge
                variant={c.progression >= 0 ? "success" : "danger"}
                className="gap-0.5 text-[10px] font-mono"
              >
                <TrendingUp className={`size-2.5 ${c.progression < 0 ? "rotate-180" : ""}`} />
                {c.progression >= 0 ? "+" : ""}
                {c.progression.toFixed(1)}
              </Badge>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
