-- ============================================================
-- ESQUEMA DE BASE DE DATOS - APP DE FINANZAS PERSONALES
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- Extensión para UUIDs
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- TABLA: categorias
-- ------------------------------------------------------------
create table if not exists categorias (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  tipo text not null check (tipo in ('ingreso', 'gasto')),
  color text not null default '#0F6B5C',
  icono text not null default 'Circle',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TABLA: transacciones (gastos e ingresos)
-- ------------------------------------------------------------
create table if not exists transacciones (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('ingreso', 'gasto')),
  monto numeric(14,2) not null check (monto >= 0),
  categoria_id uuid references categorias(id) on delete set null,
  descripcion text,
  fecha date not null default current_date,
  metodo_pago text,
  created_at timestamptz not null default now()
);

create index if not exists idx_transacciones_user_fecha on transacciones(user_id, fecha desc);
create index if not exists idx_transacciones_tipo on transacciones(user_id, tipo);

-- ------------------------------------------------------------
-- TABLA: deudas
-- ------------------------------------------------------------
create table if not exists deudas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  acreedor text,
  monto_total numeric(14,2) not null check (monto_total >= 0),
  monto_pagado numeric(14,2) not null default 0,
  tasa_interes numeric(6,2) default 0,
  cuotas_totales integer default 1,
  cuotas_pagadas integer default 0,
  fecha_inicio date default current_date,
  fecha_vencimiento date,
  estado text not null default 'activa' check (estado in ('activa', 'pagada', 'vencida')),
  notas text,
  created_at timestamptz not null default now()
);

create index if not exists idx_deudas_user on deudas(user_id);

-- ------------------------------------------------------------
-- TABLA: gastos_fijos (recurrentes)
-- ------------------------------------------------------------
create table if not exists gastos_fijos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  monto numeric(14,2) not null check (monto >= 0),
  categoria_id uuid references categorias(id) on delete set null,
  dia_pago integer check (dia_pago between 1 and 31),
  frecuencia text not null default 'mensual' check (frecuencia in ('mensual', 'anual')),
  activo boolean not null default true,
  notas text,
  created_at timestamptz not null default now()
);

create index if not exists idx_gastos_fijos_user on gastos_fijos(user_id);

-- ------------------------------------------------------------
-- TABLA: objetivos (metas de ahorro)
-- ------------------------------------------------------------
create table if not exists objetivos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  monto_objetivo numeric(14,2) not null check (monto_objetivo >= 0),
  monto_actual numeric(14,2) not null default 0,
  fecha_limite date,
  color text not null default '#D4A24C',
  estado text not null default 'en_progreso' check (estado in ('en_progreso', 'cumplido', 'pausado')),
  notas text,
  created_at timestamptz not null default now()
);

create index if not exists idx_objetivos_user on objetivos(user_id);

-- ============================================================
-- ROW LEVEL SECURITY: cada usuario solo ve/edita sus propios datos
-- ============================================================
alter table categorias enable row level security;
alter table transacciones enable row level security;
alter table deudas enable row level security;
alter table gastos_fijos enable row level security;
alter table objetivos enable row level security;

create policy "categorias_select_own" on categorias for select using (auth.uid() = user_id);
create policy "categorias_insert_own" on categorias for insert with check (auth.uid() = user_id);
create policy "categorias_update_own" on categorias for update using (auth.uid() = user_id);
create policy "categorias_delete_own" on categorias for delete using (auth.uid() = user_id);

create policy "transacciones_select_own" on transacciones for select using (auth.uid() = user_id);
create policy "transacciones_insert_own" on transacciones for insert with check (auth.uid() = user_id);
create policy "transacciones_update_own" on transacciones for update using (auth.uid() = user_id);
create policy "transacciones_delete_own" on transacciones for delete using (auth.uid() = user_id);

create policy "deudas_select_own" on deudas for select using (auth.uid() = user_id);
create policy "deudas_insert_own" on deudas for insert with check (auth.uid() = user_id);
create policy "deudas_update_own" on deudas for update using (auth.uid() = user_id);
create policy "deudas_delete_own" on deudas for delete using (auth.uid() = user_id);

create policy "gastos_fijos_select_own" on gastos_fijos for select using (auth.uid() = user_id);
create policy "gastos_fijos_insert_own" on gastos_fijos for insert with check (auth.uid() = user_id);
create policy "gastos_fijos_update_own" on gastos_fijos for update using (auth.uid() = user_id);
create policy "gastos_fijos_delete_own" on gastos_fijos for delete using (auth.uid() = user_id);

create policy "objetivos_select_own" on objetivos for select using (auth.uid() = user_id);
create policy "objetivos_insert_own" on objetivos for insert with check (auth.uid() = user_id);
create policy "objetivos_update_own" on objetivos for update using (auth.uid() = user_id);
create policy "objetivos_delete_own" on objetivos for delete using (auth.uid() = user_id);

-- ============================================================
-- CATEGORÍAS POR DEFECTO: se crean automáticamente para cada
-- usuario nuevo mediante un trigger sobre auth.users
-- ============================================================
create or replace function public.crear_categorias_default()
returns trigger as $$
begin
  insert into public.categorias (user_id, nombre, tipo, color, icono) values
    (new.id, 'Alquiler/Vivienda', 'gasto', '#B54A3F', 'Home'),
    (new.id, 'Alimentación', 'gasto', '#C97B3B', 'ShoppingCart'),
    (new.id, 'Transporte', 'gasto', '#8C6BAE', 'Car'),
    (new.id, 'Servicios', 'gasto', '#4C7BAE', 'Zap'),
    (new.id, 'Salud', 'gasto', '#3F9B7A', 'HeartPulse'),
    (new.id, 'Ocio', 'gasto', '#C24B7C', 'Popcorn'),
    (new.id, 'Otros gastos', 'gasto', '#7A7A7A', 'MoreHorizontal'),
    (new.id, 'Sueldo', 'ingreso', '#0F6B5C', 'Wallet'),
    (new.id, 'Comisiones', 'ingreso', '#D4A24C', 'TrendingUp'),
    (new.id, 'Otros ingresos', 'ingreso', '#4C9B7A', 'PlusCircle');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.crear_categorias_default();
