import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { AppService } from './app.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return this.appService.health();
  }

  @Post('users')
  create(@Body() dto: CreateUserDto) {
    return this.appService.create(dto);
  }

  @Get('users')
  findAll(@Query('email') email?: string) {
    return this.appService.findAll(email);
  }

  @Get('users/:id')
  findOne(@Param('id') id: string) {
    return this.appService.findOne(id);
  }

  @Patch('users/:id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.appService.update(id, dto);
  }

  @Delete('users/:id')
  remove(@Param('id') id: string) {
    return this.appService.remove(id);
  }
}
