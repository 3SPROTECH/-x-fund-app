/**
 * Shared formatting utilities used across the application.
 */

/** Format cents to EUR currency string, e.g. 150000 → "1 500,00 €" */
export const formatCents = (cents) =>
  cents == null
    ? '—'
    : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);

/** Same as formatCents but treats null/undefined as 0 instead of '—' */
export const formatBalance = (cents) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100);

/** Format an ISO date string to French locale, e.g. "2024-03-15" → "15/03/2024" */
export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR') : '—';
