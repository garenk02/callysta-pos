import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a value as Indonesian Rupiah currency
 * @param value The number to format, or undefined/null
 * @param defaultValue Optional default value to return if value is undefined/null (default: 'Rp. 0')
 * @returns Formatted currency string with 'Rp. ' prefix
 */
export function formatCurrency(value?: number | null, defaultValue: string = 'Rp. 0'): string {
  // Return default value if undefined or null
  if (value === undefined || value === null) {
    return defaultValue;
  }

  // Format with IDR but replace the symbol with Rp.
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value).replace('Rp', 'Rp. ')
}

/**
 * Format a date in a readable format
 * @param date Date object or date string
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';

  try {
    // Convert to Date object if it's a string
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    // Format as YYYY-MM-DD H:i:s
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}
