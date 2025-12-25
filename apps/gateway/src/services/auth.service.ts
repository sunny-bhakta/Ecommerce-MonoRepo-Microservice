import { Injectable } from "@nestjs/common";
import { GatewayHttpService } from "./gateway-http.service";
import { LoginDto, RegisterUserDto } from "@app/common/dto";
import { DownstreamApps } from "@app/common/enums";

@Injectable()
export class AuthGatewayService {
    constructor(private readonly httpGateway: GatewayHttpService) {}

    async login(dto: LoginDto) {
        return this.httpGateway.post(
            this.httpGateway.composeServiceUrl(DownstreamApps.AUTH, "/login"),
            dto,
            "auth service"
        );
    }

    async register(dto: RegisterUserDto) {
        return this.httpGateway.post(
            this.httpGateway.composeServiceUrl(DownstreamApps.AUTH, "/register"),
            dto,
            "auth service"
        );
    }

    async listUsers(authHeader?: string) {
        return this.httpGateway.get(
            this.httpGateway.composeServiceUrl(DownstreamApps.AUTH, '/users'),
            'auth service',
            {
                headers: authHeader ? { Authorization: authHeader } : undefined,
            },
        );
    }

    async me(token: string) {
        return this.httpGateway.get(
            this.httpGateway.composeServiceUrl(DownstreamApps.AUTH, '/me'),
            'auth service',
            {
                headers: token ? { Authorization: `${token}` } : undefined,
            },
        );
    }

    async changePassword(token: string, dto: any) {
        console.log('Changing password via Gateway for token:', token);
        return this.httpGateway.patch(
            this.httpGateway.composeServiceUrl(DownstreamApps.AUTH, `/password`),
            dto,
            "auth service",
            {
                headers: token ? { Authorization: `${token}` } : undefined,
            }
        );
    }
}