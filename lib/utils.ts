import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | null | undefined, currency: string = 'MMK'): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '0.00 ' + currency;
  }
  const num = Number(amount);
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${currency}`;
}

export function formatQuantity(qty: number | string | null | undefined, uomSymbol?: string): string {
  if (qty === null || qty === undefined || isNaN(Number(qty))) {
    return `0 ${uomSymbol || ''}`.trim();
  }
  const num = Number(qty);
  const formatted = num.toLocaleString('en-US', {
    maximumFractionDigits: 4,
  });
  return `${formatted} ${uomSymbol || ''}`.trim();
}

export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
}

export function formatDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateStr);
  }
}
