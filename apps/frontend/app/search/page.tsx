'use client';

import { FormEvent, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Result = {
  id: string;
  name?: string;
  snippet?: string;
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/search?q=${encodeURIComponent(query)}`);
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.message ?? 'Search failed');
      }
      setResults(payload?.results ?? payload ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to search');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container space-y-4 py-10">
      <h1 className="text-3xl font-bold">Search</h1>
      <p className="text-muted-foreground">
        Queries the search service via gateway <code>/search</code>.
      </p>

      <Card className="p-5">
        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input
            required
            placeholder="Search products, categories…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </Button>
        </form>
        {error ? (
          <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Error: {error}
          </div>
        ) : null}
      </Card>

      {results.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((item) => (
            <Card className="p-4" key={item.id}>
              <div className="font-semibold">{item.name ?? item.id}</div>
              <p className="text-sm text-muted-foreground">
                {item.snippet ?? 'Result from search service'}
              </p>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}

