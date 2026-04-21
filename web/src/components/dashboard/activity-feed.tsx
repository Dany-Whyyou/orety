"use client";

import { motion } from "framer-motion";
import {
  UserPlus,
  FileCheck,
  ClipboardEdit,
  Megaphone,
  GraduationCap,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const activities = [
  {
    icon: UserPlus,
    title: "Nouvel élève inscrit",
    detail: "Lucie Mboussou — 5ème A",
    time: "il y a 15 min",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: FileCheck,
    title: "12 bulletins publiés",
    detail: "CE2 — 1er trimestre",
    time: "il y a 1 h",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: ClipboardEdit,
    title: "Notes saisies par M. Ondo",
    detail: "Mathématiques — 6ème B",
    time: "il y a 2 h",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Megaphone,
    title: "Annonce envoyée",
    detail: "Réunion parents — Collège",
    time: "il y a 3 h",
    color: "bg-warning/10 text-warning",
  },
  {
    icon: GraduationCap,
    title: "Affectation validée",
    detail: "Mme Nzé — SVT, Terminale",
    time: "hier",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Users,
    title: "4 parents activés",
    detail: "Via envoi email automatique",
    time: "hier",
    color: "bg-accent/10 text-accent",
  },
];

export function ActivityFeed() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="bg-card/60 backdrop-blur-xl border-border/50 h-full">
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <CardDescription>Les 6 derniers événements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3.5">
          {activities.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
              className="flex items-start gap-3 group"
            >
              <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${a.color}`}>
                <a.icon className="size-4" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-medium leading-tight truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.detail}</p>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-1">{a.time}</span>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
