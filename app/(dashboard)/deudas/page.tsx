'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader, EmptyState } from '@/components/Shared';
import { DeudaModal } from '@/components/DeudaModal';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Deuda } from '@/types/database';
import { Plus, Pencil, Trash2, CreditCard } from 'lucide-react';

export default function DeudasPage() {
  const supabase = createClient();
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Deuda | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await supabase.from('deudas').select('*').order('created_at', { ascending: false });
    setDeudas(data ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta deuda?')) return;
    await supabase.from('deudas').delete().eq('id', id);
    cargar();
  }

  const totalDeuda = deudas.filter((d) => d.estado !== 'pagada').reduce((a, d) => a + (Number(d.monto_total) - Number(d.monto_pagado)), 0);

  return (
    <div>
      <PageHeader
        titulo="Deudas"
        subtitulo={`Saldo pendiente total: ${formatCurrency(totalDeuda)}`}
        accion={
          <button onClick={() => { setEditando(null); setModalAbierto(true); }} className="btn-primary">
            <Plus size={16} />
            <span className="hidden sm:inline">Nueva</span>
          </button>
        }
      />

      {cargando ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-black/[0.03] dark:bg-white/[0.03]" />)}
        </div>
      ) : deudas.length === 0 ? (
        <EmptyState mensaje="Todavía no cargaste ninguna deuda." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {deudas.map((d) => {
            const progreso = d.monto_total > 0 ? Math.min(100, (Number(d.monto_pagado) / Number(d.monto_total)) * 100) : 0;
            const pendiente = Number(d.monto_total) - Number(d.monto_pagado);
            return (
              <div key={d.id} className="card p-5">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-danger/10 text-danger">
                      <CreditCard size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{d.nombre}</p>
                      {d.acreedor && <p className="text-xs text-muted-light dark:text-muted-dark">{d.acreedor}</p>}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    d.estado === 'pagada' ? 'bg-success/10 text-success' : d.estado === 'vencida' ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent'
                  }`}>
                    {d.estado === 'pagada' ? 'Pagada' : d.estado === 'vencida' ? 'Vencida' : 'Activa'}
                  </span>
                </div>

                <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-black/[0.05] dark:bg-white/[0.06]">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progreso}%` }} />
                </div>
                <div className="mb-4 flex justify-between text-xs text-muted-light dark:text-muted-dark">
                  <span>{formatCurrency(Number(d.monto_pagado))} pagado</span>
                  <span>{progreso.toFixed(0)}%</span>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-light dark:text-muted-dark">Pendiente</p>
                    <p className="figure font-semibold">{formatCurrency(pendiente)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-light dark:text-muted-dark">Cuotas</p>
                    <p className="figure font-semibold">{d.cuotas_pagadas}/{d.cuotas_totales}</p>
                  </div>
                  {d.tasa_interes > 0 && (
                    <div>
                      <p className="text-xs text-muted-light dark:text-muted-dark">Interés</p>
                      <p className="figure font-semibold">{d.tasa_interes}%</p>
                    </div>
                  )}
                  {d.fecha_vencimiento && (
                    <div>
                      <p className="text-xs text-muted-light dark:text-muted-dark">Vence</p>
                      <p className="font-semibold">{formatDate(d.fecha_vencimiento)}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => { setEditando(d); setModalAbierto(true); }} className="btn-secondary flex-1">
                    <Pencil size={14} /> Editar
                  </button>
                  <button onClick={() => eliminar(d.id)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-light dark:border-border-dark text-muted-light dark:text-muted-dark hover:text-danger hover:border-danger/40">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DeudaModal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} onGuardado={cargar} deuda={editando} />
    </div>
  );
}
