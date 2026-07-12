'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

export function Modal({
  abierto,
  onCerrar,
  titulo,
  children,
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onCerrar();
    }
    if (abierto) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCerrar} />
      <div
        className="relative w-full md:max-w-md card p-6 max-h-[90vh] overflow-y-auto rounded-b-none md:rounded-2xl"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{titulo}</h2>
          <button
            onClick={onCerrar}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-light dark:text-muted-dark hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
