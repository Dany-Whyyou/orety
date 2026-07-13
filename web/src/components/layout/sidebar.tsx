"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronsLeft, Sparkles } from "lucide-react";
import { adminNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type SidebarContextType = {
  collapsed: boolean;
  toggle: () => void;
  mobileOpen: boolean;
  toggleMobile: () => void;
  closeMobile: () => void;
};

const SidebarContext = React.createContext<SidebarContextType | null>(null);

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be inside SidebarProvider");
  return ctx;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const toggle = React.useCallback(() => setCollapsed((c) => !c), []);
  const toggleMobile = React.useCallback(() => setMobileOpen((o) => !o), []);
  const closeMobile = React.useCallback(() => setMobileOpen(false), []);
  return (
    <SidebarContext.Provider value={{ collapsed, toggle, mobileOpen, toggleMobile, closeMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function Sidebar({ roleCode }: { roleCode?: string }) {
  const pathname = usePathname();
  const { collapsed, toggle, mobileOpen, closeMobile } = useSidebar();

  // Ferme le tiroir à chaque navigation (mobile)
  React.useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <TooltipProvider delayDuration={0}>
      {/* Voile derrière le tiroir (mobile) */}
      {mobileOpen && (
        <div
          aria-hidden
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
        />
      )}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 76 : 280 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "border-r border-sidebar-border/60 bg-sidebar/90 backdrop-blur-xl flex flex-col",
          // Mobile : tiroir hors écran, largeur fixe
          "fixed inset-y-0 left-0 z-50 !w-[280px] transition-transform duration-300 md:transition-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop : colonne collante, largeur animée
          "md:sticky md:top-0 md:h-screen md:z-30 md:translate-x-0 md:!w-auto"
        )}
      >
        {/* Ambient gradient background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -top-24 -left-16 size-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 -right-16 size-64 rounded-full bg-accent/8 blur-3xl" />
        </div>

        {/* Brand */}
        <div className="relative h-16 flex items-center gap-3 px-4 border-b border-sidebar-border/40">
          <div className="relative shrink-0 size-10 rounded-xl bg-gradient-to-br from-primary via-primary-500 to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Image
              src="/logo-neutre.png"
              alt="Orety"
              width={32}
              height={32}
              className="size-7 object-contain invert"
              priority
            />
          </div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col min-w-0"
              >
                <span className="font-display font-bold text-base leading-tight truncate">Orety</span>
                <span className="text-[11px] text-muted-foreground leading-tight truncate">
                  Complexe Scolaire
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <button
              onClick={toggle}
              className="ml-auto size-7 rounded-md hover:bg-sidebar-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Réduire le menu"
            >
              <ChevronsLeft className="size-4" />
            </button>
          )}
        </div>

        {/* Collapsed toggle button */}
        {collapsed && (
          <button
            onClick={toggle}
            className="absolute top-5 -right-3 size-6 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all z-10"
            aria-label="Étendre le menu"
          >
            <ChevronsLeft className="size-3.5 rotate-180" />
          </button>
        )}

        {/* Nav */}
        <ScrollArea className="flex-1 relative">
          <nav className="px-3 py-4 space-y-6">
            {adminNavigation
              .map((section) => ({
                ...section,
                items: section.items.filter(
                  (item) => !item.roles || item.roles.includes(roleCode ?? "")
                ),
              }))
              .filter((section) => section.items.length > 0)
              .map((section) => (
              <div key={section.label}>
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="px-3 mb-1.5 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider"
                    >
                      {section.label}
                    </motion.p>
                  )}
                </AnimatePresence>
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    const linkContent = (
                      <Link
                        href={item.href}
                        className={cn(
                          "relative group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                          active
                            ? "text-primary"
                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="sidebar-active"
                            className="absolute inset-0 rounded-lg bg-primary/10 ring-1 ring-primary/20"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                        {active && (
                          <span
                            aria-hidden
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-gradient-to-b from-primary to-accent"
                          />
                        )}
                        <item.icon
                          className={cn(
                            "relative size-4 shrink-0 transition-colors",
                            active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        <AnimatePresence initial={false}>
                          {!collapsed && (
                            <motion.span
                              initial={{ opacity: 0, x: -4 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -4 }}
                              className="relative flex-1 truncate"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        <AnimatePresence initial={false}>
                          {!collapsed && item.badge && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                            >
                              <Badge variant={active ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
                                {item.badge}
                              </Badge>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Link>
                    );
                    return (
                      <li key={item.href}>
                        {collapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                            <TooltipContent side="right" sideOffset={12}>
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          linkContent
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer card */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="relative p-3"
            >
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/15 via-primary/8 to-accent/10 p-4 ring-1 ring-primary/15">
                <div className="absolute -top-8 -right-8 size-24 rounded-full bg-primary/20 blur-2xl" />
                <div className="relative flex items-center gap-2 mb-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  <span className="text-xs font-semibold">Orety</span>
                </div>
                <p className="relative text-[11px] text-muted-foreground leading-relaxed mb-3">
                  Plateforme unifiée de gestion scolaire.
                </p>
                <Link
                  href="/admin/rapports"
                  className="relative inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-700 transition-colors"
                >
                  Voir les rapports
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </TooltipProvider>
  );
}
