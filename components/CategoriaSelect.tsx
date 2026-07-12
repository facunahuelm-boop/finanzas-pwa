'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCategorias } from '@/lib/useCategorias';
import type { TipoMovimiento } from '@/types/database';

const COLORES = ['#0F6B5C', '#D4A24C', '#B54A3F', '#4C7BAE', '#8C6BAE', '#C24B7C', '#3F9B7A', '#7A7A7A'];

export function CategoriaSelect({
  tipo,
  value,
  onChange,
}: {
  tipo: TipoMovimiento;
  value: string;
  onChange: (id: string) => void;
}) {
  const { categorias, crearCategoria } = useCategorias(tipo);
  const [creando, setCreando] = useState(false);
  const [nombreNueva, setNombreNueva] = useState('');

  async function manejarCrear() {
    if (!nombreNueva.trim()) return;
    const color = COLORES[Math.floor(Math.random() * COLORES.length)];
    const nueva = await crearCategoria(nombreNueva.trim(), tipo, color);
    if (nueva) {
      onChange(nueva.id);
      setNombreNueva('');
      setCreando(false);
    }
  }

  if (creando) {
    return (
      <div className="flex gap-2">
        <input
          autoFocus
          value={nombreNueva}
          onChange={(e) => setNombreNueva(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), manejarCrear())}
          placeholder="Nombre de categoría"
          className="input flex-1"
        />
        <button type="button" onClick={manejarCrear} className="btn-secondary px-3">
          Crear
        </button>
        <button type="button" onClick={() => setCreando(false)} className="btn-secondary px-3">
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input flex-1"
        required
      >
        <option value="">Elegí una categoría</option>
        {categorias.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setCreando(true)}
        className="btn-secondary px-3"
        title="Nueva categoría"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
