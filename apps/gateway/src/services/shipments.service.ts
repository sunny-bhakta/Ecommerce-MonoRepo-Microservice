import { Injectable, Logger } from "@nestjs/common";
import { GatewayHttpService } from "./gateway-http.service";
import { Shipment } from "../interfaces";
import { UpdateShipmentStatusDto } from "../dto/update-shipment-status.dto";
import { CreateShipmentDto } from "../dto/create-shipment.dto";
import { DownstreamApps } from "@app/common/enums/downstream-apps.enum";

@Injectable()
export class ShipmentGatewayService {
  private readonly logger = new Logger(ShipmentGatewayService.name);

  constructor(private readonly httpGateway: GatewayHttpService) { }

  async createShipment(dto: CreateShipmentDto) {
    return this.httpGateway.post<Shipment>(
      this.httpGateway.composeServiceUrl(DownstreamApps.SHIPPING, '/shipments'),
      dto,
      'shipping service',
    );
  }

  async listShipments(orderId?: string) {
    const query = orderId ? `?orderId=${encodeURIComponent(orderId)}` : '';
    return this.httpGateway.get<Shipment[]>(
      this.httpGateway.composeServiceUrl(DownstreamApps.SHIPPING, `/shipments${query}`),
      'shipping service',
    );
  }

  async getShipment(id: string) {
    return this.httpGateway.get<Shipment>(
      this.httpGateway.composeServiceUrl(DownstreamApps.SHIPPING, `/shipments/${id}`),
      'shipping service',
    );
  }

  async updateShipmentStatus(id: string, dto: UpdateShipmentStatusDto) {
    return this.httpGateway.patch<Shipment>(
      this.httpGateway.composeServiceUrl(DownstreamApps.SHIPPING, `/shipments/${id}/status`),
      dto,
      'shipping service',
    );
  }
}