'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Wallet, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [modo, setModo] = useState<'ingresar' | 'crear'>('ingresar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMensaje(null);
    setCargando(true);

    if (modo === 'ingresar') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos.' : error.message);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) {
        setError(error.message);
      } else {
        setMensaje('Cuenta creada. Revisá tu email para confirmar el registro.');
      }
    }
    setCargando(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-light dark:bg-bg-dark px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
            <Wallet size={22} />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink-light dark:text-ink-dark">
            Finanzas
          </h1>
          <p className="text-sm text-muted-light dark:text-muted-dark">
            {modo === 'ingresar' ? 'Ingresá a tu panel personal' : 'Creá tu cuenta'}
          </p>
        </div>

        <form onSubmit={manejarSubmit} className="card p-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="vos@ejemplo.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-light dark:text-muted-dark">
              Contraseña
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              autoComplete={modo === 'ingresar' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
          )}
          {mensaje && (
            <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{mensaje}</p>
          )}

          <button type="submit" disabled={cargando} className="btn-primary w-full">
            {cargando && <Loader2 size={16} className="animate-spin" />}
            {modo === 'ingresar' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>

        <button
          onClick={() => {
            setModo(modo === 'ingresar' ? 'crear' : 'ingresar');
            setError(null);
            setMensaje(null);
          }}
          className="mt-5 w-full text-center text-sm text-muted-light dark:text-muted-dark hover:text-primary transition"
        >
          {modo === 'ingresar' ? '¿No tenés cuenta? Creá una' : '¿Ya tenés cuenta? Ingresá'}
        </button>
      </div>
    </div>
  );
}
