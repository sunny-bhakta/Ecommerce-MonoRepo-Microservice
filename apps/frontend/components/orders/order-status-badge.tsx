import { Badge } from '@/components/ui/badge';

const toneByStatus: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  completed: 'success',
  paid: 'success',
  delivered: 'success',
  pending: 'warning',
  processing: 'warning',
  refunded: 'warning',
  canceled: 'destructive',
  failed: 'destructive'
};

export default function OrderStatusBadge({ status }: { status?: string }) {
  const tone = status ? toneByStatus[status.toLowerCase()] : 'secondary';
  return <Badge variant={tone}>{status ?? 'unknown'}</Badge>;
}

