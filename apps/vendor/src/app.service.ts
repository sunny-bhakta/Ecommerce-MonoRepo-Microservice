import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { KycStatus, VendorEntity } from './entities/vendor.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(VendorEntity)
    private readonly vendorRepository: Repository<VendorEntity>,
  ) {}

  async health() {
    const total = await this.vendorRepository.count();
    return {
      service: 'vendor',
      status: 'ok',
      vendors: total,
      timestamp: new Date().toISOString(),
    };
  }

  async createVendor(dto: CreateVendorDto): Promise<VendorEntity> {
    const email = this.normalizeEmail(dto.email);
    const existing = await this.vendorRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Vendor email already exists');
    }

    const vendor = this.vendorRepository.create({
      name: dto.name,
      email,
      companyName: dto.companyName,
      gstNumber: dto.gstNumber,
      address: dto.address,
      kycStatus: KycStatus.PENDING,
    });
    return this.vendorRepository.save(vendor);
  }

  async listVendors(): Promise<VendorEntity[]> {
    return this.vendorRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getVendor(id: string): Promise<VendorEntity> {
    const vendor = await this.vendorRepository.findOne({ where: { id } });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    return vendor;
  }

  async updateVendor(id: string, dto: UpdateVendorDto): Promise<VendorEntity> {
    const vendor = await this.getVendor(id);

    if (dto.email) {
      const normalizedEmail = this.normalizeEmail(dto.email);
      if (normalizedEmail !== vendor.email) {
        const existing = await this.vendorRepository.findOne({
          where: { email: normalizedEmail },
        });
        if (existing && existing.id !== id) {
          throw new ConflictException('Vendor email already exists');
        }
        vendor.email = normalizedEmail;
      }
    }

    if (dto.name !== undefined) vendor.name = dto.name;
    if (dto.companyName !== undefined) vendor.companyName = dto.companyName;
    if (dto.gstNumber !== undefined) vendor.gstNumber = dto.gstNumber;
    if (dto.address !== undefined) vendor.address = dto.address;
    if (dto.kycStatus !== undefined) vendor.kycStatus = dto.kycStatus as KycStatus;

    return this.vendorRepository.save(vendor);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
