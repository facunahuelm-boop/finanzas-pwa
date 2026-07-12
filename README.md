# Finanzas Personales — PWA

App web progresiva para administrar ingresos, gastos, deudas, gastos fijos y objetivos de ahorro. Construida con **Next.js 14 (App Router)**, **React**, **Tailwind CSS** y **Supabase**, lista para desplegar en **Vercel**.

Funciona como app instalable tanto en iPhone (Agregar a inicio desde Safari) como en PC/Android, con modo oscuro, gráficos mensuales, categorías personalizadas, búsqueda, filtros y exportación a Excel.

---

## 1. Crear el proyecto en Supabase

1. Andá a [supabase.com](https://supabase.com) → **New project**.
2. Cuando esté creado, andá a **SQL Editor** → **New query**.
3. Copiá y pegá todo el contenido de `supabase/schema.sql` (incluido en este proyecto) y ejecutalo. Esto crea las tablas, la seguridad a nivel de fila (RLS) y las categorías por defecto para cada usuario nuevo.
4. Andá a **Project Settings → API** y copiá:
   - `Project URL`
   - `anon public key`
5. **Authentication → Providers**: dejá habilitado "Email". Si no querés que pida confirmación por email mientras probás, podés desactivar "Confirm email" en **Authentication → Settings**.

## 2. Configurar el proyecto localmente

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local
```

Editá `.env.local` con los datos de tu proyecto Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

Correr en desarrollo:

```bash
npm run dev
```

Abrí `http://localhost:3000` — te va a pedir crear una cuenta (email + contraseña).

> Nota: el service worker de la PWA está desactivado en modo desarrollo (`npm run dev`) a propósito. Para probarlo hacé `npm run build && npm run start`.

## 3. Desplegar en Vercel

1. Subí este proyecto a un repositorio de GitHub.
2. Entrá a [vercel.com](https://vercel.com) → **Add New Project** → importá el repo.
3. En **Environment Variables**, cargá las mismas dos variables del paso anterior (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Deploy. Vercel detecta Next.js automáticamente.
5. En Supabase, andá a **Authentication → URL Configuration** y agregá la URL de tu deploy de Vercel (ej: `https://tu-app.vercel.app`) tanto en "Site URL" como en "Redirect URLs" (agregá `https://tu-app.vercel.app/auth/callback`).

## 4. Instalar la app en iPhone

1. Abrí la URL de tu app en **Safari** (tiene que ser Safari, no Chrome).
2. Tocá el botón de compartir (el cuadrado con la flecha hacia arriba).
3. Elegí **"Agregar a pantalla de inicio"**.
4. La app queda instalada con ícono propio, pantalla completa y funciona offline para la interfaz (los datos requieren conexión porque viven en Supabase).

En Android/Chrome y en PC (Chrome/Edge) va a aparecer automáticamente un ícono de "Instalar app" en la barra de direcciones.

## 5. Estructura del proyecto

```
app/
  login/                 → pantalla de autenticación
  (dashboard)/
    dashboard/           → resumen general + gráficos
    gastos/               → listado de gastos con búsqueda/filtros
    ingresos/             → listado de ingresos con búsqueda/filtros
    deudas/               → seguimiento de deudas con progreso
    gastos-fijos/         → gastos recurrentes mensuales/anuales
    objetivos/            → metas de ahorro con progreso circular
    reportes/             → reportes por período + exportación completa
components/              → componentes reutilizables (modales, nav, gráficos)
lib/supabase/            → clientes de Supabase (browser, server, middleware)
supabase/schema.sql       → esquema completo de base de datos + RLS
types/database.ts         → tipos TypeScript de las tablas
```

## 6. Categorías personalizadas

Cada usuario nuevo recibe automáticamente un set de categorías base (Alquiler, Alimentación, Sueldo, etc. — ver el trigger `crear_categorias_default` en `schema.sql`). Desde cualquier formulario de gasto/ingreso/gasto fijo se puede crear una categoría nueva al vuelo con el botón "+" junto al selector.

## 7. Seguridad

Todas las tablas tienen **Row Level Security** habilitada: cada usuario solo puede leer y escribir sus propios datos (`auth.uid() = user_id`). La autenticación la maneja Supabase Auth con cookies HTTP-only mediante `@supabase/ssr`, y el middleware (`middleware.ts`) protege todas las rutas del dashboard redirigiendo a `/login` si no hay sesión.

## 8. Personalización rápida

- **Moneda**: por defecto está en pesos uruguayos (UYU). Se cambia en `lib/utils.ts`, función `formatCurrency`.
- **Colores/tema**: definidos como tokens en `tailwind.config.js` (paleta `primary`, `accent`, `danger`, etc.) y en `app/globals.css`.
- **Ícono de la app**: reemplazá los archivos en `public/icons/` (192px, 512px y la versión maskable de 512px) manteniendo los mismos nombres.
