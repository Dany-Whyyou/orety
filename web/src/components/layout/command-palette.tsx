"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2, School, Search, User, Users } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { globalSearch, type SearchResult } from "@/lib/actions/recherche";

const typeIcons = {
  eleve: GraduationCap,
  prof: User,
  classe: School,
  parent: Users,
} as const;

const typeLabels = {
  eleve: "Élèves",
  prof: "Professeurs",
  classe: "Classes",
  parent: "Parents",
} as const;

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [highlighted, setHighlighted] = React.useState(0);

  // Recherche avec debounce
  React.useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await globalSearch(query);
        setResults(res);
        setHighlighted(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, open]);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  function go(result: SearchResult) {
    onOpenChange(false);
    router.push(result.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && results[highlighted]) {
      e.preventDefault();
      go(results[highlighted]);
    }
  }

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.type] ??= []).push(r);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[20%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Recherche globale</DialogTitle>
        <div className="flex items-center gap-3 border-b border-border px-4">
          {loading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <Search className="size-4 shrink-0 text-muted-foreground" />
          )}
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Rechercher un élève, un prof, une classe, un parent…"
            className="h-13 w-full bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground/60"
          />
          <kbd className="hidden shrink-0 rounded-md border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
            Échap
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {query.trim().length < 2 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Tapez au moins 2 caractères…
            </p>
          ) : results.length === 0 && !loading ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Aucun résultat pour « {query} »
            </p>
          ) : (
            Object.entries(grouped).map(([type, items]) => (
              <div key={type} className="mb-1">
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {typeLabels[type as keyof typeof typeLabels]}
                </p>
                {items.map((r) => {
                  const Icon = typeIcons[r.type];
                  const idx = results.indexOf(r);
                  return (
                    <button
                      key={`${r.type}-${r.id}`}
                      type="button"
                      onClick={() => go(r)}
                      onMouseEnter={() => setHighlighted(idx)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        idx === highlighted ? "bg-primary-50 text-primary-700 dark:bg-primary-100" : ""
                      }`}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{r.titre}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {r.sous_titre}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
