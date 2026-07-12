export type TipoMovimiento = 'ingreso' | 'gasto';

export interface Categoria {
  id: string;
  user_id: string;
  nombre: string;
  tipo: TipoMovimiento;
  color: string;
  icono: string;
  created_at: string;
}

export interface Transaccion {
  id: string;
  user_id: string;
  tipo: TipoMovimiento;
  monto: number;
  categoria_id: string | null;
  descripcion: string | null;
  fecha: string;
  metodo_pago: string | null;
  created_at: string;
  categorias?: Categoria | null;
}

export type EstadoDeuda = 'activa' | 'pagada' | 'vencida';

export interface Deuda {
  id: string;
  user_id: string;
  nombre: string;
  acreedor: string | null;
  monto_total: number;
  monto_pagado: number;
  tasa_interes: number;
  cuotas_totales: number;
  cuotas_pagadas: number;
  fecha_inicio: string;
  fecha_vencimiento: string | null;
  estado: EstadoDeuda;
  notas: string | null;
  created_at: string;
}

export interface GastoFijo {
  id: string;
  user_id: string;
  nombre: string;
  monto: number;
  categoria_id: string | null;
  dia_pago: number | null;
  frecuencia: 'mensual' | 'anual';
  activo: boolean;
  notas: string | null;
  created_at: string;
  categorias?: Categoria | null;
}

export type EstadoObjetivo = 'en_progreso' | 'cumplido' | 'pausado';

export interface Objetivo {
  id: string;
  user_id: string;
  nombre: string;
  monto_objetivo: number;
  monto_actual: number;
  fecha_limite: string | null;
  color: string;
  estado: EstadoObjetivo;
  notas: string | null;
  created_at: string;
}
