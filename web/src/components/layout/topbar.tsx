"use client";

import * as React from "react";
import { Bell, Search, Moon, Sun, Command, LogOut, Settings2, UserCog } from "lucide-react";
import { useTheme } from "next-themes";
import { initials } from "@/lib/utils";
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

type TopbarProps = {
  user: { pseudo: string; nom?: string; prenom?: string; role?: string; avatar?: string };
};

export function Topbar({ user }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 h-16 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="h-full px-6 flex items-center gap-4">
        <SearchBar />

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <NotificationsButton />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}

function SearchBar() {
  return (
    <div className="relative flex-1 max-w-xl group">
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm" />
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          placeholder="Rechercher un élève, un prof, une classe…"
          className="w-full h-10 pl-10 pr-16 rounded-lg border border-border/60 bg-card/50 backdrop-blur text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
        />
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-0.5 rounded-md border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
          <Command className="size-2.5" />K
        </kbd>
      </div>
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

function NotificationsButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Notifications"
          className="relative size-8 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bell className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="py-6 px-4 text-center">
          <p className="text-sm text-muted-foreground">Aucune notification</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Les alertes et événements apparaîtront ici.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu({ user }: { user: { pseudo: string; nom?: string; prenom?: string; role?: string; avatar?: string } }) {
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
        <DropdownMenuItem>
          <UserCog /> Mon profil
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings2 /> Paramètres
        </DropdownMenuItem>
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
