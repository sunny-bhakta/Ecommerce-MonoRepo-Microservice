import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

type Props = {
  params: { id: string };
};

export default async function ProductDetailPage({ params }: Props) {
  const { id } = params;
  const product = await getProduct(id).catch(() => null);

  if (!product) {
    notFound();
  }

  const price =
    product?.basePrice ??
    product?.variants?.find((variant) => typeof variant.price === 'number')?.price;

  return (
    <div className="container space-y-6 py-8">
      <Button variant="ghost" asChild>
        <Link href="/catalog">← Back to catalog</Link>
      </Button>

      <Card className="grid gap-8 p-6 md:grid-cols-2">
        <div className="aspect-square w-full rounded-2xl bg-gradient-to-br from-slate-100 to-white" />
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{product?.categoryId ?? 'Product'}</Badge>
            <Badge variant="outline">In stock</Badge>
          </div>
          <CardHeader className="p-0">
            <CardTitle className="text-3xl font-bold">{product?.name}</CardTitle>
          </CardHeader>
          {price ? <div className="text-2xl font-semibold">₹{price.toFixed(2)}</div> : null}
          <p className="text-muted-foreground">
            {product?.description ?? 'Description not available.'}
          </p>
          <Separator />
          {product?.variants?.length ? (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-muted-foreground">Available variants</div>
              <div className="grid gap-3">
                {product.variants.map((variant) => (
                  <div
                    key={variant.sku}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{variant.sku}</div>
                      <div className="text-sm text-muted-foreground">
                        {variant.attributes?.map((a) => `${a.key}:${a.value}`).join(' · ') || '—'}
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="font-semibold text-foreground">
                        ₹{variant.price?.toFixed(2) ?? 'N/A'}
                      </div>
                      <div>Stock: {variant.stock ?? '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/checkout">Checkout</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/cart">Add to cart</Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

