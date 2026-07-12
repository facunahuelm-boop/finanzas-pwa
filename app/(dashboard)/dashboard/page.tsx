'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader, StatCard, EmptyState, CategoriaBadge } from '@/components/Shared';
import { formatCurrency, formatDate, MESES, mesActualISO } from '@/lib/utils';
import type { Transaccion } from '@/types/database';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const supabase = createClient();
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nombreUsuario, setNombreUsuario] = useState('');

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setNombreUsuario(user?.email?.split('@')[0] ?? '');

      const seisMesesAtras = new Date();
      seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 5);
      seisMesesAtras.setDate(1);

      const { data } = await supabase
        .from('transacciones')
        .select('*, categorias(*)')
        .gte('fecha', seisMesesAtras.toISOString().slice(0, 10))
        .order('fecha', { ascending: false });

      setTransacciones((data as any) ?? []);
      setCargando(false);
    }
    cargar();
  }, []);

  const { desde, hasta } = mesActualISO();

  const delMes = transacciones.filter((t) => t.fecha >= desde && t.fecha <= hasta);
  const ingresosMes = delMes.filter((t) => t.tipo === 'ingreso').reduce((a, t) => a + Number(t.monto), 0);
  const gastosMes = delMes.filter((t) => t.tipo === 'gasto').reduce((a, t) => a + Number(t.monto), 0);
  const balanceMes = ingresosMes - gastosMes;

  const datosMensuales = useMemo(() => {
    const mapa = new Map<string, { mes: string; Ingresos: number; Gastos: number }>();
    const hoy = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const clave = `${d.getFullYear()}-${d.getMonth()}`;
      mapa.set(clave, { mes: MESES[d.getMonth()].slice(0, 3), Ingresos: 0, Gastos: 0 });
    }
    transacciones.forEach((t) => {
      const d = new Date(t.fecha + 'T00:00:00');
      const clave = `${d.getFullYear()}-${d.getMonth()}`;
      const entrada = mapa.get(clave);
      if (entrada) {
        if (t.tipo === 'ingreso') entrada.Ingresos += Number(t.monto);
        else entrada.Gastos += Number(t.monto);
      }
    });
    return Array.from(mapa.values());
  }, [transacciones]);

  const porCategoria = useMemo(() => {
    const mapa = new Map<string, { nombre: string; valor: number; color: string }>();
    delMes.filter((t) => t.tipo === 'gasto').forEach((t) => {
      const nombre = t.categorias?.nombre ?? 'Sin categoría';
      const color = t.categorias?.color ?? '#7A7A7A';
      const actual = mapa.get(nombre) ?? { nombre, valor: 0, color };
      actual.valor += Number(t.monto);
      mapa.set(nombre, actual);
    });
    return Array.from(mapa.values()).sort((a, b) => b.valor - a.valor);
  }, [delMes]);

  const recientes = transacciones.slice(0, 6);

  if (cargando) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-black/[0.04] dark:bg-white/[0.04]" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-black/[0.03] dark:bg-white/[0.03]" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader titulo={`Hola${nombreUsuario ? `, ${nombreUsuario}` : ''}`} subtitulo="Resumen de tu mes actual" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Ingresos del mes" valor={formatCurrency(ingresosMes)} icon={TrendingUp} tono="primary" />
        <StatCard label="Gastos del mes" valor={formatCurrency(gastosMes)} icon={TrendingDown} tono="danger" />
        <StatCard label="Balance del mes" valor={formatCurrency(balanceMes)} icon={Wallet} tono={balanceMes >= 0 ? 'primary' : 'danger'} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-5">
        <div className="card p-5 lg:col-span-3">
          <h3 className="mb-4 text-sm font-semibold">Ingresos vs. gastos — últimos 6 meses</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={datosMensuales}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border-light dark:stroke-border-dark" />
              <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${v / 1000}k`} width={40} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: 12, border: '1px solid #E1E5E2', fontSize: 13 }}
              />
              <Bar dataKey="Ingresos" fill="#0F6B5C" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Gastos" fill="#B54A3F" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold">Gastos por categoría (este mes)</h3>
          {porCategoria.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-light dark:text-muted-dark">
              Sin gastos este mes
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={porCategoria} dataKey="valor" nameKey="nombre" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {porCategoria.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: 12, border: '1px solid #E1E5E2', fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mt-5 card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="text-sm font-semibold">Movimientos recientes</h3>
          <Link href="/gastos" className="text-xs font-medium text-primary hover:underline">Ver todo</Link>
        </div>
        {recientes.length === 0 ? (
          <div className="px-5 pb-6"><EmptyState mensaje="Todavía no registraste movimientos." /></div>
        ) : (
          <div className="divide-y divide-border-light dark:divide-border-dark">
            {recientes.map((t) => {
              const Icono = t.tipo === 'gasto' ? ArrowDownCircle : ArrowUpCircle;
              return (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${t.tipo === 'gasto' ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'}`}>
                    <Icono size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.descripcion || t.categorias?.nombre || 'Movimiento'}</p>
                    <span className="text-xs text-muted-light dark:text-muted-dark">{formatDate(t.fecha)}</span>
                  </div>
                  <p className={`figure shrink-0 text-sm font-semibold ${t.tipo === 'gasto' ? 'text-danger' : 'text-primary'}`}>
                    {t.tipo === 'gasto' ? '-' : '+'}{formatCurrency(Number(t.monto))}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
