import Link from 'next/link';
import OrderStatusBadge from '@/components/orders/order-status-badge';
import { getProfile, listOrders } from '@/lib/api';
import type { OrderSummary } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function OrdersPage() {
  let orders: OrderSummary[] = [];
  let authenticated = true;

  try {
    await getProfile();
    orders = await listOrders();
  } catch {
    authenticated = false;
  }

  if (!authenticated) {
    return (
      <div className="container py-10">
        <Card className="p-6 space-y-3">
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-muted-foreground">Sign in to view your orders.</p>
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container space-y-4 py-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Pulled from gateway <code>/orders</code>.</p>
      </div>

      {orders.length === 0 ? (
        <Card className="p-6">
          <p className="text-muted-foreground">No orders yet.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 transition hover:bg-accent"
              href={`/orders/${order.id}`}
            >
              <div className="space-y-1">
                <div className="font-semibold">Order {order.id}</div>
                <div className="text-sm text-muted-foreground">
                  {order.currency ?? ''} {order.totalAmount ?? ''}
                </div>
              </div>
              <OrderStatusBadge status={order.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

