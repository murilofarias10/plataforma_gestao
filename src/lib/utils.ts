import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Parses a date in dd/MM/yyyy and returns a Date in local time.
// Returns null for falsy/invalid inputs.
export function parseBRDateLocal(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map((p) => parseInt(p, 10));
  if (!yyyy || !mm || !dd) return null;
  const d = new Date(yyyy, mm - 1, dd);
  return isNaN(d.getTime()) ? null : d;
}

// Parses a date in yyyy-MM-dd (ISO-like) and returns a Date in local time.
// Returns null for falsy/invalid inputs.
export function parseISODateLocal(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const [yyyyStr, mmStr, ddStr] = parts;
  const yyyy = parseInt(yyyyStr, 10);
  const mm = parseInt(mmStr, 10);
  const dd = parseInt(ddStr, 10);
  if (!yyyy || !mm || !dd) return null;
  const d = new Date(yyyy, mm - 1, dd);
  return isNaN(d.getTime()) ? null : d;
}