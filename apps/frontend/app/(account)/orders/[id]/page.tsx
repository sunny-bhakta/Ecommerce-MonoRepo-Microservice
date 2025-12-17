import Link from 'next/link';
import { notFound } from 'next/navigation';
import OrderStatusBadge from '@/components/orders/order-status-badge';
import { getOrderSummary, listPayments } from '@/lib/api';
import type { PaymentSummary } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type Props = {
  params: { id: string };
};

export default async function OrderDetailPage({ params }: Props) {
  const { id } = params;

  const order = await getOrderSummary(id).catch(() => null);

  if (!order) {
    notFound();
  }

  let payments: PaymentSummary[] = [];
  try {
    payments = await listPayments(id);
  } catch {
    // ignore; payments may not exist yet
  }

  return (
    <div className="container space-y-4 py-10">
      <Link
        className="inline-flex w-fit items-center text-sm text-muted-foreground hover:text-foreground"
        href="/orders"
      >
        ← Back to orders
      </Link>

      <Card className="p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Order {order.id}</h1>
            <p className="text-muted-foreground">
              {order.currency ?? ''} {order.totalAmount ?? ''}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          Summary provided by gateway <code>/orders/{'{orderId}'}/summary</code>.
        </p>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Payments</h3>
          <span className="text-sm text-muted-foreground">
            {payments.length} record{payments.length === 1 ? '' : 's'}
          </span>
        </div>
        <Separator />
        {payments.length === 0 ? (
          <p className="text-muted-foreground">No payments recorded yet.</p>
        ) : (
          payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
            >
              <div>
                <div className="font-semibold">{payment.id}</div>
                <div className="text-sm text-muted-foreground">
                  {payment.currency ?? ''} {payment.amount ?? ''} · {payment.provider ?? 'provider'}
                </div>
              </div>
              <OrderStatusBadge status={payment.status} />
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

