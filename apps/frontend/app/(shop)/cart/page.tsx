'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type CartItem = {
  productId: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
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

function persistCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(loadCart());
  }, []);

  useEffect(() => {
    persistCart(items);
  }, [items]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const updateQuantity = (sku: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) => (item.sku === sku ? { ...item, quantity: Math.max(1, quantity) } : item))
    );
  };

  const removeItem = (sku: string) => {
    setItems((prev) => prev.filter((item) => item.sku !== sku));
  };

  return (
    <div className="container space-y-4 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Cart</h1>
        <p className="text-muted-foreground">
          Cart is stored locally and checked out via the gateway <code>/checkout</code>.
        </p>
      </div>

      {items.length === 0 ? (
        <Card className="p-6">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button variant="secondary" asChild className="mt-4">
            <Link href="/catalog">Browse catalog</Link>
          </Button>
        </Card>
      ) : (
        <Card className="grid gap-4 p-6">
          {items.map((item) => (
            <div key={item.sku} className="flex items-start justify-between gap-4 rounded-lg border border-border/70 p-4">
              <div className="space-y-1">
                <div className="text-sm font-semibold">{item.name}</div>
                <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
                <div className="text-sm font-medium">₹{item.price.toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.sku, Number(e.target.value))}
                  className="w-20"
                />
                <Button variant="outline" onClick={() => removeItem(item.sku)}>
                  Remove
                </Button>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <strong>Total: ₹{total.toFixed(2)}</strong>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" asChild>
                <Link href="/catalog">Continue shopping</Link>
              </Button>
              <Button asChild>
                <Link href="/checkout">Checkout</Link>
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

