'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { NAV_ITEMS } from './nav-items';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-border-light md:dark:border-border-dark md:bg-surface-light md:dark:bg-surface-dark md:h-screen md:sticky md:top-0">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
          <Wallet size={18} />
        </div>
        <span className="font-display text-lg font-semibold">Finanzas</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const activo = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                activo
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-light dark:text-muted-dark hover:bg-black/[0.03] dark:hover:bg-white/[0.04] hover:text-ink-light dark:hover:text-ink-dark'
              )}
            >
              <Icon size={18} strokeWidth={activo ? 2.3 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-light dark:border-border-dark p-3 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="truncate text-xs text-muted-light dark:text-muted-dark">{email}</span>
          <ThemeToggle />
        </div>
        <button
          onClick={cerrarSesion}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-light dark:text-muted-dark hover:text-danger transition"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
