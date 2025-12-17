import Link from 'next/link';
import ProductCard from '@/components/catalog/product-card';
import { listCategories, listProducts } from '@/lib/api';
import type { Category, Product } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default async function CatalogPage() {
  let products: Product[] = [];
  let categories: Category[] = [];
  let error: string | null = null;

  try {
    [categories, products] = await Promise.all([listCategories(), listProducts()]);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unable to load catalog';
  }

  return (
    <div className="container space-y-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-primary">Catalog</p>
          <h1 className="text-3xl font-bold tracking-tight">Latest drops & staples</h1>
          <p className="text-muted-foreground">
            Powered by catalog and inventory services via the gateway.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/search">Search</Link>
        </Button>
      </header>

      {error ? <Badge variant="destructive">Error: {error}</Badge> : null}

      {categories.length ? (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge key={category.id} variant="secondary">
              {category.name}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.length
          ? products.map((product) => <ProductCard key={product.id} product={product} />)
          : !error && <p className="text-muted-foreground">No products yet.</p>}
      </div>
    </div>
  );
}

