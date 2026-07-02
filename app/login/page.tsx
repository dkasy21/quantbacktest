'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn('credentials', { redirect: false, email, password });
    setLoading(false);
    if (result?.error) { setError('Invalid email or password.'); return; }
    router.push('/dashboard');
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="card p-8 w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Log in</h1>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div><label className="block text-sm mb-1">Email</label><input type="email" required className="input w-full" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="block text-sm mb-1">Password</label><input type="password" required className="input w-full" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Logging in...' : 'Log in'}</button>
        <p className="text-sm text-gray-400">No account? <Link href="/signup" className="text-brand-500">Sign up</Link></p>
      </form>
    </main>
  );
}
