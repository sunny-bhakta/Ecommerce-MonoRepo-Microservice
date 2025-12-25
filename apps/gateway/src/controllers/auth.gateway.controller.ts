import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { LoginDto, RegisterUserDto,  ChangePasswordDto} from '@app/common/dto';
import { UserRole } from '@app/common/enums';
import { AuthGatewayService } from '../services';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { GatewayAuthGuard } from '../guards/gateway-auth.guard';
import { Req } from '@nestjs/common';

@Controller('auth')
export class AuthGatewayController {
  constructor(private readonly authGatewayService: AuthGatewayService) { }

  @Post('vendor/register')
  registerVendor(@Body() dto: RegisterUserDto) {
    dto.roles = [UserRole.VENDOR];
    return this.authGatewayService.register(dto);
  }

  @Post('customer/register')
  registerCustomer(@Body() dto: RegisterUserDto) {
    dto.roles = [UserRole.CUSTOMER];
    return this.authGatewayService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authGatewayService.login(dto);
  }

  @UseGuards(GatewayAuthGuard)
  @Get('me')
  me(@Req() req: Request & { headers: Record<string, string> }) {
    const authHeader = req.headers.authorization ?? req.headers.Authorization;
    return this.authGatewayService.me(authHeader);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('users')
  listUsers(@Req() req: Request & { headers: Record<string, string> }) {
    const authHeader = req.headers.authorization ?? req.headers.Authorization;
    return this.authGatewayService.listUsers(authHeader);
  }

  @UseGuards(GatewayAuthGuard) 
  @Patch('password')
  changePassword(@Req() req: Request & { headers: Record<string, string> }, @Body() dto: ChangePasswordDto) {
    const authHeader = req.headers.authorization ?? req.headers.Authorization;
    return this.authGatewayService.changePassword(authHeader, dto);
  }

  // Add Feature to assign user roles separately
  // @Post('admin/register')
  // registerAdmin(@Body() dto: RegisterUserDto) {
  //   return this.authGatewayService.register(dto);
  // }
}