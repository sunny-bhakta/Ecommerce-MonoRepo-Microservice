import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { CheckoutRequestDto } from './dto/checkout-request.dto';
import { CreateGatewayUserDto, UpdateGatewayUserDto } from './dto/user-profile.dto';
import { GatewayAuthGuard } from './guards/gateway-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@Controller()
export class GatewayController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health(): Promise<unknown> {
    return this.appService.health();
  }

  @UseGuards(GatewayAuthGuard)
  @Post('checkout')
  checkout(@Body() dto: CheckoutRequestDto, @CurrentUser() user: AuthenticatedUser): Promise<unknown> {
    return this.appService.checkout(dto, user);
  }

  @UseGuards(GatewayAuthGuard)
  @Get('orders/:orderId/summary')
  getOrderSummary(@Param('orderId') orderId: string): Promise<unknown> {
    return this.appService.getOrderAggregate(orderId);
  }

  @UseGuards(GatewayAuthGuard)
  @Get('me/profile')
  getMyProfile(@CurrentUser() user: AuthenticatedUser): Promise<unknown> {
    return this.appService.getMyProfile(user.id);
  }

  @UseGuards(GatewayAuthGuard)
  @Patch('me/profile')
  updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateGatewayUserDto,
  ): Promise<unknown> {
    return this.appService.updateMyProfile(user.id, dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('users')
  createUser(@Body() dto: CreateGatewayUserDto): Promise<unknown> {
    return this.appService.createUser(dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('users')
  listUsers(@Query('email') email?: string): Promise<unknown> {
    return this.appService.listUsers(email);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('users/:id')
  getUser(@Param('id') id: string): Promise<unknown> {
    return this.appService.getUser(id);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateGatewayUserDto): Promise<unknown> {
    return this.appService.updateUser(id, dto);
  }

  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('users/:id')
  deleteUser(@Param('id') id: string): Promise<unknown> {
    return this.appService.deleteUser(id);
  }
}
