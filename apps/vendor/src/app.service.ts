import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

interface Vendor {
  id: string;
  name: string;
  email: string;
  companyName: string;
  gstNumber?: string;
  address?: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class AppService {
  private vendors: Vendor[] = [];

  health() {
    return {
      service: 'vendor',
      status: 'ok',
      vendors: this.vendors.length,
      timestamp: new Date().toISOString(),
    };
  }

  createVendor(dto: CreateVendorDto): Vendor {
    const now = new Date().toISOString();
    const vendor: Vendor = {
      id: randomUUID(),
      name: dto.name,
      email: dto.email.toLowerCase(),
      companyName: dto.companyName,
      gstNumber: dto.gstNumber,
      address: dto.address,
      kycStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    this.vendors.push(vendor);
    return vendor;
  }

  listVendors(): Vendor[] {
    return this.vendors;
  }

  getVendor(id: string): Vendor {
    const vendor = this.vendors.find((v) => v.id === id);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    return vendor;
  }

  updateVendor(id: string, dto: UpdateVendorDto): Vendor {
    const vendor = this.getVendor(id);
    if (dto.name !== undefined) vendor.name = dto.name;
    if (dto.email !== undefined) vendor.email = dto.email.toLowerCase();
    if (dto.companyName !== undefined) vendor.companyName = dto.companyName;
    if (dto.gstNumber !== undefined) vendor.gstNumber = dto.gstNumber;
    if (dto.address !== undefined) vendor.address = dto.address;
    if (dto.kycStatus !== undefined) vendor.kycStatus = dto.kycStatus;
    vendor.updatedAt = new Date().toISOString();
    return vendor;
  }
}
