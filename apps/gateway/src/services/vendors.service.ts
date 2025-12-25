import { Injectable, Logger } from "@nestjs/common";
import { GatewayHttpService } from "./gateway-http.service";
import { CreateVendorDto } from "../dto/create-vendor.dto";
import { VendorProfile } from "../interfaces";
import { UpdateVendorDto } from "../dto/update-vendor.dto";
import { DownstreamApps } from "@app/common/enums/downstream-apps.enum";

@Injectable()
export class VendorGatewayService {
  private readonly logger = new Logger(VendorGatewayService.name);

  constructor(private readonly httpGateway: GatewayHttpService) { }
  async createVendor(dto: CreateVendorDto) {
    return this.httpGateway.post<VendorProfile>(
      this.httpGateway.composeServiceUrl(DownstreamApps.VENDOR, '/vendors'),
      dto,
      'vendor service',
    );
  }

  async listVendors() {
    return this.httpGateway.get<VendorProfile[]>(
      this.httpGateway.composeServiceUrl(DownstreamApps.VENDOR, '/vendors'),
      'vendor service',
    );
  }

  async getVendor(id: string) {
    return this.httpGateway.get<VendorProfile>(
      this.httpGateway.composeServiceUrl(DownstreamApps.VENDOR, `/vendors/${id}`),
      'vendor service',
    );
  }

  async updateVendor(id: string, dto: UpdateVendorDto) {
    return this.httpGateway.patch<VendorProfile>(
      this.httpGateway.composeServiceUrl(DownstreamApps.VENDOR, `/vendors/${id}`),
      dto,
      'vendor service',
    );
  }
}