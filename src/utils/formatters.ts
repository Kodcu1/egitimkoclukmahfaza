import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

export function formatDateTurkish(dateStr?: string | null): string {
  if (!dateStr || dateStr === '-') return '-';
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (!isNaN(d.getTime())) {
      return format(d, 'd MMMM yyyy', { locale: tr });
    }
    const parsed = parseISO(dateStr);
    if (!isNaN(parsed.getTime())) {
      return format(parsed, 'd MMMM yyyy', { locale: tr });
    }
    return String(dateStr);
  } catch {
    return String(dateStr);
  }
}

export function formatShortDate(dateStr?: string | null): string {
  if (!dateStr || dateStr === '-') return '-';
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (!isNaN(d.getTime())) {
      return format(d, 'dd.MM.yyyy', { locale: tr });
    }
    const parsed = parseISO(dateStr);
    if (!isNaN(parsed.getTime())) {
      return format(parsed, 'dd.MM.yyyy', { locale: tr });
    }
    return String(dateStr);
  } catch {
    return String(dateStr);
  }
}

export function formatDurationHours(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 dk';
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (hours === 0) return `${remainingMins} dk`;
  if (remainingMins === 0) return `${hours} sa`;
  return `${hours} sa ${remainingMins} dk`;
}

export function formatNumber(num?: number | null): string {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('tr-TR').format(num);
}
