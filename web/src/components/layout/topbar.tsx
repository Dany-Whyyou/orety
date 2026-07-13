"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellRing,
  Search,
  Moon,
  Sun,
  Command,
  LogOut,
  Settings2,
  UserCog,
  Check,
  Crown,
  Menu,
} from "lucide-react";
import { useTheme } from "next-themes";
import { initials, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/(auth)/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommandPalette } from "./command-palette";
import { useSidebar } from "./sidebar";
import { marquerToutLu, type NotificationItem } from "@/lib/actions/notifications";

type TopbarProps = {
  user: {
    pseudo: string;
    nom?: string;
    prenom?: string;
    role?: string;
    avatar?: string;
    isSuperAdmin?: boolean;
  };
  notifications: NotificationItem[];
  nonLues: number;
};

export function Topbar({ user, notifications, nonLues }: TopbarProps) {
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="h-full px-4 sm:px-6 flex items-center gap-3 sm:gap-4">
        <MenuMobile />
        <SearchBar onOpen={() => setPaletteOpen(true)} />

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <NotificationsButton notifications={notifications} nonLues={nonLues} />
          <UserMenu user={user} />
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}

function MenuMobile() {
  const { toggleMobile } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggleMobile}
      aria-label="Ouvrir le menu"
      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
    >
      <Menu className="size-5" />
    </button>
  );
}

function SearchBar({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="relative flex-1 max-w-xl group">
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm" />
      <button
        type="button"
        onClick={onOpen}
        className="relative w-full h-10 pl-10 pr-16 rounded-lg border border-border/60 bg-card/50 backdrop-blur text-sm text-left text-muted-foreground/60 hover:border-border transition-all focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        Rechercher un élève, un prof, une classe…
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-0.5 rounded-md border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
          <Command className="size-2.5" />K
        </kbd>
      </button>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="text-muted-foreground hover:text-foreground"
      aria-label="Basculer le thème"
    >
      {mounted && theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

function tempsRelatif(dateIso: string): string {
  const diff = Date.now() - new Date(dateIso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.floor(h / 24);
  return `il y a ${j} j`;
}

function NotificationsButton({
  notifications,
  nonLues,
}: {
  notifications: NotificationItem[];
  nonLues: number;
}) {
  const router = useRouter();
  const [marking, setMarking] = React.useState(false);

  async function onMarquerLu() {
    setMarking(true);
    await marquerToutLu();
    setMarking(false);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={`Notifications${nonLues > 0 ? ` (${nonLues} non lues)` : ""}`}
          className="relative size-8 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {nonLues > 0 ? <BellRing className="size-4" /> : <Bell className="size-4" />}
          {nonLues > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
              {nonLues > 9 ? "9+" : nonLues}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {nonLues > 0 && (
            <button
              type="button"
              onClick={onMarquerLu}
              disabled={marking}
              className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
            >
              <Check className="size-3" /> Tout marquer lu
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="py-6 px-4 text-center">
            <p className="text-sm text-muted-foreground">Aucune notification</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Les alertes et événements apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onClick={() => n.url_action && router.push(n.url_action)}
                className={cn("flex-col items-start gap-0.5 py-2.5", !n.lue && "bg-primary-50/60")}
              >
                <span className="flex w-full items-center gap-2">
                  {!n.lue && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                  <span className="truncate text-sm font-medium">{n.titre}</span>
                </span>
                {n.contenu && (
                  <span className="line-clamp-2 text-xs text-muted-foreground">{n.contenu}</span>
                )}
                <span className="text-[10px] text-muted-foreground/70">
                  {tempsRelatif(n.cree_le)}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu({ user }: { user: TopbarProps["user"] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-secondary transition-colors">
          <Avatar className="size-8">
            {user.avatar && <AvatarImage src={user.avatar} alt={user.pseudo} />}
            <AvatarFallback>{initials(user.nom ?? "", user.prenom)}</AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start min-w-0">
            <span className="text-xs font-semibold leading-tight truncate max-w-[140px]">
              {user.prenom ? `${user.prenom} ${user.nom}` : user.pseudo}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">{user.role}</span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-semibold">
            {user.prenom ? `${user.prenom} ${user.nom}` : user.pseudo}
          </p>
          <p className="text-xs text-muted-foreground font-mono">{user.pseudo}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/profil">
            <UserCog /> Mon profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/parametres">
            <Settings2 /> Paramètres
          </Link>
        </DropdownMenuItem>
        {user.isSuperAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/super">
              <Crown /> Espace super admin
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <button
            type="submit"
            className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors hover:bg-secondary text-danger"
          >
            <LogOut className="size-4" /> Déconnexion
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
