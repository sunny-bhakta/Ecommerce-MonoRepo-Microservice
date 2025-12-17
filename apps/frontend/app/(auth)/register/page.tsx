'use client';

import { FormEvent, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('Registering...');
    setError(null);
    try {
      const response = await fetch('/api/proxy/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password, fullName })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message ?? 'Registration failed');
      }
      setStatus('Registered. You can now sign in.');
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Unable to register');
    }
  };

  return (
    <div className="container space-y-3 py-10">
      <h1 className="text-3xl font-bold">Register</h1>
      <p className="text-muted-foreground">
        Creates a new user through gateway <code>/auth/register</code>.
      </p>
      <Card className="grid gap-4 p-6 max-w-xl">
        <form className="grid gap-4" onSubmit={onSubmit}>
          <label className="grid gap-2 text-sm font-medium">
            <span className="text-muted-foreground">Full name</span>
            <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </label>
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
          <Button type="submit">Submit</Button>
          {status ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {status}
            </div>
          ) : null}
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

