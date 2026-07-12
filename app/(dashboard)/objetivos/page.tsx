'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader, EmptyState } from '@/components/Shared';
import { ObjetivoModal } from '@/components/ObjetivoModal';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Objetivo } from '@/types/database';
import { Plus, Pencil, Trash2, Target, PlusCircle } from 'lucide-react';

export default function ObjetivosPage() {
  const supabase = createClient();
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Objetivo | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await supabase.from('objetivos').select('*').order('created_at', { ascending: false });
    setObjetivos(data ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este objetivo?')) return;
    await supabase.from('objetivos').delete().eq('id', id);
    cargar();
  }

  async function agregarFondos(o: Objetivo) {
    const monto = prompt(`¿Cuánto querés agregar a "${o.nombre}"?`);
    if (!monto || isNaN(Number(monto))) return;
    const nuevoActual = Number(o.monto_actual) + Number(monto);
    const estado = nuevoActual >= Number(o.monto_objetivo) ? 'cumplido' : 'en_progreso';
    await supabase.from('objetivos').update({ monto_actual: nuevoActual, estado }).eq('id', o.id);
    cargar();
  }

  return (
    <div>
      <PageHeader
        titulo="Objetivos"
        subtitulo="Tus metas de ahorro"
        accion={
          <button onClick={() => { setEditando(null); setModalAbierto(true); }} className="btn-primary">
            <Plus size={16} />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        }
      />

      {cargando ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(2)].map((_, i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-black/[0.03] dark:bg-white/[0.03]" />)}
        </div>
      ) : objetivos.length === 0 ? (
        <EmptyState mensaje="Todavía no definiste objetivos de ahorro." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {objetivos.map((o) => {
            const progreso = o.monto_objetivo > 0 ? Math.min(100, (Number(o.monto_actual) / Number(o.monto_objetivo)) * 100) : 0;
            const circunferencia = 2 * Math.PI * 34;
            return (
              <div key={o.id} className="card p-5">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 shrink-0">
                    <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
                      <circle cx="40" cy="40" r="34" fill="none" strokeWidth="7" className="stroke-black/[0.06] dark:stroke-white/[0.08]" />
                      <circle
                        cx="40" cy="40" r="34" fill="none" strokeWidth="7" strokeLinecap="round"
                        stroke={o.color}
                        strokeDasharray={circunferencia}
                        strokeDashoffset={circunferencia - (progreso / 100) * circunferencia}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Target size={18} style={{ color: o.color }} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{o.nombre}</p>
                    <p className="figure mt-1 text-lg font-semibold">{formatCurrency(Number(o.monto_actual))}</p>
                    <p className="text-xs text-muted-light dark:text-muted-dark">de {formatCurrency(Number(o.monto_objetivo))} · {progreso.toFixed(0)}%</p>
                    {o.fecha_limite && <p className="mt-0.5 text-xs text-muted-light dark:text-muted-dark">Límite: {formatDate(o.fecha_limite)}</p>}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button onClick={() => agregarFondos(o)} className="btn-secondary flex-1">
                    <PlusCircle size={14} /> Agregar
                  </button>
                  <button onClick={() => { setEditando(o); setModalAbierto(true); }} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-light dark:border-border-dark text-muted-light dark:text-muted-dark hover:text-primary hover:border-primary/40">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => eliminar(o.id)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-light dark:border-border-dark text-muted-light dark:text-muted-dark hover:text-danger hover:border-danger/40">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ObjetivoModal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} onGuardado={cargar} objetivo={editando} />
    </div>
  );
}
