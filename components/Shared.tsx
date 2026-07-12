import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PageHeader({
  titulo,
  subtitulo,
  accion,
}: {
  titulo: string;
  subtitulo?: string;
  accion?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-light dark:text-ink-dark">
          {titulo}
        </h1>
        {subtitulo && (
          <p className="mt-1 text-sm text-muted-light dark:text-muted-dark">{subtitulo}</p>
        )}
      </div>
      {accion}
    </div>
  );
}

export function StatCard({
  label,
  valor,
  icon: Icon,
  tono = 'default',
}: {
  label: string;
  valor: string;
  icon: LucideIcon;
  tono?: 'default' | 'primary' | 'danger' | 'accent';
}) {
  const tonos = {
    default: 'text-ink-light dark:text-ink-dark bg-black/[0.03] dark:bg-white/[0.04]',
    primary: 'text-primary bg-primary/10',
    danger: 'text-danger bg-danger/10',
    accent: 'text-accent bg-accent/10',
  };
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-light dark:text-muted-dark">{label}</span>
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', tonos[tono])}>
          <Icon size={16} />
        </div>
      </div>
      <p className="figure text-2xl font-semibold">{valor}</p>
    </div>
  );
}

export function EmptyState({ mensaje }: { mensaje: string }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <p className="text-sm text-muted-light dark:text-muted-dark">{mensaje}</p>
    </div>
  );
}

export function CategoriaBadge({ nombre, color }: { nombre: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: `${color}1A`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {nombre}
    </span>
  );
}
