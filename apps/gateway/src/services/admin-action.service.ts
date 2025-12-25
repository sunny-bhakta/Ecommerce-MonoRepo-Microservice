import { Injectable, Logger } from "@nestjs/common";
import { GatewayHttpService } from "./gateway-http.service";
import { CreateAdminActionDto } from "../dto/create-admin-action.dto";
import { AdminAction } from "../interfaces";
import { UpdateAdminActionDto } from "../dto/update-admin-action.dto";
import { DownstreamApps } from "@app/common/enums/downstream-apps.enum";

@Injectable()
export class AdminActionGatewayService {
  private readonly logger = new Logger(AdminActionGatewayService.name);

  constructor(private readonly httpGateway: GatewayHttpService) { }


  async createAdminAction(dto: CreateAdminActionDto) {
    return this.httpGateway.post<AdminAction>(
      this.httpGateway.composeServiceUrl(DownstreamApps.ADMIN, '/admin/actions'),
      dto,
      'admin service',
    );
  }

  async listAdminActions(status?: string, targetType?: string) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (targetType) params.append('targetType', targetType);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.httpGateway.get<AdminAction[]>(
      this.httpGateway.composeServiceUrl(DownstreamApps.ADMIN, `/admin/actions${query}`),
      'admin service',
    );
  }

  async updateAdminAction(id: string, dto: UpdateAdminActionDto) {
    return this.httpGateway.patch<AdminAction>(
      this.httpGateway.composeServiceUrl(DownstreamApps.ADMIN, `/admin/actions/${id}`),
      dto,
      'admin service',
    );
  }
}
