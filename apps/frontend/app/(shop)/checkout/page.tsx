'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type CartItem = {
  productId: string;
  sku: string;
  quantity: number;
  price: number;
};

const STORAGE_KEY = 'frontend_cart_items';

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(loadCart());
  }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('Submitting...');
    setError(null);

    if (!items.length) {
      setStatus(null);
      setError('Add items to cart before checkout.');
      return;
    }

    try {
      const response = await fetch('/api/proxy/checkout', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          currency: 'INR',
          items,
          notes,
          paymentProvider: 'razorpay'
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message ?? 'Checkout failed');
      }

      localStorage.removeItem(STORAGE_KEY);
      setStatus('Order created');
      router.push(`/orders`);
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Unable to complete checkout');
    }
  };

  return (
    <div className="container space-y-4 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="text-muted-foreground">
          Submits to gateway <code>/checkout</code>. Requires authentication for customer flows.
        </p>
      </div>

      <Card className="grid gap-6 p-6">
        <form className="grid gap-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Delivery instructions"
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">Items</div>
            {items.length === 0 ? (
              <p className="text-muted-foreground">No items in cart.</p>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.sku}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                  >
                    <div>
                      <div className="font-semibold">{item.sku}</div>
                      <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                    </div>
                    <span className="font-medium">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <strong>Total: ₹{total.toFixed(2)}</strong>
            <Button type="submit" disabled={!!status && status !== 'Order created'}>
              {status ?? 'Place order'}
            </Button>
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Error: {error}
            </div>
          ) : null}
          {status === 'Order created' ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Order created. Redirecting...
            </div>
          ) : null}
        </form>
      </Card>
    </div>
  );
}

