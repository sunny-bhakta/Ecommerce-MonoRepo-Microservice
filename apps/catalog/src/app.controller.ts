import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService, Category, Product, Variant } from './app.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return this.appService.health();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto): Promise<Category> {
    return this.appService.createCategory(dto);
  }

  @Get('categories')
  listCategories(): Promise<Category[]> {
    return this.appService.listCategories();
  }

  @Post('products')
  createProduct(@Body() dto: CreateProductDto): Promise<Product> {
    return this.appService.createProduct(dto);
  }

  @Get('products')
  listProducts(): Promise<Product[]> {
    return this.appService.listProducts();
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string): Promise<Product> {
    return this.appService.getProduct(id);
  }

  @Post('products/:productId/variants')
  addVariant(
    @Param('productId') productId: string,
    @Body() dto: CreateVariantDto,
  ): Promise<Variant> {
    return this.appService.addVariant(productId, dto);
  }

  @Get('products/:productId/variants')
  listVariants(@Param('productId') productId: string): Promise<Variant[]> {
    return this.appService.listVariants(productId);
  }
}
