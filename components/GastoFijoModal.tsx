'use client';

import { useEffect, useState } from 'react';
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
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [diaPago, setDiaPago] = useState('1');
  const [frecuencia, setFrecuencia] = useState<'mensual' | 'anual'>('mensual');
  const [notas, setNotas] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resetear campos cada vez que se abre el modal
  useEffect(() => {
    if (abierto) {
      setNombre(gastoFijo?.nombre ?? '');
      setMonto(gastoFijo?.monto?.toString() ?? '');
      setCategoriaId(gastoFijo?.categoria_id ?? '');
      setDiaPago(gastoFijo?.dia_pago?.toString() ?? '1');
      setFrecuencia(gastoFijo?.frecuencia ?? 'mensual');
      setNotas(gastoFijo?.notas ?? '');
      setError(null);
    }
  }, [abierto, gastoFijo]);

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    if (!monto || parseFloat(monto) <= 0) {
      setError('El monto debe ser mayor a 0.');
      return;
    }

    setCargando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('No hay sesión activa.');
      setCargando(false);
      return;
    }

    const payload = {
      nombre: nombre.trim(),
      monto: parseFloat(monto),
      categoria_id: categoriaId || null,
      dia_pago: parseInt(diaPago) || 1,
      frecuencia,
      notas: notas.trim() || null,
      user_id: user.id,
    };

    const { error: dbError } = gastoFijo
      ? await supabase.from('gastos_fijos').update(payload).eq('id', gastoFijo.id)
      : await supabase.from('gastos_fijos').insert({ ...payload, activo: true });

    if (dbError) {
      setError('Error al guardar. Intentá de nuevo.');
      setCargando(false);
      return;
    }

    setCargando(false);
    onGuardado();
    onCerrar();
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={gastoFijo ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}>
      <form onSubmit={manejarSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">
            Nombre <span className="text-danger">*</span>
          </label>
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="input"
            placeholder="Ej: Internet, Alquiler, Netflix..."
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">Categoría</label>
          <CategoriaSelect tipo="gasto" value={categoriaId} onChange={setCategoriaId} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">
              Monto <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="input figure"
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">Día de pago</label>
            <input
              type="number"
              min="1"
              max="31"
              value={diaPago}
              onChange={(e) => setDiaPago(e.target.value)}
              className="input figure"
            />
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
          <input
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="input"
            placeholder="Opcional"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
        )}

        <button type="submit" disabled={cargando} className="btn-primary w-full">
          {cargando && <Loader2 size={16} className="animate-spin" />}
          {cargando ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </Modal>
  );
}
