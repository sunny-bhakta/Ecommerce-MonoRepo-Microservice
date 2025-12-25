import { Injectable } from "@nestjs/common";
import { GatewayHttpService } from "./gateway-http.service";
import { CheckoutItemDto, CheckoutPaymentProvider, CheckoutRequestDto } from "../dto/checkout-request.dto";
import { AuthenticatedUser, OrderResponse, PaymentResponse } from "../interfaces";
import { CreateOrderDto } from "../dto/create-order.dto";
import { DownstreamApps } from "@app/common/enums/downstream-apps.enum";

@Injectable()
export class OrdersGatewayService {
  constructor(
    private readonly httpGateway: GatewayHttpService
  ) { }

  async checkout(dto: CheckoutRequestDto, user: AuthenticatedUser) {
    const totalAmount = dto.totalAmount ?? this.calculateTotal(dto.items);
    const userId = user.id;

    const orderPayload = {
      userId,
      currency: dto.currency,
      totalAmount,
      notes: dto.notes,
      shippingAddress: dto.shippingAddress,
      items: dto.items,
    };

    const order = await this.httpGateway.post<OrderResponse>(
      this.httpGateway.composeServiceUrl(DownstreamApps.ORDER, '/orders'),
      orderPayload,
      'order service',
    );

    const paymentPayload = {
      orderId: order.id,
      userId,
      amount: totalAmount,
      currency: dto.currency,
      provider: dto.paymentProvider ?? CheckoutPaymentProvider.RAZORPAY,
    };

    const payment = await this.httpGateway.post<PaymentResponse>(
      this.httpGateway.composeServiceUrl(DownstreamApps.PAYMENT, '/payments'),
      paymentPayload,
      'payment service',
    );

    return {
      order,
      payment,
      nextSteps: this.describeNextSteps(payment.status),
    };
  }

  async createOrder(dto: CreateOrderDto, user: AuthenticatedUser) {
    const isAdmin = user.roles?.includes('admin');
    const isVendor = user.roles?.includes('vendor');
    const totalAmount = dto.totalAmount ?? this.calculateTotal(dto.items);

    const normalizedItems = dto.items.map((item) =>
      isVendor && !isAdmin ? { ...item, vendorId: user.id } : item,
    );

    const payload = {
      ...dto,
      totalAmount,
      userId: dto.userId ?? user.id,
      shippingAddress: dto.shippingAddress,
      items: normalizedItems,
    };

    return this.httpGateway.post<OrderResponse>(
      this.httpGateway.composeServiceUrl(DownstreamApps.ORDER, '/orders'),
      payload,
      'order service',
    );
  }

  async listOrders(requestingUser: AuthenticatedUser, userId?: string, vendorId?: string) {
    const isAdmin = requestingUser.roles?.includes('admin');
    const isVendor = requestingUser.roles?.includes('vendor');
    const resolvedUserId = isAdmin && userId ? userId : requestingUser.id;

    const params = new URLSearchParams();
    if (resolvedUserId) {
      params.append('userId', resolvedUserId);
    }

    if (isVendor && !isAdmin) {
      params.append('vendorId', requestingUser.id);
    } else if (vendorId) {
      params.append('vendorId', vendorId);
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.httpGateway.get<OrderResponse[]>(
      this.httpGateway.composeServiceUrl(DownstreamApps.ORDER, `/orders${query}`),
      'order service',
    );
  }

  async getOrder(id: string) {
    return this.httpGateway.get<OrderResponse>(
      this.httpGateway.composeServiceUrl(DownstreamApps.ORDER, `/orders/${id}`),
      'order service',
    );
  }

  async getOrderAggregate(orderId: string) {
    const [order, payments] = await Promise.all([
      this.httpGateway.get<OrderResponse>(
        this.httpGateway.composeServiceUrl(DownstreamApps.ORDER, `/orders/${orderId}`),
        'order service',
      ),
      this.httpGateway.get<PaymentResponse[]>(
        this.httpGateway.composeServiceUrl(DownstreamApps.PAYMENT, `?orderId=${encodeURIComponent(orderId)}`),
        'payment service',
      ),
    ]);

    return {
      order,
      payments,
    };
  }

  async listOrderPayments(orderId: string, user: AuthenticatedUser) {
    const params = new URLSearchParams({ orderId });
    if (user?.id) {
      params.append('userId', user.id);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.httpGateway.get<PaymentResponse[]>(
      this.httpGateway.composeServiceUrl(DownstreamApps.PAYMENT, query),
      'payment service',
    );
  }

  private calculateTotal(items: CheckoutItemDto[]): number {
    return items.reduce((total, item) => total + item.quantity * item.price, 0);
  }

  private describeNextSteps(paymentStatus?: string) {
    if (!paymentStatus) {
      return 'await_payment_status';
    }
    switch (paymentStatus.toLowerCase()) {
      case 'succeeded':
        return 'order_confirmed';
      case 'failed':
        return 'retry_payment';
      case 'processing':
      case 'pending':
      default:
        return 'await_payment_confirmation';
    }
  }
}