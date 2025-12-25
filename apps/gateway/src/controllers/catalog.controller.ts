import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GatewayAuthGuard } from '../guards/gateway-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CreateProductDto } from '../dto/create-product.dto';
import { CreateVariantDto } from '../dto/create-variant.dto';
import { UpdateProductStatusDto } from '../dto/update-product-status.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthenticatedUser } from '../interfaces/auth.interface';
import { CatalogGatewayService } from '../services/catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogGatewayService) {}

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto): Promise<unknown> {
    return this.catalogService.createCategory(dto);
  }

  @Get('categories')
  listCategories(): Promise<unknown> {
    return this.catalogService.listCategories();
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin', 'vendor')
  @Post('products')
  createProduct(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<unknown> {
    return this.catalogService.createProduct(dto, user);
  }

  @Get('products')
  listProducts(
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: 'pending' | 'approved' | 'rejected',
  ): Promise<unknown> {
    return this.catalogService.listProducts(vendorId, status);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('vendor')
  @Get('my-products')
  listMyProducts(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: 'pending' | 'approved' | 'rejected',
  ): Promise<unknown> {
    return this.catalogService.listProducts(user.id, status);
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string): Promise<unknown> {
    return this.catalogService.getProduct(id);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin', 'vendor')
  @Patch('products/:productId')
  updateProduct(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<unknown> {
    return this.catalogService.updateProduct(productId, dto, user);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin', 'vendor')
  @Post('products/:productId/variants')
  addVariant(
    @Param('productId') productId: string,
    @Body() dto: CreateVariantDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<unknown> {
    return this.catalogService.addVariant(productId, dto, user);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('products/:productId/status')
  updateProductStatus(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductStatusDto,
  ): Promise<unknown> {
    return this.catalogService.updateProductStatus(productId, dto);
  }

  @Get('products/:productId/variants')
  listVariants(@Param('productId') productId: string): Promise<unknown> {
    return this.catalogService.listVariants(productId);
  }
}