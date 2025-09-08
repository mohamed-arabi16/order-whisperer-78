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

