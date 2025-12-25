import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { GatewayAuthGuard } from '../guards/gateway-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UpsertStockDto } from '../dto/upsert-stock.dto';
import { AdjustmentDto } from '../dto/adjustment.dto';
import { CreateWarehouseDto } from '../dto/create-warehouse.dto';
import { InventoryGatewayService } from '../services/inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryGatewayService) { }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('stock')
  upsertStock(@Body() dto: UpsertStockDto) {
    return this.inventoryService.upsertStock(dto);
  }

  @Get(':sku')
  getAvailability(@Param('sku') sku: string) {
    return this.inventoryService.getAvailability(sku);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('reserve')
  reserve(@Body() dto: AdjustmentDto) {
    return this.inventoryService.reserveStock(dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('release')
  release(@Body() dto: AdjustmentDto) {
    return this.inventoryService.releaseStock(dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('allocate')
  allocate(@Body() dto: AdjustmentDto) {
    return this.inventoryService.allocateStock(dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  createWarehouse(@Body() dto: CreateWarehouseDto) {
    return this.inventoryService.createWarehouse(dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  listWarehouses() {
    return this.inventoryService.listWarehouses();
  }
}