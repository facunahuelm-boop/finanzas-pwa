'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Modal } from './Modal';
import type { Objetivo } from '@/types/database';
import { Loader2 } from 'lucide-react';

const COLORES = ['#0F6B5C', '#D4A24C', '#4C7BAE', '#8C6BAE', '#C24B7C', '#3F9B7A'];

export function ObjetivoModal({
  abierto,
  onCerrar,
  onGuardado,
  objetivo,
}: {
  abierto: boolean;
  onCerrar: () => void;
  onGuardado: () => void;
  objetivo?: Objetivo | null;
}) {
  const supabase = createClient();
  const [nombre, setNombre] = useState(objetivo?.nombre ?? '');
  const [montoObjetivo, setMontoObjetivo] = useState(objetivo?.monto_objetivo?.toString() ?? '');
  const [montoActual, setMontoActual] = useState(objetivo?.monto_actual?.toString() ?? '0');
  const [fechaLimite, setFechaLimite] = useState(objetivo?.fecha_limite ?? '');
  const [color, setColor] = useState(objetivo?.color ?? COLORES[0]);
  const [notas, setNotas] = useState(objetivo?.notas ?? '');
  const [cargando, setCargando] = useState(false);

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const actual = parseFloat(montoActual);
    const meta = parseFloat(montoObjetivo);
    const estado = actual >= meta ? 'cumplido' : 'en_progreso';

    const payload = {
      nombre,
      monto_objetivo: meta,
      monto_actual: actual,
      fecha_limite: fechaLimite || null,
      color,
      estado,
      notas: notas || null,
      user_id: user.id,
    };

    if (objetivo) {
      await supabase.from('objetivos').update(payload).eq('id', objetivo.id);
    } else {
      await supabase.from('objetivos').insert(payload);
    }

    setCargando(false);
    onGuardado();
    onCerrar();
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={objetivo ? 'Editar objetivo' : 'Nuevo objetivo'}>
      <form onSubmit={manejarSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">Nombre</label>
          <input required value={nombre} onChange={(e) => setNombre(e.target.value)} className="input" placeholder="Ej: Fondo de emergencia" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">Meta</label>
            <input type="number" step="0.01" min="0" required value={montoObjetivo} onChange={(e) => setMontoObjetivo(e.target.value)} className="input figure" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">Ahorrado</label>
            <input type="number" step="0.01" min="0" value={montoActual} onChange={(e) => setMontoActual(e.target.value)} className="input figure" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">Fecha límite</label>
          <input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} className="input" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">Color</label>
          <div className="flex gap-2">
            {COLORES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="h-7 w-7 rounded-full ring-offset-2 ring-offset-surface-light dark:ring-offset-surface-dark transition"
                style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }}
              />
            ))}
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
