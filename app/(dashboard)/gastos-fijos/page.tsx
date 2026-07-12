'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader, EmptyState, CategoriaBadge } from '@/components/Shared';
import { GastoFijoModal } from '@/components/GastoFijoModal';
import { formatCurrency } from '@/lib/utils';
import type { GastoFijo } from '@/types/database';
import { Plus, Pencil, Trash2, Repeat, CheckCircle, Circle } from 'lucide-react';

export default function GastosFijosPage() {
  const supabase = createClient();
  const [items, setItems] = useState<GastoFijo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<GastoFijo | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('gastos_fijos')
      .select('*, categorias(*)')
      .order('dia_pago', { ascending: true });

    if (error) {
      console.error('Error cargando gastos fijos:', error);
    }

    setItems((data as any) ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function alternarPagado(item: GastoFijo) {
    const { error } = await supabase
      .from('gastos_fijos')
      .update({ activo: !item.activo })
      .eq('id', item.id);

    if (!error) {
      // Actualizar localmente sin recargar para respuesta inmediata
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, activo: !i.activo } : i))
      );
    }
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este gasto fijo?')) return;
    await supabase.from('gastos_fijos').delete().eq('id', id);
    cargar();
  }

  function abrirNuevo() {
    setEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(item: GastoFijo) {
    setEditando(item);
    setModalAbierto(true);
  }

  const totalMensual = items
    .filter((i) => i.frecuencia === 'mensual')
    .reduce((a, i) => a + Number(i.monto), 0);

  const pagados = items.filter((i) => i.activo).length;

  return (
    <div>
      <PageHeader
        titulo="Gastos fijos"
        subtitulo={`Total mensual: ${formatCurrency(totalMensual)} · ${pagados} de ${items.length} pagados este mes`}
        accion={
          <button onClick={abrirNuevo} className="btn-primary">
            <Plus size={16} />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        }
      />

      {cargando ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-black/[0.03] dark:bg-white/[0.03]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center gap-4 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Repeat size={24} />
          </div>
          <div>
            <p className="font-medium">No tenés gastos fijos cargados</p>
            <p className="mt-1 text-sm text-muted-light dark:text-muted-dark">
              Agregá tus gastos recurrentes como alquiler, internet, servicios, etc.
            </p>
          </div>
          <button onClick={abrirNuevo} className="btn-primary">
            <Plus size={16} /> Agregar gasto fijo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Resumen rápido */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mb-2">
            <div className="card p-4">
              <p className="text-xs text-muted-light dark:text-muted-dark mb-1">Total mensual</p>
              <p className="figure text-lg font-semibold">{formatCurrency(totalMensual)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-muted-light dark:text-muted-dark mb-1">Pagados este mes</p>
              <p className="figure text-lg font-semibold text-primary">{pagados} / {items.length}</p>
            </div>
            <div className="card p-4 hidden sm:block">
              <p className="text-xs text-muted-light dark:text-muted-dark mb-1">Pendientes</p>
              <p className="figure text-lg font-semibold text-danger">{items.length - pagados}</p>
            </div>
          </div>

          {/* Lista de gastos fijos */}
          <div className="card divide-y divide-border-light dark:divide-border-dark overflow-hidden">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 px-4 py-4 transition-opacity ${
                  item.activo ? 'opacity-100' : 'opacity-60'
                }`}
              >
                {/* Botón pagado/pendiente */}
                <button
                  onClick={() => alternarPagado(item)}
                  className="shrink-0 transition hover:scale-110"
                  title={item.activo ? 'Marcar como pendiente' : 'Marcar como pagado'}
                >
                  {item.activo ? (
                    <CheckCircle size={24} className="text-primary" />
                  ) : (
                    <Circle size={24} className="text-muted-light dark:text-muted-dark" />
                  )}
                </button>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${item.activo ? 'line-through text-muted-light dark:text-muted-dark' : ''}`}>
                    {item.nombre}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {item.categorias && (
                      <CategoriaBadge nombre={item.categorias.nombre} color={item.categorias.color} />
                    )}
                    <span className="text-xs text-muted-light dark:text-muted-dark">
                      Día {item.dia_pago} · {item.frecuencia === 'mensual' ? 'Mensual' : 'Anual'}
                    </span>
                    {item.notas && (
                      <span className="text-xs text-muted-light dark:text-muted-dark italic">
                        · {item.notas}
                      </span>
                    )}
                  </div>
                </div>

                {/* Monto */}
                <p className="figure shrink-0 text-sm font-semibold">
                  {formatCurrency(Number(item.monto))}
                </p>

                {/* Acciones */}
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => abrirEditar(item)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-light dark:text-muted-dark hover:text-primary hover:bg-primary/10 transition"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => eliminar(item.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-light dark:text-muted-dark hover:text-danger hover:bg-danger/10 transition"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-light dark:text-muted-dark pt-1">
            Clickeá el círculo para marcar un gasto como pagado este mes
          </p>
        </div>
      )}

      <GastoFijoModal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={cargar}
        gastoFijo={editando}
      />
    </div>
  );
}
