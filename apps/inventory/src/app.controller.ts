import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { AdjustmentDto } from './dto/adjustment.dto';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpsertStockDto } from './dto/upsert-stock.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return this.appService.health();
  }

  @Post('warehouses')
  createWarehouse(@Body() dto: CreateWarehouseDto) {
    return this.appService.createWarehouse(dto);
  }

  @Get('warehouses')
  listWarehouses() {
    return this.appService.listWarehouses();
  }

  @Post('inventory/stock')
  upsertStock(@Body() dto: UpsertStockDto) {
    return this.appService.upsertStock(dto);
  }

  @Get('inventory/:sku')
  getAvailability(@Param('sku') sku: string) {
    return this.appService.getAvailability(sku);
  }

  @Post('inventory/reserve')
  reserve(@Body() dto: AdjustmentDto) {
    return this.appService.reserve(dto);
  }

  @Post('inventory/release')
  release(@Body() dto: AdjustmentDto) {
    return this.appService.release(dto);
  }

  @Post('inventory/allocate')
  allocate(@Body() dto: AdjustmentDto) {
    return this.appService.allocate(dto);
  }
}
