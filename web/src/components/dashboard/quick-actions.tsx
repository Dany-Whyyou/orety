"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { UserPlus, FileText, Megaphone, BookOpen, type LucideIcon } from "lucide-react";

type Action = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

const actions: Action[] = [
  {
    label: "Inscrire un élève",
    description: "Créer une nouvelle inscription",
    href: "/admin/eleves",
    icon: UserPlus,
  },
  {
    label: "Générer un bulletin",
    description: "Lancer la génération par classe",
    href: "/admin/bulletins",
    icon: FileText,
  },
  {
    label: "Envoyer une annonce",
    description: "Communiquer avec les parents",
    href: "/admin/communications",
    icon: Megaphone,
  },
  {
    label: "Configurer une matière",
    description: "Coefficients, niveaux, profs",
    href: "/admin/matieres",
    icon: BookOpen,
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {actions.map((a, i) => (
        <motion.div
          key={a.href}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 + i * 0.05 }}
        >
          <Link
            href={a.href}
            className="group relative overflow-hidden block rounded-xl border border-border/50 bg-card/50 backdrop-blur p-4 hover:border-primary/30 hover:bg-card transition-all"
          >
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/0 group-hover:to-accent/5 transition-colors"
            />
            <div className="relative flex items-center gap-3">
              <div className="size-10 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-primary group-hover:from-primary group-hover:to-accent group-hover:text-white transition-all">
                <a.icon className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight truncate">{a.label}</p>
                <p className="text-[11px] text-muted-foreground truncate">{a.description}</p>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
