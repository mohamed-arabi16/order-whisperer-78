import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * A utility function to merge CSS classes.
 * It combines class names and resolves conflicts.
 *
 * @param {...ClassValue[]} inputs - A list of class values to merge.
 * @returns {string} The merged class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function lightenHexColor(hex: string, percent: number): string {
  if (!hex.startsWith('#')) return hex;

  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  r = Math.min(255, r + (255 - r) * (percent / 100));
  g = Math.min(255, g + (255 - g) * (percent / 100));
  b = Math.min(255, b + (255 - b) * (percent / 100));

  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}
