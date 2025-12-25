import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { GatewayAuthGuard } from '../guards/gateway-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CreateVendorDto } from '../dto/create-vendor.dto';
import { UpdateVendorDto } from '../dto/update-vendor.dto';
import { VendorGatewayService } from '../services/vendors.service';

@UseGuards(GatewayAuthGuard, RolesGuard)
@Roles('admin')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorService: VendorGatewayService) {}

  @Post()
  createVendor(@Body() dto: CreateVendorDto) {
    return this.vendorService.createVendor(dto);
  }

  @Get()
  listVendors() {
    return this.vendorService.listVendors();
  }

  @Get(':id')
  getVendor(@Param('id') id: string) {
    return this.vendorService.getVendor(id);
  }

  @Patch(':id')
  updateVendor(@Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.vendorService.updateVendor(id, dto);
  }
}