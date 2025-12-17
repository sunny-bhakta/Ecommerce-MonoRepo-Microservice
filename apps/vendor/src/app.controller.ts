import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

@Controller()
export class VendorController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  async health() {
    return this.appService.health();
  }

  @Post('vendors')
  async createVendor(@Body() dto: CreateVendorDto) {
    return this.appService.createVendor(dto);
  }

  @Get('vendors')
  async listVendors() {
    return this.appService.listVendors();
  }

  @Get('vendors/:id')
  async getVendor(@Param('id') id: string) {
    return this.appService.getVendor(id);
  }

  @Patch('vendors/:id')
  async updateVendor(@Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.appService.updateVendor(id, dto);
  }
}
