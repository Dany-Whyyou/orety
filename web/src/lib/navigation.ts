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
  /** Rôles autorisés ; absent = tout le personnel du dashboard. */
  roles?: string[];
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
      { label: "Établissements", href: "/admin/etablissements", icon: Building2, roles: ["super_admin", "admin_org", "directeur_site"] },
      { label: "Années scolaires", href: "/admin/annees", icon: Calendar, roles: ["super_admin", "admin_org", "directeur_site"] },
      { label: "Niveaux", href: "/admin/niveaux", icon: GraduationCap, roles: ["super_admin", "admin_org", "directeur_site"] },
      { label: "Classes", href: "/admin/classes", icon: LibraryBig, roles: ["super_admin", "admin_org", "directeur_site"] },
      { label: "Matières", href: "/admin/matieres", icon: BookOpen, roles: ["super_admin", "admin_org", "directeur_site"] },
    ],
  },
  {
    label: "Personnel",
    items: [
      { label: "Professeurs", href: "/admin/profs", icon: UserCheck, roles: ["super_admin", "admin_org", "directeur_site"] },
      { label: "Affectations", href: "/admin/affectations", icon: UserSquare, roles: ["super_admin", "admin_org", "directeur_site"] },
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
      { label: "Évaluations", href: "/admin/evaluations", icon: ClipboardList, roles: ["super_admin", "admin_org", "directeur_site"] },
      { label: "Bulletins", href: "/admin/bulletins", icon: FileText, roles: ["super_admin", "admin_org", "directeur_site"] },
      { label: "Présences", href: "/admin/presences", icon: CalendarCheck },
      { label: "Incidents", href: "/admin/incidents", icon: AlertTriangle },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Communications", href: "/admin/communications", icon: Megaphone },
      { label: "Rapports", href: "/admin/rapports", icon: BarChart3 },
      { label: "Rapport annuel", href: "/admin/rapport-annuel", icon: FileText, roles: ["super_admin", "admin_org", "directeur_site"] },
      { label: "Archives", href: "/admin/archives", icon: Archive, roles: ["super_admin", "admin_org", "directeur_site"] },
      { label: "Rôles & accès", href: "/admin/parametres/roles", icon: Shield, roles: ["super_admin", "admin_org", "directeur_site"] },
      { label: "Paramètres", href: "/admin/parametres", icon: Settings, roles: ["super_admin", "admin_org", "directeur_site"] },
    ],
  },
];
