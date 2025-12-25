import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthenticatedUser } from './dto/user.dto';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { ChangePasswordDto, LoginDto, RegisterUserDto } from '@app/common/dto';
import { UserRole } from '@app/common/enums';

@Controller('auth')
export class AuthController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return this.appService.health();
  }

  @Post('register')
  register(@Body() dto: RegisterUserDto) {
    return this.appService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.appService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('users')
  listUsers() {
    return this.appService.listUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('password')
  changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {    
    return this.appService.changePassword(user.id, dto);
  }
}

