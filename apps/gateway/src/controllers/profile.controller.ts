import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { GatewayAuthGuard } from '../guards/gateway-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthenticatedUser } from '../interfaces/auth.interface';
import { UpdateGatewayUserDto } from '../dto/user-profile.dto';
import { UserGatewayService } from '../services/users.service';

@UseGuards(GatewayAuthGuard)
@Controller('me')
export class ProfileController {
  constructor(private readonly userService: UserGatewayService) {}

  @Get('profile')
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.userService.getMyProfile(user.id);
  }

  @Patch('profile')
  updateMyProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateGatewayUserDto) {
    return this.userService.updateMyProfile(user.id, dto);
  }
}