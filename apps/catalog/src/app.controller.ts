import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AppService } from './app.service';
import { Category, Product, Variant } from './services/shared';
import { CreateCategoryDto } from './services/category/dto/create-category.dto';
import { UpdateCategoryDto } from './services/category/dto/update-category.dto';
import { CreateProductDto } from './services/product/dto/create-product.dto';
import { CreateVariantDto } from './services/product/dto/create-variant.dto';
import { UpdateVariantDto } from './services/product/dto/update-variant.dto';
import { UpdateProductStatusDto } from './services/product/dto/update-product-status.dto';
import { UpdateProductDto } from './services/product/dto/update-product.dto';
import { ListProductsQueryDto } from './services/product/dto/list-products-query.dto';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Service health probe' })
  @ApiOkResponse({ description: 'Returns catalog service status metadata.' })
  health() {
    return this.appService.health();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a category' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiCreatedResponse({ description: 'Category created successfully.' })
  createCategory(@Body() dto: CreateCategoryDto): Promise<Category> {
    return this.appService.createCategory(dto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List categories' })
  @ApiOkResponse({ description: 'Array of categories sorted by sortIndex and name.' })
  listCategories(): Promise<Category[]> {
    return this.appService.listCategories();
  }

  @Get('categories/tree')
  @ApiOperation({ summary: 'List full category tree' })
  @ApiOkResponse({ description: 'Hierarchical category tree suitable for navigation.' })
  listCategoryTree(): Promise<Category[]> {
    return this.appService.listCategoryTree();
  }

  @Patch('categories/:categoryId')
  @ApiOperation({ summary: 'Update category metadata' })
  @ApiParam({ name: 'categoryId', description: 'Identifier of the category' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiOkResponse({ description: 'Returns the updated category.' })
  updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.appService.updateCategory(categoryId, dto);
  }

  @Post('products')
  @ApiOperation({ summary: 'Create a product with optional variants' })
  @ApiBody({ type: CreateProductDto })
  @ApiCreatedResponse({ description: 'Product created successfully.' })
  createProduct(@Body() dto: CreateProductDto): Promise<Product> {
    return this.appService.createProduct(dto);
  }

  @Get('products')
  @ApiOperation({ summary: 'List products with filtering and pagination' })
  @ApiOkResponse({ description: 'Returns the requested page of products.' })
  @ApiQuery({ name: 'vendorId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'updatedAt', 'name', 'basePrice'] })
  @ApiQuery({ name: 'sortDir', required: false, enum: ['asc', 'desc'] })
  async listProducts(
    @Query() query: ListProductsQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Product[]> {
    const result = await this.appService.listProducts(query);
    res.setHeader('X-Total-Count', result.total.toString());
    res.setHeader('X-Page', result.page.toString());
    res.setHeader('X-Limit', result.limit.toString());
    res.setHeader('X-Has-Next', String(result.hasNext));
    return result.items;
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get a single product' })
  @ApiParam({ name: 'id', description: 'Product identifier' })
  @ApiOkResponse({ description: 'Returns the requested product if it exists.' })
  getProduct(@Param('id') id: string): Promise<Product> {
    return this.appService.getProduct(id);
  }

  @Patch('products/:productId')
  @ApiOperation({ summary: 'Update product metadata/options' })
  @ApiParam({ name: 'productId', description: 'Product identifier' })
  @ApiBody({ type: UpdateProductDto })
  @ApiOkResponse({ description: 'Returns the updated product.' })
  updateProduct(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
  ): Promise<Product> {
    return this.appService.updateProduct(productId, dto);
  }

  @Post('products/:productId/variants')
  @ApiOperation({ summary: 'Create a variant for a product' })
  @ApiParam({ name: 'productId', description: 'Product identifier' })
  @ApiBody({ type: CreateVariantDto })
  @ApiCreatedResponse({ description: 'Variant created successfully.' })
  addVariant(
    @Param('productId') productId: string,
    @Body() dto: CreateVariantDto,
  ): Promise<Variant> {
    return this.appService.addVariant(productId, dto);
  }

  @Patch('products/:productId/variants/:variantId')
  @ApiOperation({ summary: 'Update an existing variant' })
  @ApiParam({ name: 'productId', description: 'Product identifier' })
  @ApiParam({ name: 'variantId', description: 'Variant identifier' })
  @ApiBody({ type: UpdateVariantDto })
  @ApiOkResponse({ description: 'Returns the updated variant.' })
  updateVariant(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ): Promise<Variant> {
    return this.appService.updateVariant(productId, variantId, dto);
  }

  @Delete('products/:productId/variants/:variantId')
  @ApiOperation({ summary: 'Delete a variant' })
  @ApiParam({ name: 'productId', description: 'Product identifier' })
  @ApiParam({ name: 'variantId', description: 'Variant identifier' })
  @ApiOkResponse({ description: 'Returns the deleted variant.' })
  deleteVariant(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ): Promise<Variant> {
    return this.appService.deleteVariant(productId, variantId);
  }

  @Get('products/:productId/variants')
  @ApiOperation({ summary: 'List variants for a product' })
  @ApiParam({ name: 'productId', description: 'Product identifier' })
  @ApiOkResponse({ description: 'Array of variants for the product.' })
  listVariants(@Param('productId') productId: string): Promise<Variant[]> {
    return this.appService.listVariants(productId);
  }

  @Patch('products/:productId/status')
  @ApiOperation({ summary: 'Update product moderation status' })
  @ApiParam({ name: 'productId', description: 'Product identifier' })
  @ApiBody({ type: UpdateProductStatusDto })
  @ApiOkResponse({ description: 'Returns the product with updated status.' })
  updateProductStatus(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductStatusDto,
  ): Promise<Product> {
    return this.appService.updateProductStatus(productId, dto.status);
  }


}
