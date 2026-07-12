export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('es-UY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function mesActualISO(): { desde: string; hasta: string } {
  const now = new Date();
  const desde = new Date(now.getFullYear(), now.getMonth(), 1);
  const hasta = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    desde: desde.toISOString().slice(0, 10),
    hasta: hasta.toISOString().slice(0, 10),
  };
}
