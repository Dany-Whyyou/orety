import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("fr-FR", opts).format(n);
}

export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", opts ?? { dateStyle: "long" }).format(d);
}

export function initials(nom: string, prenom?: string) {
  const n = (nom || "").trim()[0] ?? "";
  const p = (prenom || "").trim()[0] ?? "";
  return (p + n).toUpperCase() || "??";
}
