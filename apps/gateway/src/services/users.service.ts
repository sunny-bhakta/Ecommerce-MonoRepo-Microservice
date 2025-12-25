import { Injectable, Logger } from "@nestjs/common";
import { GatewayHttpService } from "./gateway-http.service";
import { CreateGatewayUserDto, UpdateGatewayUserDto } from "../dto/user-profile.dto";
import { UserProfileResponse } from "../interfaces";
import { DownstreamApps } from "@app/common/enums/downstream-apps.enum";

@Injectable()
export class UserGatewayService {
  private readonly logger = new Logger(UserGatewayService.name);

  constructor(private readonly httpGateway: GatewayHttpService) { }

  async createUser(dto: CreateGatewayUserDto) {
    return this.httpGateway.post<UserProfileResponse>(
      this.httpGateway.composeServiceUrl(DownstreamApps.USER, '/users'),
      dto,
      'user service',
    );
  }

  async listUsers(email?: string) {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    return this.httpGateway.get<UserProfileResponse[]>(
      this.httpGateway.composeServiceUrl(DownstreamApps.USER, `/users${query}`),
      'user service',
    );
  }

  async getUserByEmail(email: string) {
    const users = await this.listUsers(email);
    return users?.[0] ?? null;
  }

  async getUser(id: string) {
    return this.httpGateway.get<UserProfileResponse>(
      this.httpGateway.composeServiceUrl(DownstreamApps.USER, `/users/${id}`),
      'user service',
    );
  }

  async updateUser(id: string, dto: UpdateGatewayUserDto) {
    return this.httpGateway.patch<UserProfileResponse>(
      this.httpGateway.composeServiceUrl(DownstreamApps.USER, `/users/${id}`),
      dto,
      'user service',
    );
  }

  async deleteUser(id: string) {
    await this.httpGateway.delete(this.httpGateway.composeServiceUrl(DownstreamApps.USER, `/users/${id}`), 'user service');
    return { deleted: true };
  }

  async getMyProfile(userId: string) {
    return this.httpGateway.get<UserProfileResponse>(
      this.httpGateway.composeServiceUrl(DownstreamApps.USER, `/users/${userId}`),
      'user service',
    );
  }

  async updateMyProfile(userId: string, dto: UpdateGatewayUserDto) {
    return this.httpGateway.patch<UserProfileResponse>(
      this.httpGateway.composeServiceUrl(DownstreamApps.USER, `/users/${userId}`),
      dto,
      'user service',
    );
  }
}