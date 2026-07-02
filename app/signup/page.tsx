'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch('/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
    const data = await res.json();
    if (!res.ok) { setLoading(false); setError(data.error ?? 'Something went wrong.'); return; }
    const result = await signIn('credentials', { redirect: false, email, password });
    setLoading(false);
    if (result?.error) { setError('Account created but auto-login failed, please log in.'); return; }
    router.push('/dashboard');
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="card p-8 w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Create your account</h1>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div><label className="block text-sm mb-1">Name</label><input className="input w-full" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className="block text-sm mb-1">Email</label><input type="email" required className="input w-full" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="block text-sm mb-1">Password</label><input type="password" required minLength={8} className="input w-full" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Creating...' : 'Sign up'}</button>
        <p className="text-sm text-gray-400">Already have an account? <Link href="/login" className="text-brand-500">Log in</Link></p>
      </form>
    </main>
  );
}
