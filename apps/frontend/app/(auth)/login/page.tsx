'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message ?? 'Login failed');
      }

      router.push('/profile');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to login');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container space-y-3 py-10">
      <h1 className="text-3xl font-bold">Sign in</h1>
      <p className="text-muted-foreground">
        Authenticates against the gateway <code>/auth/login</code>.
      </p>
      <Card className="grid gap-4 p-6 max-w-xl">
        <form className="grid gap-4" onSubmit={onSubmit}>
          <label className="grid gap-2 text-sm font-medium">
            <span className="text-muted-foreground">Email</span>
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            <span className="text-muted-foreground">Password</span>
            <Input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? 'Signing in...' : 'Sign in'}
          </Button>
          <p className="text-sm text-muted-foreground">
            Need an account? <a href="/register" className="underline underline-offset-4">Register</a>
          </p>
          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Error: {error}
            </div>
          ) : null}
        </form>
      </Card>
    </div>
  );
}

