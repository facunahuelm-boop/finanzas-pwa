'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Modal } from './Modal';
import { CategoriaSelect } from './CategoriaSelect';
import type { GastoFijo } from '@/types/database';
import { Loader2 } from 'lucide-react';

export function GastoFijoModal({
  abierto,
  onCerrar,
  onGuardado,
  gastoFijo,
}: {
  abierto: boolean;
  onCerrar: () => void;
  onGuardado: () => void;
  gastoFijo?: GastoFijo | null;
}) {
  const supabase = createClient();
  const [nombre, setNombre] = useState(gastoFijo?.nombre ?? '');
  const [monto, setMonto] = useState(gastoFijo?.monto?.toString() ?? '');
  const [categoriaId, setCategoriaId] = useState(gastoFijo?.categoria_id ?? '');
  const [diaPago, setDiaPago] = useState(gastoFijo?.dia_pago?.toString() ?? '1');
  const [frecuencia, setFrecuencia] = useState(gastoFijo?.frecuencia ?? 'mensual');
  const [notas, setNotas] = useState(gastoFijo?.notas ?? '');
  const [cargando, setCargando] = useState(false);

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      nombre,
      monto: parseFloat(monto),
      categoria_id: categoriaId || null,
      dia_pago: parseInt(diaPago) || 1,
      frecuencia,
      notas: notas || null,
      user_id: user.id,
    };

    if (gastoFijo) {
      await supabase.from('gastos_fijos').update(payload).eq('id', gastoFijo.id);
    } else {
      await supabase.from('gastos_fijos').insert({ ...payload, activo: true });
    }

    setCargando(false);
    onGuardado();
    onCerrar();
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={gastoFijo ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}>
      <form onSubmit={manejarSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">Nombre</label>
          <input required value={nombre} onChange={(e) => setNombre(e.target.value)} className="input" placeholder="Ej: Internet" autoFocus />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">Categoría</label>
          <CategoriaSelect tipo="gasto" value={categoriaId} onChange={setCategoriaId} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">Monto</label>
            <input type="number" step="0.01" min="0" required value={monto} onChange={(e) => setMonto(e.target.value)} className="input figure" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">Día de pago</label>
            <input type="number" min="1" max="31" value={diaPago} onChange={(e) => setDiaPago(e.target.value)} className="input figure" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">Frecuencia</label>
            <select value={frecuencia} onChange={(e) => setFrecuencia(e.target.value as any)} className="input">
              <option value="mensual">Mensual</option>
              <option value="anual">Anual</option>
            </select>
          </div>
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
