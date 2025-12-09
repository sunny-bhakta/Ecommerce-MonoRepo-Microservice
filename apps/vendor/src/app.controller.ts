import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

@Controller()
export class VendorController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return this.appService.health();
  }

  @Post('vendors')
  createVendor(@Body() dto: CreateVendorDto) {
    return this.appService.createVendor(dto);
  }

  @Get('vendors')
  listVendors() {
    return this.appService.listVendors();
  }

  @Get('vendors/:id')
  getVendor(@Param('id') id: string) {
    return this.appService.getVendor(id);
  }

  @Patch('vendors/:id')
  updateVendor(@Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.appService.updateVendor(id, dto);
  }
}
