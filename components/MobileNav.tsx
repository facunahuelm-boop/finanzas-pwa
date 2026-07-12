'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut, Wallet } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { NAV_ITEMS } from './nav-items';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

const PRINCIPALES = NAV_ITEMS.slice(0, 3); // Dashboard, Gastos, Ingresos
const RESTO = NAV_ITEMS.slice(3); // Deudas, Gastos fijos, Objetivos, Reportes

export function MobileNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [abierto, setAbierto] = useState(false);

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      {/* Header móvil */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border-light dark:border-border-dark bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur px-4 py-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <Wallet size={16} />
          </div>
          <span className="font-display text-base font-semibold">Finanzas</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Barra inferior */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex border-t border-border-light dark:border-border-dark bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {PRINCIPALES.map((item) => {
          const activo = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition',
                activo ? 'text-primary' : 'text-muted-light dark:text-muted-dark'
              )}
            >
              <Icon size={20} strokeWidth={activo ? 2.4 : 2} />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => setAbierto(true)}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-light dark:text-muted-dark"
        >
          <Menu size={20} />
          Más
        </button>
      </nav>

      {/* Drawer */}
      {abierto && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="flex-1 bg-black/40"
            onClick={() => setAbierto(false)}
          />
          <div
            className="w-72 bg-surface-light dark:bg-surface-dark p-5 flex flex-col"
            style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display text-lg font-semibold">Menú</span>
              <button onClick={() => setAbierto(false)} className="p-1 text-muted-light dark:text-muted-dark">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 space-y-1">
              {RESTO.map((item) => {
                const activo = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setAbierto(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                      activo ? 'bg-primary/10 text-primary' : 'text-ink-light dark:text-ink-dark'
                    )}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-border-light dark:border-border-dark pt-3 space-y-2">
              <p className="truncate px-1 text-xs text-muted-light dark:text-muted-dark">{email}</p>
              <button
                onClick={cerrarSesion}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-light dark:text-muted-dark hover:text-danger transition"
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
