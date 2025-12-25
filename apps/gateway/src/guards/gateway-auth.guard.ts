import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

import { AuthClientGatewayService } from '../services/auth-client.service';
import { AuthenticatedUser } from '../interfaces/auth.interface';

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class GatewayAuthGuard implements CanActivate {
  constructor(private readonly authClient: AuthClientGatewayService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const user = await this.authClient.validateToken(token);
    request.user = user;
    return true;
  }

  private extractToken(request: Request): string | null {
    const header = request.headers['authorization'] ?? request.headers['Authorization'];
    if (!header || Array.isArray(header)) {
      return null;
    }
    const [type, token] = header.split(' ');
    
    return type === 'Bearer' && token ? token : null;
  }
}

