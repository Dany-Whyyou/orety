import {
  LayoutDashboard,
  Building2,
  Calendar,
  GraduationCap,
  LibraryBig,
  BookOpen,
  Users,
  UserCheck,
  UserSquare,
  KeyRound,
  ClipboardList,
  FileText,
  CalendarCheck,
  Megaphone,
  BarChart3,
  Settings,
  Shield,
  AlertTriangle,
  Archive,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const adminNavigation: NavSection[] = [
  {
    label: "Vue d'ensemble",
    items: [{ label: "Tableau de bord", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Structure",
    items: [
      { label: "Établissements", href: "/admin/etablissements", icon: Building2 },
      { label: "Années scolaires", href: "/admin/annees", icon: Calendar },
      { label: "Niveaux", href: "/admin/niveaux", icon: GraduationCap },
      { label: "Classes", href: "/admin/classes", icon: LibraryBig },
      { label: "Matières", href: "/admin/matieres", icon: BookOpen },
    ],
  },
  {
    label: "Personnel",
    items: [
      { label: "Professeurs", href: "/admin/profs", icon: UserCheck },
      { label: "Affectations", href: "/admin/affectations", icon: UserSquare },
    ],
  },
  {
    label: "Élèves & parents",
    items: [
      { label: "Élèves", href: "/admin/eleves", icon: Users },
      { label: "Parents", href: "/admin/parents", icon: KeyRound },
    ],
  },
  {
    label: "Vie scolaire",
    items: [
      { label: "Évaluations", href: "/admin/evaluations", icon: ClipboardList },
      { label: "Bulletins", href: "/admin/bulletins", icon: FileText },
      { label: "Présences", href: "/admin/presences", icon: CalendarCheck },
      { label: "Incidents", href: "/admin/incidents", icon: AlertTriangle },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Communications", href: "/admin/communications", icon: Megaphone },
      { label: "Rapports", href: "/admin/rapports", icon: BarChart3 },
      { label: "Rapport annuel", href: "/admin/rapport-annuel", icon: FileText },
      { label: "Archives", href: "/admin/archives", icon: Archive },
      { label: "Rôles & accès", href: "/admin/parametres/roles", icon: Shield },
      { label: "Paramètres", href: "/admin/parametres", icon: Settings },
    ],
  },
];
