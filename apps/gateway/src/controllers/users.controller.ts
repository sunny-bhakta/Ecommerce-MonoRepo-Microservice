import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GatewayAuthGuard } from '../guards/gateway-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CreateGatewayUserDto, UpdateGatewayUserDto } from '../dto/user-profile.dto';
import { UserGatewayService } from '../services/users.service';

@UseGuards(GatewayAuthGuard, RolesGuard)
@Roles('admin')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserGatewayService) {}

  @Post()
  createUser(@Body() dto: CreateGatewayUserDto) {
    return this.userService.createUser(dto);
  }

  @Get()
  listUsers(@Query('email') email?: string) {
    return this.userService.listUsers(email);
  }

  @Get('email/:email')
  getUserByEmail(@Param('email') email: string) {
    return this.userService.getUserByEmail(email);
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.userService.getUser(id);
  }

  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateGatewayUserDto) {
    return this.userService.updateUser(id, dto);
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}