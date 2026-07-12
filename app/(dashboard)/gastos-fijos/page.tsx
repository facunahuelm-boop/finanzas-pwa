'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader, EmptyState, CategoriaBadge } from '@/components/Shared';
import { GastoFijoModal } from '@/components/GastoFijoModal';
import { formatCurrency } from '@/lib/utils';
import type { GastoFijo } from '@/types/database';
import { Plus, Pencil, Trash2, Repeat } from 'lucide-react';

export default function GastosFijosPage() {
  const supabase = createClient();
  const [items, setItems] = useState<GastoFijo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<GastoFijo | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await supabase
      .from('gastos_fijos')
      .select('*, categorias(*)')
      .order('dia_pago');
    setItems((data as any) ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function alternarActivo(item: GastoFijo) {
    await supabase.from('gastos_fijos').update({ activo: !item.activo }).eq('id', item.id);
    cargar();
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este gasto fijo?')) return;
    await supabase.from('gastos_fijos').delete().eq('id', id);
    cargar();
  }

  const totalMensual = items
    .filter((i) => i.activo && i.frecuencia === 'mensual')
    .reduce((a, i) => a + Number(i.monto), 0);

  return (
    <div>
      <PageHeader
        titulo="Gastos fijos"
        subtitulo={`Compromiso mensual activo: ${formatCurrency(totalMensual)}`}
        accion={
          <button onClick={() => { setEditando(null); setModalAbierto(true); }} className="btn-primary">
            <Plus size={16} />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        }
      />

      {cargando ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-black/[0.03] dark:bg-white/[0.03]" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState mensaje="Todavía no cargaste gastos fijos." />
      ) : (
        <div className="card divide-y divide-border-light dark:divide-border-dark overflow-hidden">
          {items.map((item) => (
            <div key={item.id} className={`flex items-center gap-3 px-4 py-3.5 ${!item.activo && 'opacity-50'}`}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Repeat size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.nombre}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {item.categorias && <CategoriaBadge nombre={item.categorias.nombre} color={item.categorias.color} />}
                  <span className="text-xs text-muted-light dark:text-muted-dark">
                    Día {item.dia_pago} · {item.frecuencia === 'mensual' ? 'Mensual' : 'Anual'}
                  </span>
                </div>
              </div>
              <p className="figure shrink-0 text-sm font-semibold">{formatCurrency(Number(item.monto))}</p>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => alternarActivo(item)}
                  className={`h-6 w-10 shrink-0 rounded-full transition ${item.activo ? 'bg-primary' : 'bg-black/10 dark:bg-white/10'}`}
                  title={item.activo ? 'Desactivar' : 'Activar'}
                >
                  <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${item.activo ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <button onClick={() => { setEditando(item); setModalAbierto(true); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-light dark:text-muted-dark hover:text-primary hover:bg-primary/10">
                  <Pencil size={14} />
                </button>
                <button onClick={() => eliminar(item.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-light dark:text-muted-dark hover:text-danger hover:bg-danger/10">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <GastoFijoModal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} onGuardado={cargar} gastoFijo={editando} />
    </div>
  );
}
