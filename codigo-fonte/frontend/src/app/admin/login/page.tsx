'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { adminApi, setToken } from '@/lib/adminApi';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await adminApi.login(password);
      setToken(token);
      router.replace('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-purple flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-cream rounded-lg p-10 w-full max-w-sm flex flex-col gap-6 items-center"
      >
        <Logo size={110} />
        <h1 className="font-display font-bold text-text-dark text-xl">painel do editor</h1>

        <label className="w-full">
          <span className="font-display text-sm text-text-dark">senha</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="mt-1 w-full border border-text-dark/30 rounded px-3 py-2 bg-white font-sans text-text-dark focus:outline-none focus:border-pink"
          />
        </label>

        {error && <p className="font-sans text-sm text-pink">{error}</p>}

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full bg-pink text-white font-display font-bold py-2 rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? 'entrando…' : 'entrar'}
        </button>
      </form>
    </div>
  );
}
