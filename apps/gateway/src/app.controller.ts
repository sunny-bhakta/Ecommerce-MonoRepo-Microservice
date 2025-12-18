import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { CheckoutRequestDto } from './dto/checkout-request.dto';
import { CreateGatewayUserDto, UpdateGatewayUserDto } from './dto/user-profile.dto';
import { GatewayAuthGuard } from './guards/gateway-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
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
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AuthLoginDto, RegisterVendorDto } from './dto/auth.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller()
export class GatewayController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health(): Promise<unknown> {
    return this.appService.health();
  }

  @Post('auth/vendor/register')
  registerVendor(@Body() dto: RegisterVendorDto): Promise<unknown> {
    return this.appService.registerVendor(dto);
  }

  @Post('auth/vendor/login')
  vendorLogin(@Body() dto: AuthLoginDto): Promise<unknown> {
    return this.appService.vendorLogin(dto);
  }

  @UseGuards(GatewayAuthGuard)
  @Post('checkout')
  checkout(@Body() dto: CheckoutRequestDto, @CurrentUser() user: AuthenticatedUser): Promise<unknown> {
    return this.appService.checkout(dto, user);
  }

  @UseGuards(GatewayAuthGuard)
  @Post('orders')
  createOrder(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthenticatedUser): Promise<unknown> {
    return this.appService.createOrder(dto, user);
  }

  @UseGuards(GatewayAuthGuard)
  @Get('orders')
  listOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query('userId') userId?: string,
    @Query('vendorId') vendorId?: string,
  ): Promise<unknown> {
    return this.appService.listOrders(user, userId, vendorId);
  }

  @UseGuards(GatewayAuthGuard)
  @Get('orders/:orderId/summary')
  getOrderSummary(@Param('orderId') orderId: string): Promise<unknown> {
    return this.appService.getOrderAggregate(orderId);
  }

  @UseGuards(GatewayAuthGuard)
  @Get('orders/:id')
  getOrder(@Param('id') id: string): Promise<unknown> {
    return this.appService.getOrder(id);
  }

  @UseGuards(GatewayAuthGuard)
  @Get('orders/:orderId/payments')
  listOrderPayments(
    @Param('orderId') orderId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<unknown> {
    return this.appService.listOrderPayments(orderId, user);
  }

  @UseGuards(GatewayAuthGuard)
  @Get('orders/:orderId/payments/:paymentId')
  getOrderPayment(@Param('paymentId') paymentId: string): Promise<unknown> {
    return this.appService.getPayment(paymentId);
  }

  @UseGuards(GatewayAuthGuard)
  @Post('orders/:orderId/payments/:paymentId/refunds')
  requestRefund(
    @Param('paymentId') paymentId: string,
    @Body() dto: CreateRefundDto,
  ): Promise<unknown> {
    return this.appService.requestRefund(paymentId, dto);
  }

  @UseGuards(GatewayAuthGuard)
  @Get('orders/:orderId/payments/:paymentId/refunds')
  listRefunds(@Param('paymentId') paymentId: string): Promise<unknown> {
    return this.appService.listRefunds(paymentId);
  }

  // Payment service direct routes
  @UseGuards(GatewayAuthGuard)
  @Post('payment/payments')
  createPayment(
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<unknown> {
    // this.logger.log("createPayment-001", dto, user);
    console.log("createPayment-001", dto, user);
    return this.appService.createPayment(dto, user);
  }

  @UseGuards(GatewayAuthGuard)
  @Get('payment/payments')
  listPayments(
    @CurrentUser() user: AuthenticatedUser,
    @Query('orderId') orderId?: string,
    @Query('userId') userId?: string,
  ): Promise<unknown> {
    return this.appService.listPayments(user, orderId, userId);
  }

  @UseGuards(GatewayAuthGuard)
  @Get('payment/payments/:paymentId')
  getPayment(@Param('paymentId') paymentId: string): Promise<unknown> {
    return this.appService.getPayment(paymentId);
  }

  @UseGuards(GatewayAuthGuard)
  @Post('payment/payments/:paymentId/refund')
  refundPayment(
    @Param('paymentId') paymentId: string,
    @Body() dto: CreateRefundDto,
  ): Promise<unknown> {
    return this.appService.requestRefund(paymentId, dto);
  }

  @UseGuards(GatewayAuthGuard)
  @Get('payment/payments/:paymentId/refunds')
  listPaymentRefunds(@Param('paymentId') paymentId: string): Promise<unknown> {
    return this.appService.listRefunds(paymentId);
  }

  @UseGuards(GatewayAuthGuard)
  @Get('me/profile')
  getMyProfile(@CurrentUser() user: AuthenticatedUser): Promise<unknown> {
    return this.appService.getMyProfile(user.id);
  }

  @UseGuards(GatewayAuthGuard)
  @Patch('me/profile')
  updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateGatewayUserDto,
  ): Promise<unknown> {
    return this.appService.updateMyProfile(user.id, dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('users')
  createUser(@Body() dto: CreateGatewayUserDto): Promise<unknown> {
    return this.appService.createUser(dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('users')
  listUsers(@Query('email') email?: string): Promise<unknown> {
    return this.appService.listUsers(email);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('users/email/:email')
  getUserByEmail(@Param('email') email: string): Promise<unknown> {
    return this.appService.getUserByEmail(email);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('users/:id')
  getUser(@Param('id') id: string): Promise<unknown> {
    return this.appService.getUser(id);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateGatewayUserDto): Promise<unknown> {
    return this.appService.updateUser(id, dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('users/:id')
  deleteUser(@Param('id') id: string): Promise<unknown> {
    return this.appService.deleteUser(id);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('catalog/categories')
  createCategory(@Body() dto: CreateCategoryDto): Promise<unknown> {
    return this.appService.createCategory(dto);
  }

  @Get('catalog/categories')
  listCategories(): Promise<unknown> {
    return this.appService.listCategories();
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin', 'vendor')
  @Post('catalog/products')
  createProduct(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<unknown> {
    return this.appService.createProduct(dto, user);
  }

  @Get('catalog/products')
  listProducts(
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: 'pending' | 'approved' | 'rejected',
  ): Promise<unknown> {
    return this.appService.listProducts(vendorId, status);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('vendor')
  @Get('catalog/my-products')
  listMyProducts(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: 'pending' | 'approved' | 'rejected',
  ): Promise<unknown> {
    return this.appService.listProducts(user.id, status);
  }

  @Get('catalog/products/:id')
  getProduct(@Param('id') id: string): Promise<unknown> {
    return this.appService.getProduct(id);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin', 'vendor')
  @Patch('catalog/products/:productId')
  updateProduct(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<unknown> {
    return this.appService.updateProduct(productId, dto, user);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin', 'vendor')
  @Post('catalog/products/:productId/variants')
  addVariant(
    @Param('productId') productId: string,
    @Body() dto: CreateVariantDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<unknown> {
    return this.appService.addVariant(productId, dto, user);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('catalog/products/:productId/status')
  updateProductStatus(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductStatusDto,
  ): Promise<unknown> {
    return this.appService.updateProductStatus(productId, dto.status);
  }

  @Get('catalog/products/:productId/variants')
  listVariants(@Param('productId') productId: string): Promise<unknown> {
    return this.appService.listVariants(productId);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('vendors')
  createVendor(@Body() dto: CreateVendorDto): Promise<unknown> {
    return this.appService.createVendor(dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('vendors')
  listVendors(): Promise<unknown> {
    return this.appService.listVendors();
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('vendors/:id')
  getVendor(@Param('id') id: string): Promise<unknown> {
    return this.appService.getVendor(id);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('vendors/:id')
  updateVendor(@Param('id') id: string, @Body() dto: UpdateVendorDto): Promise<unknown> {
    return this.appService.updateVendor(id, dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('warehouses')
  createWarehouse(@Body() dto: CreateWarehouseDto): Promise<unknown> {
    return this.appService.createWarehouse(dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('warehouses')
  listWarehouses(): Promise<unknown> {
    return this.appService.listWarehouses();
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('inventory/stock')
  upsertStock(@Body() dto: UpsertStockDto): Promise<unknown> {
    return this.appService.upsertStock(dto);
  }

  @Get('inventory/:sku')
  getAvailability(@Param('sku') sku: string): Promise<unknown> {
    return this.appService.getAvailability(sku);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('inventory/reserve')
  reserve(@Body() dto: AdjustmentDto): Promise<unknown> {
    return this.appService.reserveStock(dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('inventory/release')
  release(@Body() dto: AdjustmentDto): Promise<unknown> {
    return this.appService.releaseStock(dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('inventory/allocate')
  allocate(@Body() dto: AdjustmentDto): Promise<unknown> {
    return this.appService.allocateStock(dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('shipments')
  createShipment(@Body() dto: CreateShipmentDto): Promise<unknown> {
    return this.appService.createShipment(dto);
  }

  @UseGuards(GatewayAuthGuard)
  @Get('orders/:orderId/shipments')
  listShipmentsForOrder(@Param('orderId') orderId: string): Promise<unknown> {
    return this.appService.listShipments(orderId);
  }

  @Get('shipments')
  listShipments(@Query('orderId') orderId?: string): Promise<unknown> {
    return this.appService.listShipments(orderId);
  }

  @Get('shipments/:id')
  getShipment(@Param('id') id: string): Promise<unknown> {
    return this.appService.getShipment(id);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('shipments/:id/status')
  updateShipmentStatus(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentStatusDto,
  ): Promise<unknown> {
    return this.appService.updateShipmentStatus(id, dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('search/index')
  indexDocument(@Body() dto: IndexDocumentDto): Promise<unknown> {
    return this.appService.indexSearchDocument(dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('search/seed')
  seedSearch(): Promise<unknown> {
    return this.appService.seedSearchData();
  }

  @Post('search/query')
  search(@Body() dto: SearchQueryDto): Promise<unknown> {
    return this.appService.search(dto);
  }

  @Get('search/documents/:id')
  getDocument(@Param('id') id: string): Promise<unknown> {
    return this.appService.getDocument(id);
  }

  @UseGuards(GatewayAuthGuard)
  @Post('reviews')
  createReview(@Body() dto: CreateReviewDto, @CurrentUser() user: AuthenticatedUser): Promise<unknown> {
    return this.appService.createReview(dto, user.id);
  }

  @Get('reviews')
  listReviews(
    @Query('targetId') targetId?: string,
    @Query('targetType') targetType?: 'product' | 'vendor',
    @Query('status') status?: string,
  ): Promise<unknown> {
    return this.appService.listReviews(targetId, targetType, status);
  }

  @UseGuards(GatewayAuthGuard)
  @Patch('reviews/:id/flag')
  flagReview(@Param('id') id: string, @Body() dto: FlagReviewDto): Promise<unknown> {
    return this.appService.flagReview(id, dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('reviews/:id/moderate')
  moderateReview(
    @Param('id') id: string,
    @Body() dto: ModerateReviewDto,
  ): Promise<unknown> {
    return this.appService.moderateReview(id, dto);
  }

  @UseGuards(GatewayAuthGuard)
  @Post('analytics/events')
  ingestAnalytics(@Body() dto: IngestEventDto): Promise<unknown> {
    return this.appService.ingestAnalyticsEvent(dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('analytics/metrics')
  analyticsMetrics(): Promise<unknown> {
    return this.appService.analyticsMetrics();
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/actions')
  createAdminAction(@Body() dto: CreateAdminActionDto): Promise<unknown> {
    return this.appService.createAdminAction(dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/actions')
  listAdminActions(
    @Query('status') status?: string,
    @Query('targetType')
    targetType?: 'user' | 'vendor' | 'catalog' | 'order' | 'payment' | 'review',
  ): Promise<unknown> {
    return this.appService.listAdminActions(status, targetType);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/actions/:id')
  updateAdminAction(
    @Param('id') id: string,
    @Body() dto: UpdateAdminActionDto,
  ): Promise<unknown> {
    return this.appService.updateAdminAction(id, dto);
  }

  @UseGuards(GatewayAuthGuard)
  @Post('notifications')
  sendNotification(@Body() dto: SendNotificationDto): Promise<unknown> {
    return this.appService.sendNotification(dto);
  }

  @UseGuards(GatewayAuthGuard)
  @Post('notifications/webpush/register')
  registerWebpush(@Body() dto: WebpushRegistrationDto): Promise<unknown> {
    return this.appService.registerWebpush(dto);
  }
}
