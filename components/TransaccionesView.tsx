'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader, EmptyState, CategoriaBadge } from './Shared';
import { TransaccionModal } from './TransaccionModal';
import { useCategorias } from '@/lib/useCategorias';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportarExcel } from '@/lib/export';
import type { Transaccion, TipoMovimiento } from '@/types/database';
import { Plus, Search, Download, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export function TransaccionesView({ tipo }: { tipo: TipoMovimiento }) {
  const supabase = createClient();
  const { categorias } = useCategorias(tipo);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Transaccion | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    let query = supabase
      .from('transacciones')
      .select('*, categorias(*)')
      .eq('tipo', tipo)
      .order('fecha', { ascending: false });
    if (desde) query = query.gte('fecha', desde);
    if (hasta) query = query.lte('fecha', hasta);
    if (filtroCategoria) query = query.eq('categoria_id', filtroCategoria);
    const { data } = await query;
    setTransacciones((data as any) ?? []);
    setCargando(false);
  }, [tipo, desde, hasta, filtroCategoria]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const filtradas = transacciones.filter((t) =>
    (t.descripcion ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (t.categorias?.nombre ?? '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const total = filtradas.reduce((acc, t) => acc + Number(t.monto), 0);

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este movimiento?')) return;
    await supabase.from('transacciones').delete().eq('id', id);
    cargar();
  }

  function exportar() {
    const filas = filtradas.map((t) => ({
      Fecha: t.fecha,
      Categoría: t.categorias?.nombre ?? 'Sin categoría',
      Descripción: t.descripcion ?? '',
      'Método de pago': t.metodo_pago ?? '',
      Monto: Number(t.monto),
    }));
    exportarExcel(filas, tipo === 'gasto' ? 'Gastos' : 'Ingresos', `${tipo}s_${new Date().toISOString().slice(0, 10)}`);
  }

  const Icono = tipo === 'gasto' ? ArrowDownCircle : ArrowUpCircle;
  const titulo = tipo === 'gasto' ? 'Gastos' : 'Ingresos';

  return (
    <div>
      <PageHeader
        titulo={titulo}
        subtitulo={`Total filtrado: ${formatCurrency(total)}`}
        accion={
          <button onClick={() => { setEditando(null); setModalAbierto(true); }} className="btn-primary">
            <Plus size={16} />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        }
      />

      {/* Filtros */}
      <div className="card mb-5 flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-light dark:text-muted-dark" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por descripción o categoría..."
            className="input pl-9"
          />
        </div>
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="input md:w-48">
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="input md:w-40" />
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="input md:w-40" />
        <button onClick={exportar} className="btn-secondary shrink-0">
          <Download size={16} />
          <span className="hidden sm:inline">Excel</span>
        </button>
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-black/[0.03] dark:bg-white/[0.03]" />
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <EmptyState mensaje={`No hay ${titulo.toLowerCase()} que coincidan con la búsqueda.`} />
      ) : (
        <div className="card divide-y divide-border-light dark:divide-border-dark overflow-hidden">
          {filtradas.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3.5">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tipo === 'gasto' ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'}`}>
                <Icono size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.descripcion || 'Sin descripción'}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {t.categorias && <CategoriaBadge nombre={t.categorias.nombre} color={t.categorias.color} />}
                  <span className="text-xs text-muted-light dark:text-muted-dark">{formatDate(t.fecha)}</span>
                </div>
              </div>
              <p className={`figure shrink-0 text-sm font-semibold ${tipo === 'gasto' ? 'text-danger' : 'text-primary'}`}>
                {tipo === 'gasto' ? '-' : '+'}{formatCurrency(Number(t.monto))}
              </p>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => { setEditando(t); setModalAbierto(true); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-light dark:text-muted-dark hover:text-primary hover:bg-primary/10"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => eliminar(t.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-light dark:text-muted-dark hover:text-danger hover:bg-danger/10"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TransaccionModal
        tipo={tipo}
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={cargar}
        transaccion={editando}
      />
    </div>
  );
}
