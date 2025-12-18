import { Injectable, BadGatewayException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { lastValueFrom } from 'rxjs';

import {
  CheckoutItemDto,
  CheckoutPaymentProvider,
  CheckoutRequestDto,
} from './dto/checkout-request.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateGatewayUserDto, UpdateGatewayUserDto } from './dto/user-profile.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpsertStockDto } from './dto/upsert-stock.dto';
import { AdjustmentDto } from './dto/adjustment.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';
import { IndexDocumentDto } from './dto/index-document.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { FlagReviewDto } from './dto/flag-review.dto';
import { IngestEventDto } from './dto/ingest-event.dto';
import { CreateAdminActionDto } from './dto/create-admin-action.dto';
import { UpdateAdminActionDto } from './dto/update-admin-action.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { WebpushRegistrationDto } from './dto/webpush-registration.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AuthLoginDto, RegisterVendorDto } from './dto/auth.dto';
import { UpdateProductDto } from './dto/update-product.dto';

type DownstreamService =
  | 'order'
  | 'payment'
  | 'user'
  | 'auth'
  | 'catalog'
  | 'vendor'
  | 'inventory'
  | 'shipping'
  | 'search'
  | 'review'
  | 'analytics'
  | 'admin'
  | 'notification';

interface DependencyHealth {
  service: DownstreamService;
  status: 'ok' | 'error';
  details?: unknown;
}

interface OrderResponse {
  id: string;
  status: string;
  totalAmount: number;
  currency: string;
  userId: string;
}

interface PaymentResponse {
  id: string;
  status: string;
  provider: string;
  amount: number;
  currency: string;
  orderId: string;
}

interface UserProfileResponse {
  id: string;
  email: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  addresses?: Record<string, unknown>[];
  preferences?: Record<string, unknown>;
  isActive: boolean;
}

interface VendorProfile {
  id: string;
  name: string;
  email: string;
  companyName: string;
  gstNumber?: string;
  address?: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface CatalogCategory {
  id: string;
  name: string;
  parentId?: string;
}

interface CatalogVariant {
  id: string;
  productId: string;
  sku: string;
  price: number;
  stock: number;
  attributes: { key: string; value: string }[];
}

interface CatalogProduct {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  vendorId?: string;
  basePrice: number;
  attributes: { key: string; value: string }[];
  variants: CatalogVariant[];
  status?: 'pending' | 'approved' | 'rejected';
}

interface InventoryWarehouse {
  id: string;
  name: string;
  location?: string;
}

interface InventoryAvailability {
  sku: string;
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
  warehouses: {
    warehouseId: string;
    onHand: number;
    reserved: number;
    available: number;
  }[];
}

interface Shipment {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber?: string;
  destination: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface SearchDocument {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  type: 'product' | 'category' | 'general';
  metadata: Record<string, unknown>;
}

interface Review {
  id: string;
  userId: string;
  targetId: string;
  targetType: 'product' | 'vendor';
  rating: number;
  comment?: string;
  status: 'pending' | 'approved' | 'rejected';
  flagged: boolean;
  flagReason?: string;
  moderatorNote?: string;
  createdAt: string;
  updatedAt: string;
}

interface MetricsSummary {
  summary: {
    orders: number;
    payments: number;
    shipments: number;
  };
  gmv: number;
  avgOrderValue: number;
  paymentAttempts: number;
  updatedAt: string;
}

interface AdminAction {
  id: string;
  targetType: string;
  targetId: string;
  actionType: string;
  status: string;
  note?: string;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationAccepted {
  accepted: boolean;
  channel: string;
  target: string;
  metadata?: Record<string, unknown>;
  provider_urls?: Record<string, string>;
}

const DEFAULT_SERVICE_URLS: Record<DownstreamService, string> = {
  order: 'http://localhost:3060',
  payment: 'http://localhost:3070',
  user: 'http://localhost:3020',
  auth: 'http://localhost:3010',
  catalog: 'http://localhost:3040',
  vendor: 'http://localhost:3030',
  inventory: 'http://localhost:3050',
  // shipping: 'http://localhost:3080', temporary
  shipping: 'http://localhost:4080',
  search: 'http://localhost:3120',
  analytics: 'http://localhost:3100',
  admin: 'http://localhost:3110',
  notification: 'http://localhost:3130',
  review: 'http://localhost:3090',
};

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly http: HttpService, private readonly config: ConfigService) {}

  async health() {
    const dependencies = await this.collectDependencyHealth();
    const isDegraded = dependencies.some((dep) => dep.status !== 'ok');
    return {
      service: 'gateway',
      status: isDegraded ? 'degraded' : 'ok',
      timestamp: new Date().toISOString(),
      dependencies,
    };
  }

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

    const order = await this.postToService<OrderResponse>(
      this.composeServiceUrl('order', '/orders'),
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

    const payment = await this.postToService<PaymentResponse>(
      this.composeServiceUrl('payment', '/payments'),
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

    return this.postToService<OrderResponse>(
      this.composeServiceUrl('order', '/orders'),
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
    return this.getFromService<OrderResponse[]>(
      this.composeServiceUrl('order', `/orders${query}`),
      'order service',
    );
  }

  async getOrder(id: string) {
    return this.getFromService<OrderResponse>(
      this.composeServiceUrl('order', `/orders/${id}`),
      'order service',
    );
  }

  async getOrderAggregate(orderId: string) {
    const [order, payments] = await Promise.all([
      this.getFromService<OrderResponse>(
        this.composeServiceUrl('order', `/orders/${orderId}`),
        'order service',
      ),
      this.getFromService<PaymentResponse[]>(
        this.composeServiceUrl('payment', `?orderId=${encodeURIComponent(orderId)}`),
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
    return this.getFromService<PaymentResponse[]>(
      this.composeServiceUrl('payment', query),
      'payment service',
    );
  }

  async createPayment(dto: CreatePaymentDto, user: AuthenticatedUser) {
    const payload = {
      ...dto,
      userId: dto.userId ?? user.id,
    };
    console.log("createPayment-002", payload);
    console.log("createPayment-003", this.composeServiceUrl('payment', '/payments'));
    console.log("createPayment-004", 'payment service');
    return this.postToService<PaymentResponse>(
      this.composeServiceUrl('payment', '/payments'),
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
    return this.getFromService<PaymentResponse[]>(
      this.composeServiceUrl('payment', query),
      'payment service',
    );
  }

  async getPayment(paymentId: string) {
    return this.getFromService<PaymentResponse>(
      this.composeServiceUrl('payment', `/${paymentId}`),
      'payment service',
    );
  }

  // Auth service proxies
  async vendorLogin(dto: AuthLoginDto) {
    return this.postToService(
      this.composeServiceUrl('auth', '/login'),
      dto,
      'auth service',
    );
  }

  async registerVendor(dto: RegisterVendorDto) {
    const payload = {
      ...dto,
      roles: ['vendor'],
    };
    return this.postToService(
      this.composeServiceUrl('auth', '/register'),
      payload,
      'auth service',
    );
  }

  async requestRefund(paymentId: string, dto: CreateRefundDto) {
    return this.postToService(
      this.composeServiceUrl('payment', `/${paymentId}/refund`),
      dto,
      'payment service',
    );
  }

  async listRefunds(paymentId: string) {
    return this.getFromService(
      this.composeServiceUrl('payment', `/${paymentId}/refunds`),
      'payment service',
    );
  }

  async createUser(dto: CreateGatewayUserDto) {
    return this.postToService<UserProfileResponse>(
      this.composeServiceUrl('user', '/users'),
      dto,
      'user service',
    );
  }

  async listUsers(email?: string) {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    return this.getFromService<UserProfileResponse[]>(
      this.composeServiceUrl('user', `/users${query}`),
      'user service',
    );
  }

  async getUserByEmail(email: string) {
    const users = await this.listUsers(email);
    return users?.[0] ?? null;
  }

  async getUser(id: string) {
    return this.getFromService<UserProfileResponse>(
      this.composeServiceUrl('user', `/users/${id}`),
      'user service',
    );
  }

  async updateUser(id: string, dto: UpdateGatewayUserDto) {
    return this.patchToService<UserProfileResponse>(
      this.composeServiceUrl('user', `/users/${id}`),
      dto,
      'user service',
    );
  }

  async deleteUser(id: string) {
    await this.deleteFromService(this.composeServiceUrl('user', `/users/${id}`), 'user service');
    return { deleted: true };
  }

  async getMyProfile(userId: string) {
    return this.getFromService<UserProfileResponse>(
      this.composeServiceUrl('user', `/users/${userId}`),
      'user service',
    );
  }

  async updateMyProfile(userId: string, dto: UpdateGatewayUserDto) {
    return this.patchToService<UserProfileResponse>(
      this.composeServiceUrl('user', `/users/${userId}`),
      dto,
      'user service',
    );
  }

  async createCategory(dto: CreateCategoryDto) {
    console.log('#00000000003');
    return this.postToService<CatalogCategory>(
      this.composeServiceUrl('catalog', '/categories'),
      dto,
      'catalog service',
    );
  }

  async listCategories() {
    return this.getFromService<CatalogCategory[]>(
      this.composeServiceUrl('catalog', '/categories'),
      'catalog service',
    );
  }

  async createProduct(dto: CreateProductDto, user: AuthenticatedUser) {
    const isAdmin = user.roles?.includes('admin');
    const isVendor = user.roles?.includes('vendor');
    const payload: CreateProductDto = { ...dto };

    if (isVendor && !isAdmin) {
      // Vendor cannot impersonate others; force vendorId to their user id
      payload.vendorId = user.id;
      payload.status = 'pending';
    } else if (!payload.status) {
      payload.status = 'approved';
    }

    return this.postToService<CatalogProduct>(
      this.composeServiceUrl('catalog', '/products'),
      payload,
      'catalog service',
    );
  }

  async listProducts(vendorId?: string, status?: 'pending' | 'approved' | 'rejected') {
    const params = new URLSearchParams();
    const shouldForceApprovedOnly = !vendorId;
    if (vendorId) params.append('vendorId', vendorId);
    if (status) {
      params.append('status', status);
    } else if (shouldForceApprovedOnly) {
      params.append('status', 'approved');
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.getFromService<CatalogProduct[]>(
      this.composeServiceUrl('catalog', `/products${query}`),
      'catalog service',
    );
  }

  async getProduct(id: string) {
    return this.getFromService<CatalogProduct>(
      this.composeServiceUrl('catalog', `/products/${id}`),
      'catalog service',
    );
  }

  async addVariant(productId: string, dto: CreateVariantDto, user: AuthenticatedUser) {
    const isAdmin = user.roles?.includes('admin');
    const isVendor = user.roles?.includes('vendor');

    if (isVendor && !isAdmin) {
      const product = await this.getProduct(productId);
      if (product.vendorId && product.vendorId !== user.id) {
        throw new BadGatewayException('Cannot modify another vendor product');
      }
      if (product.status && product.status !== 'approved') {
        throw new BadGatewayException('Product is not approved; cannot add variants yet');
      }
    }

    return this.postToService<CatalogVariant>(
      this.composeServiceUrl('catalog', `/products/${productId}/variants`),
      dto,
      'catalog service',
    );
  }

  async updateProduct(productId: string, dto: UpdateProductDto, user: AuthenticatedUser) {
    const isAdmin = user.roles?.includes('admin');
    const isVendor = user.roles?.includes('vendor');

    if (isVendor && !isAdmin) {
      const product = await this.getProduct(productId);
      if (product.vendorId && product.vendorId !== user.id) {
        throw new BadGatewayException('Cannot modify another vendor product');
      }
    }

    return this.patchToService<CatalogProduct>(
      this.composeServiceUrl('catalog', `/products/${productId}`),
      dto,
      'catalog service',
    );
  }

  async listVariants(productId: string) {
    return this.getFromService<CatalogVariant[]>(
      this.composeServiceUrl('catalog', `/products/${productId}/variants`),
      'catalog service',
    );
  }

  async updateProductStatus(productId: string, status: 'pending' | 'approved' | 'rejected') {
    return this.patchToService<CatalogProduct>(
      this.composeServiceUrl('catalog', `/products/${productId}/status`),
      { status },
      'catalog service',
    );
  }

  async createVendor(dto: CreateVendorDto) {
    return this.postToService<VendorProfile>(
      this.composeServiceUrl('vendor', '/vendors'),
      dto,
      'vendor service',
    );
  }

  async listVendors() {
    return this.getFromService<VendorProfile[]>(
      this.composeServiceUrl('vendor', '/vendors'),
      'vendor service',
    );
  }

  async getVendor(id: string) {
    return this.getFromService<VendorProfile>(
      this.composeServiceUrl('vendor', `/vendors/${id}`),
      'vendor service',
    );
  }

  async updateVendor(id: string, dto: UpdateVendorDto) {
    return this.patchToService<VendorProfile>(
      this.composeServiceUrl('vendor', `/vendors/${id}`),
      dto,
      'vendor service',
    );
  }

  async createWarehouse(dto: CreateWarehouseDto) {
    return this.postToService<InventoryWarehouse>(
      this.composeServiceUrl('inventory', '/warehouses'),
      dto,
      'inventory service',
    );
  }

  async listWarehouses() {
    return this.getFromService<InventoryWarehouse[]>(
      this.composeServiceUrl('inventory', '/warehouses'),
      'inventory service',
    );
  }

  async upsertStock(dto: UpsertStockDto) {
    return this.postToService(
      this.composeServiceUrl('inventory', '/inventory/stock'),
      dto,
      'inventory service',
    );
  }

  async getAvailability(sku: string) {
    return this.getFromService<InventoryAvailability>(
      this.composeServiceUrl('inventory', `/inventory/${sku}`),
      'inventory service',
    );
  }

  async reserveStock(dto: AdjustmentDto) {
    return this.postToService(
      this.composeServiceUrl('inventory', '/inventory/reserve'),
      dto,
      'inventory service',
    );
  }

  async releaseStock(dto: AdjustmentDto) {
    return this.postToService(
      this.composeServiceUrl('inventory', '/inventory/release'),
      dto,
      'inventory service',
    );
  }

  async allocateStock(dto: AdjustmentDto) {
    return this.postToService(
      this.composeServiceUrl('inventory', '/inventory/allocate'),
      dto,
      'inventory service',
    );
  }

  async createShipment(dto: CreateShipmentDto) {
    return this.postToService<Shipment>(
      this.composeServiceUrl('shipping', '/shipments'),
      dto,
      'shipping service',
    );
  }

  async listShipments(orderId?: string) {
    const query = orderId ? `?orderId=${encodeURIComponent(orderId)}` : '';
    return this.getFromService<Shipment[]>(
      this.composeServiceUrl('shipping', `/shipments${query}`),
      'shipping service',
    );
  }

  async getShipment(id: string) {
    return this.getFromService<Shipment>(
      this.composeServiceUrl('shipping', `/shipments/${id}`),
      'shipping service',
    );
  }

  async updateShipmentStatus(id: string, dto: UpdateShipmentStatusDto) {
    return this.patchToService<Shipment>(
      this.composeServiceUrl('shipping', `/shipments/${id}/status`),
      dto,
      'shipping service',
    );
  }

  async indexSearchDocument(dto: IndexDocumentDto) {
    return this.postToService<SearchDocument>(
      this.composeServiceUrl('search', '/index'),
      dto,
      'search service',
    );
  }

  async seedSearchData() {
    return this.postToService(
      this.composeServiceUrl('search', '/seed'),
      {},
      'search service',
    );
  }

  async search(dto: SearchQueryDto) {
    return this.postToService<SearchDocument[]>(
      this.composeServiceUrl('search', '/search'),
      dto,
      'search service',
    );
  }

  async getDocument(id: string) {
    return this.getFromService<SearchDocument>(
      this.composeServiceUrl('search', `/documents/${id}`),
      'search service',
    );
  }

  async createReview(dto: CreateReviewDto, userId: string) {
    return this.postToService<Review>(
      this.composeServiceUrl('review', '/reviews'),
      { ...dto, userId },
      'review service',
    );
  }

  async listReviews(targetId?: string, targetType?: 'product' | 'vendor', status?: string) {
    const params = new URLSearchParams();
    if (targetId) params.append('targetId', targetId);
    if (targetType) params.append('targetType', targetType);
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.getFromService<Review[]>(
      this.composeServiceUrl('review', `/reviews${query}`),
      'review service',
    );
  }

  async flagReview(id: string, dto: FlagReviewDto) {
    return this.patchToService<Review>(
      this.composeServiceUrl('review', `/reviews/${id}/flag`),
      dto,
      'review service',
    );
  }

  async moderateReview(id: string, dto: ModerateReviewDto) {
    return this.patchToService<Review>(
      this.composeServiceUrl('review', `/reviews/${id}/moderate`),
      dto,
      'review service',
    );
  }

  async ingestAnalyticsEvent(dto: IngestEventDto) {
    return this.postToService(
      this.composeServiceUrl('analytics', '/events'),
      dto,
      'analytics service',
    );
  }

  async analyticsMetrics() {
    return this.getFromService<MetricsSummary>(
      this.composeServiceUrl('analytics', '/metrics'),
      'analytics service',
    );
  }

  async createAdminAction(dto: CreateAdminActionDto) {
    return this.postToService<AdminAction>(
      this.composeServiceUrl('admin', '/admin/actions'),
      dto,
      'admin service',
    );
  }

  async listAdminActions(status?: string, targetType?: string) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (targetType) params.append('targetType', targetType);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.getFromService<AdminAction[]>(
      this.composeServiceUrl('admin', `/admin/actions${query}`),
      'admin service',
    );
  }

  async updateAdminAction(id: string, dto: UpdateAdminActionDto) {
    return this.patchToService<AdminAction>(
      this.composeServiceUrl('admin', `/admin/actions/${id}`),
      dto,
      'admin service',
    );
  }

  async sendNotification(dto: SendNotificationDto) {
    return this.postToService<NotificationAccepted>(
      this.composeServiceUrl('notification', '/notifications'),
      dto,
      'notification service',
    );
  }

  async registerWebpush(dto: WebpushRegistrationDto) {
    return this.postToService(
      this.composeServiceUrl('notification', '/notifications/webpush/register'),
      dto,
      'notification service',
    );
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

  private calculateTotal(items: CheckoutItemDto[]): number {
    return items.reduce((total, item) => total + item.quantity * item.price, 0);
  }

  private composeServiceUrl(service: DownstreamService, pathname: string) {
    const envKey = `${service.toUpperCase()}_SERVICE_URL`;
    const baseUrl = this.config.get<string>(envKey) ?? DEFAULT_SERVICE_URLS[service];
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
    console.log(`Composing service URL for ${service}: ${normalizedBase}/${service.toLowerCase()}${normalizedPath}`);
    return `${normalizedBase}/${service.toLowerCase()}${normalizedPath}`;
  }

  private async collectDependencyHealth(): Promise<DependencyHealth[]> {
    const services: DownstreamService[] = [
      'order',
      'payment',
      'user',
      'auth',
      'catalog',
      'vendor',
      'inventory',
      'shipping',
      'search',
      'analytics',
      'admin',
      'notification',
      'review',
    ];
    const checks = await Promise.all(
      services.map(async (service) => {
        try {
          const response = await lastValueFrom(
            this.http.get(this.composeServiceUrl(service, '/health')),
          );
          return {
            service,
            status: response.data?.status ?? 'ok',
            details: response.data,
          } satisfies DependencyHealth;
        } catch (error) {
          const message = this.extractErrorMessage(error);
          this.logger.warn(`Health check failed for ${service}: ${message}`);
          return {
            service,
            status: 'error',
            details: { message },
          } satisfies DependencyHealth;
        }
      }),
    );

    return checks;
  }

  private async postToService<T>(url: string, payload: unknown, context: string): Promise<T> {
    try {
      console.log('postToService #000000000011 => ', url);
      const response = await lastValueFrom(this.http.post<T>(url, payload));
      return response.data;
    } catch (error) {
      throw this.wrapHttpError(error, context);
    }
  }

  private async getFromService<T>(url: string, context: string): Promise<T> {
    try {
      const response = await lastValueFrom(this.http.get<T>(url));
      return response.data;
    } catch (error) {
      throw this.wrapHttpError(error, context);
    }
  }

  private async patchToService<T>(url: string, payload: unknown, context: string): Promise<T> {
    try {
      const response = await lastValueFrom(this.http.patch<T>(url, payload));
      return response.data;
    } catch (error) {
      throw this.wrapHttpError(error, context);
    }
  }

  private async deleteFromService(url: string, context: string): Promise<void> {
    try {
      await lastValueFrom(this.http.delete(url));
    } catch (error) {
      throw this.wrapHttpError(error, context);
    }
  }

  private wrapHttpError(error: unknown, context: string): BadGatewayException {
    const message = this.extractErrorMessage(error);
    const statusCode = axios.isAxiosError(error) ? error.response?.status : undefined;
    const details = axios.isAxiosError(error) ? error.response?.data : undefined;
    this.logger.error(`Failed to reach ${context}: ${message}`);
    return new BadGatewayException({
      message: `Failed to complete request via ${context}`,
      statusCode,
      details,
    });
  }

  private extractErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      return (
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.statusText ||
        error.message
      );
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown upstream error';
  }
}
