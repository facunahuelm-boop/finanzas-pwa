'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Categoria, TipoMovimiento } from '@/types/database';

export function useCategorias(tipo?: TipoMovimiento) {
  const supabase = createClient();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    let query = supabase.from('categorias').select('*').order('nombre');
    if (tipo) query = query.eq('tipo', tipo);
    const { data } = await query;
    setCategorias(data ?? []);
    setCargando(false);
  }, [tipo]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crearCategoria(nombre: string, tipoNueva: TipoMovimiento, color: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('categorias')
      .insert({ nombre, tipo: tipoNueva, color, icono: 'Circle', user_id: user.id })
      .select()
      .single();
    if (!error) await cargar();
    return data;
  }

  return { categorias, cargando, recargar: cargar, crearCategoria };
}
