'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Modal } from './Modal';
import { CategoriaSelect } from './CategoriaSelect';
import type { Transaccion, TipoMovimiento } from '@/types/database';
import { Loader2 } from 'lucide-react';

export function TransaccionModal({
  tipo,
  abierto,
  onCerrar,
  onGuardado,
  transaccion,
}: {
  tipo: TipoMovimiento;
  abierto: boolean;
  onCerrar: () => void;
  onGuardado: () => void;
  transaccion?: Transaccion | null;
}) {
  const supabase = createClient();
  const [monto, setMonto] = useState(transaccion?.monto?.toString() ?? '');
  const [categoriaId, setCategoriaId] = useState(transaccion?.categoria_id ?? '');
  const [descripcion, setDescripcion] = useState(transaccion?.descripcion ?? '');
  const [fecha, setFecha] = useState(transaccion?.fecha ?? new Date().toISOString().slice(0, 10));
  const [metodoPago, setMetodoPago] = useState(transaccion?.metodo_pago ?? '');
  const [cargando, setCargando] = useState(false);

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      tipo,
      monto: parseFloat(monto),
      categoria_id: categoriaId || null,
      descripcion: descripcion || null,
      fecha,
      metodo_pago: metodoPago || null,
      user_id: user.id,
    };

    if (transaccion) {
      await supabase.from('transacciones').update(payload).eq('id', transaccion.id);
    } else {
      await supabase.from('transacciones').insert(payload);
    }

    setCargando(false);
    onGuardado();
    onCerrar();
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={
        transaccion
          ? `Editar ${tipo === 'gasto' ? 'gasto' : 'ingreso'}`
          : tipo === 'gasto'
          ? 'Nuevo gasto'
          : 'Nuevo ingreso'
      }
    >
      <form onSubmit={manejarSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">
            Monto
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="input figure"
            placeholder="0"
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">
            Categoría
          </label>
          <CategoriaSelect tipo={tipo} value={categoriaId} onChange={setCategoriaId} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">
              Fecha
            </label>
            <input
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">
              Método de pago
            </label>
            <input
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="input"
              placeholder="Ej: Débito"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">
            Descripción
          </label>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="input"
            placeholder="Opcional"
          />
        </div>

        <button type="submit" disabled={cargando} className="btn-primary w-full">
          {cargando && <Loader2 size={16} className="animate-spin" />}
          Guardar
        </button>
      </form>
    </Modal>
  );
}
