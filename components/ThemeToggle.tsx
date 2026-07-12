'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);
  if (!montado) return <div className="h-9 w-9" />;

  const esOscuro = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(esOscuro ? 'light' : 'dark')}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-light dark:border-border-dark text-muted-light dark:text-muted-dark hover:text-primary transition"
      aria-label="Cambiar tema"
    >
      {esOscuro ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
