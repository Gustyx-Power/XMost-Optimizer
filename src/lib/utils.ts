import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS classes with proper conflict resolution.
 * Uses clsx for conditional class joining and tailwind-merge for deduplication.
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
