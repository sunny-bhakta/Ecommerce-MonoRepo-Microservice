import { Injectable } from "@nestjs/common";
import { GatewayHttpService } from "./gateway-http.service";
import { AuthenticatedUser, PaymentResponse } from "../interfaces";
import { CreatePaymentDto } from "../dto/create-payment.dto";
import { CreateRefundDto } from "../dto/create-refund.dto";
import { DownstreamApps } from "@app/common/enums/downstream-apps.enum";

@Injectable()
export class PaymentGatewayService {
  constructor(
    private readonly httpGateway: GatewayHttpService
  ) { }

  async createPayment(dto: CreatePaymentDto, user: AuthenticatedUser) {
    const payload = {
      ...dto,
      userId: dto.userId ?? user.id,
    };
    
    return this.httpGateway.post<PaymentResponse>(
      this.httpGateway.composeServiceUrl(DownstreamApps.PAYMENT, '/payments'),
      payload,
      'payment service',
    );
  }

  async listPayments(requestingUser: AuthenticatedUser, orderId?: string, userId?: string) {
    const params = new URLSearchParams();
    if (orderId) params.append('orderId', orderId);
    if (requestingUser?.roles?.includes('admin')) {
      if (userId) params.append('userId', userId);
    } else if (requestingUser?.id) {
      params.append('userId', requestingUser.id);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.httpGateway.get<PaymentResponse[]>(
      this.httpGateway.composeServiceUrl(DownstreamApps.PAYMENT, `/payments${query}`),
      'payment service',
    );
  }

  async requestRefund(paymentId: string, dto: CreateRefundDto) {
    return this.httpGateway.post(
      this.httpGateway.composeServiceUrl(DownstreamApps.PAYMENT, `/${paymentId}/refund`),
      dto,
      'payment service',
    );
  }

  async listRefunds(paymentId: string) {
    return this.httpGateway.get(
      this.httpGateway.composeServiceUrl(DownstreamApps.PAYMENT, `/${paymentId}/refunds`),
      'payment service',
    );
  }
  async getPayment(paymentId: string) {
    return this.httpGateway.get<PaymentResponse>(
      this.httpGateway.composeServiceUrl(DownstreamApps.PAYMENT, `/${paymentId}`),
      'payment service',
    );
  }
}