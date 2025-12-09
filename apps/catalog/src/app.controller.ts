import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';

@Controller()
export class CatalogController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return this.appService.health();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.appService.createCategory(dto);
  }

  @Get('categories')
  listCategories() {
    return this.appService.listCategories();
  }

  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.appService.createProduct(dto);
  }

  @Get('products')
  listProducts() {
    return this.appService.listProducts();
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.appService.getProduct(id);
  }

  @Post('products/:productId/variants')
  addVariant(@Param('productId') productId: string, @Body() dto: CreateVariantDto) {
    return this.appService.addVariant(productId, dto);
  }

  @Get('products/:productId/variants')
  listVariants(@Param('productId') productId: string) {
    return this.appService.listVariants(productId);
  }
}
