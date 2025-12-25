import { Injectable, Logger } from "@nestjs/common";
import { GatewayHttpService } from "./gateway-http.service";
import { CreateWarehouseDto } from "../dto/create-warehouse.dto";
import { InventoryAvailability, InventoryWarehouse, InventoryStock } from "../interfaces";
import { UpsertStockDto } from "../dto/upsert-stock.dto";
import { AdjustmentDto } from "../dto/adjustment.dto";
import { DownstreamApps } from "@app/common/enums/downstream-apps.enum";

@Injectable()
export class InventoryGatewayService {
  private readonly logger = new Logger(InventoryGatewayService.name);

  constructor(private readonly httpGateway: GatewayHttpService) { }









  async createWarehouse(dto: CreateWarehouseDto) {
    return this.httpGateway.post<InventoryWarehouse>(
      this.httpGateway.composeServiceUrl(DownstreamApps.INVENTORY, '/warehouses'),
      dto,
      'inventory service',
    );
  }

  async listWarehouses() {
    return this.httpGateway.get<InventoryWarehouse[]>(
      this.httpGateway.composeServiceUrl(DownstreamApps.INVENTORY, '/warehouses'),
      'inventory service',
    );
  }

  async upsertStock(dto: UpsertStockDto) {
    return this.httpGateway.post<InventoryStock>(
      this.httpGateway.composeServiceUrl(DownstreamApps.INVENTORY, '/inventory/stock'),
      dto,
      'inventory service',
    );
  }

  async getAvailability(sku: string) {
    return this.httpGateway.get<InventoryAvailability>(
      this.httpGateway.composeServiceUrl(DownstreamApps.INVENTORY, `/inventory/${sku}`),
      'inventory service',
    );
  }

  async reserveStock(dto: AdjustmentDto) {
    return this.httpGateway.post<InventoryStock>(
      this.httpGateway.composeServiceUrl(DownstreamApps.INVENTORY, '/inventory/reserve'),
      dto,
      'inventory service',
    );
  }

  async releaseStock(dto: AdjustmentDto) {
    return this.httpGateway.post<InventoryStock>(
      this.httpGateway.composeServiceUrl(DownstreamApps.INVENTORY, '/inventory/release'),
      dto,
      'inventory service',
    );
  }

  async allocateStock(dto: AdjustmentDto) {
    return this.httpGateway.post<InventoryStock>(
      this.httpGateway.composeServiceUrl(DownstreamApps.INVENTORY, '/inventory/allocate'),
      dto,
      'inventory service',
    );
  }
}