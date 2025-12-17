import Link from 'next/link';
import OrderStatusBadge from '@/components/orders/order-status-badge';
import { gatewayFetch } from '@/lib/api';
import { Card } from '@/components/ui/card';

type Props = {
  params: { id: string };
};

export default async function PaymentStatusPage({ params }: Props) {
  const { id } = params;

  const payment = await gatewayFetch<any>(`/payments/${id}`, {
    cache: 'no-store'
  }).catch(() => null);

  return (
    <div className="container space-y-4 py-10">
      <Link
        className="inline-flex w-fit items-center text-sm text-muted-foreground hover:text-foreground"
        href="/orders"
      >
        ← Back to orders
      </Link>
      <Card className="p-6 space-y-3">
        <h1 className="text-2xl font-semibold">Payment {id}</h1>
        {payment ? (
          <>
            <OrderStatusBadge status={payment.status} />
            <div className="text-muted-foreground">
              {payment.currency ?? ''} {payment.amount ?? ''}
            </div>
            <div className="text-muted-foreground">Provider: {payment.provider ?? '—'}</div>
            <div className="text-muted-foreground">Order: {payment.orderId ?? '—'}</div>
          </>
        ) : (
          <p className="text-muted-foreground">
            Unable to load payment. Ensure the payment service exposes <code>/payments/:id</code>{' '}
            via the gateway.
          </p>
        )}
      </Card>
    </div>
  );
}

