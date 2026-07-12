'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader, EmptyState } from '@/components/Shared';
import { formatCurrency } from '@/lib/utils';
import * as XLSX from 'xlsx';
import type { Transaccion } from '@/types/database';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Download } from 'lucide-react';

function rangoPorDefecto() {
  const hoy = new Date();
  const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);
  return {
    desde: desde.toISOString().slice(0, 10),
    hasta: hoy.toISOString().slice(0, 10),
  };
}

export default function ReportesPage() {
  const supabase = createClient();
  const defecto = rangoPorDefecto();
  const [desde, setDesde] = useState(defecto.desde);
  const [hasta, setHasta] = useState(defecto.hasta);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await supabase
      .from('transacciones')
      .select('*, categorias(*)')
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: true });
    setTransacciones((data as any) ?? []);
    setCargando(false);
  }, [desde, hasta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const totalIngresos = transacciones.filter((t) => t.tipo === 'ingreso').reduce((a, t) => a + Number(t.monto), 0);
  const totalGastos = transacciones.filter((t) => t.tipo === 'gasto').reduce((a, t) => a + Number(t.monto), 0);

  const evolucion = useMemo(() => {
    const mapa = new Map<string, { fecha: string; Balance: number }>();
    let acumulado = 0;
    [...transacciones]
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .forEach((t) => {
        acumulado += t.tipo === 'ingreso' ? Number(t.monto) : -Number(t.monto);
        mapa.set(t.fecha, { fecha: t.fecha.slice(5), Balance: acumulado });
      });
    return Array.from(mapa.values());
  }, [transacciones]);

  function agruparPorCategoria(tipo: 'gasto' | 'ingreso') {
    const mapa = new Map<string, { nombre: string; valor: number; color: string }>();
    transacciones.filter((t) => t.tipo === tipo).forEach((t) => {
      const nombre = t.categorias?.nombre ?? 'Sin categoría';
      const color = t.categorias?.color ?? '#7A7A7A';
      const actual = mapa.get(nombre) ?? { nombre, valor: 0, color };
      actual.valor += Number(t.monto);
      mapa.set(nombre, actual);
    });
    return Array.from(mapa.values()).sort((a, b) => b.valor - a.valor);
  }

  const gastosPorCategoria = useMemo(() => agruparPorCategoria('gasto'), [transacciones]);
  const ingresosPorCategoria = useMemo(() => agruparPorCategoria('ingreso'), [transacciones]);

  function exportarReporte() {
    const wb = XLSX.utils.book_new();

    const resumen = [
      { Concepto: 'Ingresos totales', Monto: totalIngresos },
      { Concepto: 'Gastos totales', Monto: totalGastos },
      { Concepto: 'Balance', Monto: totalIngresos - totalGastos },
      { Concepto: '', Monto: '' },
      { Concepto: 'Período', Monto: `${desde} a ${hasta}` },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen), 'Resumen');

    const detalle = transacciones.map((t) => ({
      Fecha: t.fecha,
      Tipo: t.tipo === 'gasto' ? 'Gasto' : 'Ingreso',
      Categoría: t.categorias?.nombre ?? 'Sin categoría',
      Descripción: t.descripcion ?? '',
      Monto: Number(t.monto),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detalle), 'Movimientos');

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(gastosPorCategoria.map((c) => ({ Categoría: c.nombre, Total: c.valor }))),
      'Gastos por categoría'
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(ingresosPorCategoria.map((c) => ({ Categoría: c.nombre, Total: c.valor }))),
      'Ingresos por categoría'
    );

    XLSX.writeFile(wb, `reporte_financiero_${desde}_a_${hasta}.xlsx`);
  }

  return (
    <div>
      <PageHeader
        titulo="Reportes"
        subtitulo="Analizá tu actividad financiera por período"
        accion={
          <button onClick={exportarReporte} className="btn-primary">
            <Download size={16} />
            <span className="hidden sm:inline">Exportar todo</span>
          </button>
        }
      />

      <div className="card mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <label className="text-xs font-medium text-muted-light dark:text-muted-dark sm:hidden">Desde</label>
        <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="input sm:w-44" />
        <label className="text-xs font-medium text-muted-light dark:text-muted-dark sm:hidden">Hasta</label>
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="input sm:w-44" />
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          {[
            { label: 'Este mes', meses: 0 },
            { label: '3 meses', meses: 2 },
            { label: '6 meses', meses: 5 },
            { label: '12 meses', meses: 11 },
          ].map((r) => (
            <button
              key={r.label}
              onClick={() => {
                const hoy = new Date();
                const d = new Date(hoy.getFullYear(), hoy.getMonth() - r.meses, 1);
                setDesde(d.toISOString().slice(0, 10));
                setHasta(hoy.toISOString().slice(0, 10));
              }}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <div className="h-64 animate-pulse rounded-2xl bg-black/[0.03] dark:bg-white/[0.03]" />
      ) : transacciones.length === 0 ? (
        <EmptyState mensaje="No hay movimientos en el período seleccionado." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3 mb-5">
            <div className="card p-5">
              <p className="text-xs font-medium text-muted-light dark:text-muted-dark">Ingresos</p>
              <p className="figure mt-2 text-xl font-semibold text-primary">{formatCurrency(totalIngresos)}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-medium text-muted-light dark:text-muted-dark">Gastos</p>
              <p className="figure mt-2 text-xl font-semibold text-danger">{formatCurrency(totalGastos)}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-medium text-muted-light dark:text-muted-dark">Balance</p>
              <p className="figure mt-2 text-xl font-semibold">{formatCurrency(totalIngresos - totalGastos)}</p>
            </div>
          </div>

          <div className="card p-5 mb-5">
            <h3 className="mb-4 text-sm font-semibold">Evolución del balance acumulado</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={evolucion}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border-light dark:stroke-border-dark" />
                <XAxis dataKey="fecha" tickLine={false} axisLine={false} fontSize={12} minTickGap={30} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${v / 1000}k`} width={40} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: 12, border: '1px solid #E1E5E2', fontSize: 13 }} />
                <Line type="monotone" dataKey="Balance" stroke="#0F6B5C" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <h3 className="mb-4 text-sm font-semibold">Gastos por categoría</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={gastosPorCategoria} dataKey="valor" nameKey="nombre" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {gastosPorCategoria.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: 12, border: '1px solid #E1E5E2', fontSize: 13 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-5">
              <h3 className="mb-4 text-sm font-semibold">Ingresos por categoría</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={ingresosPorCategoria} dataKey="valor" nameKey="nombre" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {ingresosPorCategoria.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: 12, border: '1px solid #E1E5E2', fontSize: 13 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
