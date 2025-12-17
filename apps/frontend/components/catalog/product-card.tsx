import Link from 'next/link';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Props = {
  product: Product;
};

export default function ProductCard({ product }: Props) {
  const price =
    product.basePrice ??
    product.variants?.find((variant) => typeof variant.price === 'number')?.price;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{product.categoryId ?? 'Product'}</Badge>
          {price ? <span className="text-sm font-semibold">₹{price.toFixed(2)}</span> : null}
        </div>
        <CardTitle className="line-clamp-1">{product.name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {product.description ?? 'Details coming soon. Managed via the catalog service.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/product/${product.id}`}>View</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

