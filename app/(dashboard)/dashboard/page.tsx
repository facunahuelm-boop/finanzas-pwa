'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate, MESES, mesActualISO } from '@/lib/utils';
import type { Transaccion, Deuda, GastoFijo } from '@/types/database';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import {
  ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown,
  Wallet, CreditCard, Repeat, CheckCircle, Circle, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { CategoriaBadge } from '@/components/Shared';

export default function DashboardPage() {
  const supabase = createClient();
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nombreUsuario, setNombreUsuario] = useState('');

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      const { data: { user } } = await supabase.auth.getUser();
      setNombreUsuario(user?.email?.split('@')[0] ?? '');

      const inicioMesActual = new Date();
      inicioMesActual.setDate(1);

      const [{ data: tx }, { data: deu }, { data: gf }] = await Promise.all([
        supabase
          .from('transacciones')
          .select('*, categorias(*)')
          .gte('fecha', inicioMesActual.toISOString().slice(0, 10))
          .order('fecha', { ascending: false }),
        supabase
          .from('deudas')
          .select('*')
          .eq('estado', 'activa')
          .order('fecha_vencimiento', { ascending: true }),
        supabase
          .from('gastos_fijos')
          .select('*, categorias(*)')
          .order('dia_pago', { ascending: true }),
      ]);

      setTransacciones((tx as any) ?? []);
      setDeudas((deu as any) ?? []);
      setGastosFijos((gf as any) ?? []);
      setCargando(false);
    }
    cargar();
  }, []);

  async function alternarGastoFijo(id: string, activo: boolean) {
    await supabase.from('gastos_fijos').update({ activo: !activo }).eq('id', id);
    setGastosFijos((prev) =>
      prev.map((g) => (g.id === id ? { ...g, activo: !g.activo } : g))
    );
  }

  const { desde, hasta } = mesActualISO();
  const delMes = transacciones.filter((t) => t.fecha >= desde && t.fecha <= hasta);
  const ingresosMes = delMes.filter((t) => t.tipo === 'ingreso').reduce((a, t) => a + Number(t.monto), 0);
  const gastosMes = delMes.filter((t) => t.tipo === 'gasto').reduce((a, t) => a + Number(t.monto), 0);

  // Todos los gastos fijos mensuales (pagados y pendientes) suman en Gastos
  const gastosFijosTotal = gastosFijos
    .filter((g) => g.frecuencia === 'mensual')
    .reduce((a, g) => a + Number(g.monto), 0);

  // Gastos fijos pendientes (para mostrar en el subtítulo)
  const gastosFijosPendientesMonto = gastosFijos
    .filter((g) => g.frecuencia === 'mensual' && !g.activo)
    .reduce((a, g) => a + Number(g.monto), 0);

  // Gastos totales = gastos manuales + TODOS los gastos fijos mensuales
  const gastosTotalesMes = gastosMes + gastosFijosTotal;

  // Balance = ingresos - gastos totales
  const balanceMes = ingresosMes - gastosTotalesMes;

  const datosMensuales = useMemo(() => {
    const mapa = new Map<string, { mes: string; anio: number; mesNum: number; Ingresos: number; Gastos: number; GastosFijos: number; Total: number }>();
    const hoy = new Date();
    const mesInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1); // julio 2026
    // Mostrar desde el mes actual hasta 5 meses hacia adelante (6 meses total)
    for (let i = 0; i <= 5; i++) {
      const d = new Date(mesInicio.getFullYear(), mesInicio.getMonth() + i, 1);
      const clave = `${d.getFullYear()}-${d.getMonth()}`;
      mapa.set(clave, {
        mes: MESES[d.getMonth()].slice(0, 3),
        anio: d.getFullYear(),
        mesNum: d.getMonth(),
        Ingresos: 0,
        Gastos: 0,
        GastosFijos: 0,
        Total: 0,
      });
    }
    // Sumar transacciones manuales (solo las que caen en el rango)
    transacciones.forEach((t) => {
      const d = new Date(t.fecha + 'T00:00:00');
      const clave = `${d.getFullYear()}-${d.getMonth()}`;
      const entrada = mapa.get(clave);
      if (entrada) {
        if (t.tipo === 'ingreso') entrada.Ingresos += Number(t.monto);
        else entrada.Gastos += Number(t.monto);
      }
    });
    // Sumar gastos fijos mensuales a cada mes del gráfico
    const totalFijosMensuales = gastosFijos
      .filter((g) => g.frecuencia === 'mensual')
      .reduce((a, g) => a + Number(g.monto), 0);
    mapa.forEach((entrada) => {
      entrada.GastosFijos = totalFijosMensuales;
      entrada.Total = entrada.Gastos + totalFijosMensuales;
    });
    return Array.from(mapa.values());
  }, [transacciones, gastosFijos]);

  const recientes = transacciones.slice(0, 5);
  const totalDeudas = deudas.reduce((a, d) => a + (Number(d.monto_total) - Number(d.monto_pagado)), 0);
  const gastosFijosPagados = gastosFijos.filter((g) => g.activo).length;
  const totalGastosFijos = gastosFijos.filter((g) => g.frecuencia === 'mensual').reduce((a, g) => a + Number(g.monto), 0);

  if (cargando) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-black/[0.04] dark:bg-white/[0.04]" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-black/[0.03] dark:bg-white/[0.03]" />)}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-black/[0.03] dark:bg-white/[0.03]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold">
          Hola{nombreUsuario ? `, ${nombreUsuario}` : ''} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-light dark:text-muted-dark">
          {MESES[new Date().getMonth()]} {new Date().getFullYear()} — resumen completo
        </p>
      </div>

      {/* Stats principales */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <div className="card p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted-light dark:text-muted-dark">Ingresos</span>
            <TrendingUp size={15} className="text-primary" />
          </div>
          <p className="figure text-xl font-semibold text-primary">{formatCurrency(ingresosMes)}</p>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-1">este mes</p>
        </div>

        <div className="card p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted-light dark:text-muted-dark">Gastos</span>
            <TrendingDown size={15} className="text-danger" />
          </div>
          <p className="figure text-xl font-semibold text-danger">{formatCurrency(gastosTotalesMes)}</p>
          {gastosFijosTotal > 0 && (
            <p className="text-xs text-muted-light dark:text-muted-dark mt-1">
              incl. {formatCurrency(gastosFijosTotal)} fijos
            </p>
          )}
          {gastosFijosTotal === 0 && (
            <p className="text-xs text-muted-light dark:text-muted-dark mt-1">este mes</p>
          )}
        </div>

        <div className="card p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted-light dark:text-muted-dark">Balance</span>
            <Wallet size={15} className={balanceMes >= 0 ? 'text-primary' : 'text-danger'} />
          </div>
          <p className={`figure text-xl font-semibold ${balanceMes >= 0 ? 'text-primary' : 'text-danger'}`}>
            {balanceMes >= 0 ? '+' : ''}{formatCurrency(balanceMes)}
          </p>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-1">este mes</p>
        </div>

        <div className="card p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted-light dark:text-muted-dark">Deudas</span>
            <CreditCard size={15} className="text-accent" />
          </div>
          <p className="figure text-xl font-semibold text-accent">{formatCurrency(totalDeudas)}</p>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-1">{deudas.length} activas</p>
        </div>
      </div>

      {/* Gráfico + Gastos fijos */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Gráfico */}
        <div className="card p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Ingresos vs. gastos — jul a dic {new Date().getFullYear()}</h3>
          </div>
          {/* Leyenda */}
          <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted-light dark:text-muted-dark">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{background:'#0F6B5C'}}/>
              Ingresos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{background:'#B54A3F'}}/>
              Gastos manuales
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{background:'#E8906A'}}/>
              Gastos fijos
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={datosMensuales} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border-light dark:stroke-border-dark" />
              <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={36} />
              <Tooltip
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                contentStyle={{ borderRadius: 12, border: '1px solid #E1E5E2', fontSize: 13 }}
              />
              <Bar dataKey="Ingresos" fill="#0F6B5C" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Gastos" stackId="gastos" fill="#B54A3F" radius={[0, 0, 0, 0]} />
              <Bar dataKey="GastosFijos" stackId="gastos" fill="#E8906A" radius={[6, 6, 0, 0]} name="Gastos fijos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gastos fijos */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-light dark:border-border-dark">
            <div>
              <h3 className="text-sm font-semibold">Gastos fijos</h3>
              <p className="text-xs text-muted-light dark:text-muted-dark">
                {gastosFijosPagados}/{gastosFijos.length} pagados · {formatCurrency(totalGastosFijos)}/mes
              </p>
            </div>
            <Link href="/gastos-fijos" className="text-xs font-medium text-primary hover:underline">Ver todo</Link>
          </div>
          {gastosFijos.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-light dark:text-muted-dark">
              No tenés gastos fijos cargados.
              <Link href="/gastos-fijos" className="block mt-2 text-primary hover:underline">Agregar</Link>
            </div>
          ) : (
            <div className="divide-y divide-border-light dark:divide-border-dark max-h-64 overflow-y-auto">
              {gastosFijos.map((g) => (
                <div key={g.id} className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => alternarGastoFijo(g.id, g.activo)}
                    className="shrink-0 transition hover:scale-110"
                    title={g.activo ? 'Marcar pendiente' : 'Marcar pagado'}
                  >
                    {g.activo
                      ? <CheckCircle size={20} className="text-primary" />
                      : <Circle size={20} className="text-muted-light dark:text-muted-dark" />
                    }
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${g.activo ? 'line-through text-muted-light dark:text-muted-dark' : ''}`}>
                      {g.nombre}
                    </p>
                    <p className="text-xs text-muted-light dark:text-muted-dark">Día {g.dia_pago}</p>
                  </div>
                  <p className="figure text-sm font-semibold shrink-0">{formatCurrency(Number(g.monto))}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deudas + Movimientos recientes */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Deudas pendientes */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-light dark:border-border-dark">
            <div>
              <h3 className="text-sm font-semibold">Deudas pendientes</h3>
              <p className="text-xs text-muted-light dark:text-muted-dark">
                {formatCurrency(totalDeudas)} total a pagar
              </p>
            </div>
            <Link href="/deudas" className="text-xs font-medium text-primary hover:underline">Ver todo</Link>
          </div>
          {deudas.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-light dark:text-muted-dark">
              No tenés deudas activas 🎉
            </div>
          ) : (
            <div className="divide-y divide-border-light dark:divide-border-dark">
              {deudas.slice(0, 4).map((d) => {
                const pendiente = Number(d.monto_total) - Number(d.monto_pagado);
                const progreso = Number(d.monto_total) > 0
                  ? Math.min(100, (Number(d.monto_pagado) / Number(d.monto_total)) * 100)
                  : 0;
                const vencida = d.fecha_vencimiento && new Date(d.fecha_vencimiento) < new Date();
                return (
                  <div key={d.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {vencida
                          ? <AlertCircle size={15} className="text-danger shrink-0" />
                          : <CreditCard size={15} className="text-accent shrink-0" />
                        }
                        <p className="text-sm font-medium truncate">{d.nombre}</p>
                      </div>
                      <p className="figure text-sm font-semibold text-danger shrink-0 ml-2">
                        {formatCurrency(pendiente)}
                      </p>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05] dark:bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${progreso}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-muted-light dark:text-muted-dark">
                        {progreso.toFixed(0)}% pagado
                      </p>
                      {d.fecha_vencimiento && (
                        <p className={`text-xs ${vencida ? 'text-danger' : 'text-muted-light dark:text-muted-dark'}`}>
                          {vencida ? '⚠ Vencida' : `Vence: ${formatDate(d.fecha_vencimiento)}`}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {deudas.length > 4 && (
                <div className="px-5 py-3 text-center">
                  <Link href="/deudas" className="text-xs text-primary hover:underline">
                    Ver {deudas.length - 4} más
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Movimientos recientes */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-light dark:border-border-dark">
            <h3 className="text-sm font-semibold">Movimientos recientes</h3>
            <Link href="/gastos" className="text-xs font-medium text-primary hover:underline">Ver todo</Link>
          </div>
          {recientes.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-light dark:text-muted-dark">
              Todavía no registraste movimientos.
              <Link href="/gastos" className="block mt-2 text-primary hover:underline">Agregar gasto</Link>
            </div>
          ) : (
            <div className="divide-y divide-border-light dark:divide-border-dark">
              {recientes.map((t) => {
                const Icono = t.tipo === 'gasto' ? ArrowDownCircle : ArrowUpCircle;
                return (
                  <div key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      t.tipo === 'gasto' ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'
                    }`}>
                      <Icono size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {t.descripcion || t.categorias?.nombre || 'Movimiento'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {t.categorias && (
                          <CategoriaBadge nombre={t.categorias.nombre} color={t.categorias.color} />
                        )}
                        <span className="text-xs text-muted-light dark:text-muted-dark">{formatDate(t.fecha)}</span>
                      </div>
                    </div>
                    <p className={`figure shrink-0 text-sm font-semibold ${
                      t.tipo === 'gasto' ? 'text-danger' : 'text-primary'
                    }`}>
                      {t.tipo === 'gasto' ? '-' : '+'}{formatCurrency(Number(t.monto))}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
