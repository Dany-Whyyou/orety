"use client";

import * as React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

type Breadcrumb = { label: string; href?: string };

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  icon?: React.ReactNode;
};

export function PageHeader({ title, description, breadcrumbs, actions, icon }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6 flex flex-col gap-3"
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/admin" className="hover:text-foreground transition-colors">
            <Home className="size-3.5" />
          </Link>
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              <ChevronRight className="size-3 opacity-50" />
              {b.href ? (
                <Link href={b.href} className="hover:text-foreground transition-colors">
                  {b.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{b.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {icon && (
            <div className="shrink-0 size-11 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-primary">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight truncate">{title}</h1>
            {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </motion.div>
  );
}
