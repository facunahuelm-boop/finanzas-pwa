'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Modal } from './Modal';
import type { Deuda } from '@/types/database';
import { Loader2 } from 'lucide-react';

export function DeudaModal({
  abierto,
  onCerrar,
  onGuardado,
  deuda,
}: {
  abierto: boolean;
  onCerrar: () => void;
  onGuardado: () => void;
  deuda?: Deuda | null;
}) {
  const supabase = createClient();
  const [nombre, setNombre] = useState(deuda?.nombre ?? '');
  const [acreedor, setAcreedor] = useState(deuda?.acreedor ?? '');
  const [montoTotal, setMontoTotal] = useState(deuda?.monto_total?.toString() ?? '');
  const [montoPagado, setMontoPagado] = useState(deuda?.monto_pagado?.toString() ?? '0');
  const [tasaInteres, setTasaInteres] = useState(deuda?.tasa_interes?.toString() ?? '0');
  const [cuotasTotales, setCuotasTotales] = useState(deuda?.cuotas_totales?.toString() ?? '1');
  const [cuotasPagadas, setCuotasPagadas] = useState(deuda?.cuotas_pagadas?.toString() ?? '0');
  const [fechaVencimiento, setFechaVencimiento] = useState(deuda?.fecha_vencimiento ?? '');
  const [notas, setNotas] = useState(deuda?.notas ?? '');
  const [cargando, setCargando] = useState(false);

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const pagado = parseFloat(montoPagado);
    const total = parseFloat(montoTotal);
    const estado = pagado >= total ? 'pagada' : 'activa';

    const payload = {
      nombre,
      acreedor: acreedor || null,
      monto_total: total,
      monto_pagado: pagado,
      tasa_interes: parseFloat(tasaInteres) || 0,
      cuotas_totales: parseInt(cuotasTotales) || 1,
      cuotas_pagadas: parseInt(cuotasPagadas) || 0,
      fecha_vencimiento: fechaVencimiento || null,
      estado,
      notas: notas || null,
      user_id: user.id,
    };

    if (deuda) {
      await supabase.from('deudas').update(payload).eq('id', deuda.id);
    } else {
      await supabase.from('deudas').insert(payload);
    }

    setCargando(false);
    onGuardado();
    onCerrar();
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={deuda ? 'Editar deuda' : 'Nueva deuda'}>
      <form onSubmit={manejarSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">Nombre</label>
          <input required value={nombre} onChange={(e) => setNombre(e.target.value)} className="input" placeholder="Ej: Préstamo auto" autoFocus />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">Acreedor</label>
          <input value={acreedor} onChange={(e) => setAcreedor(e.target.value)} className="input" placeholder="Ej: Banco República" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">Monto total</label>
            <input type="number" step="0.01" min="0" required value={montoTotal} onChange={(e) => setMontoTotal(e.target.value)} className="input figure" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">Monto pagado</label>
            <input type="number" step="0.01" min="0" value={montoPagado} onChange={(e) => setMontoPagado(e.target.value)} className="input figure" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">Interés %</label>
            <input type="number" step="0.01" min="0" value={tasaInteres} onChange={(e) => setTasaInteres(e.target.value)} className="input figure" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">Cuotas totales</label>
            <input type="number" min="1" value={cuotasTotales} onChange={(e) => setCuotasTotales(e.target.value)} className="input figure" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">Cuotas pagas</label>
            <input type="number" min="0" value={cuotasPagadas} onChange={(e) => setCuotasPagadas(e.target.value)} className="input figure" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">Vencimiento</label>
          <input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} className="input" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">Notas</label>
          <input value={notas} onChange={(e) => setNotas(e.target.value)} className="input" placeholder="Opcional" />
        </div>
        <button type="submit" disabled={cargando} className="btn-primary w-full">
          {cargando && <Loader2 size={16} className="animate-spin" />}
          Guardar
        </button>
      </form>
    </Modal>
  );
}
