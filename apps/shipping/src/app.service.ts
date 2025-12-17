import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';
import { ShipmentEntity, ShipmentStatus } from './entities/shipment.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(ShipmentEntity)
    private readonly shipmentRepository: Repository<ShipmentEntity>,
  ) {}

  async health() {
    const count = await this.shipmentRepository.count();
    return {
      service: 'shipping',
      status: 'ok',
      shipments: count,
      timestamp: new Date().toISOString(),
    };
  }

  async createShipment(dto: CreateShipmentDto): Promise<ShipmentEntity> {
    const shipment = this.shipmentRepository.create({
      orderId: dto.orderId,
      carrier: dto.carrier,
      trackingNumber: dto.trackingNumber,
      destination: dto.destination,
      status: ShipmentStatus.PENDING,
    });
    return this.shipmentRepository.save(shipment);
  }

  async listShipments(orderId?: string): Promise<ShipmentEntity[]> {
    return this.shipmentRepository.find({
      where: orderId ? { orderId } : {},
      order: { createdAt: 'DESC' },
    });
  }

  async getShipment(id: string): Promise<ShipmentEntity> {
    const shipment = await this.shipmentRepository.findOne({ where: { id } });
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }
    return shipment;
  }

  async updateStatus(id: string, dto: UpdateShipmentStatusDto): Promise<ShipmentEntity> {
    const shipment = await this.getShipment(id);
    shipment.status = dto.status;
    if (dto.trackingNumber !== undefined) {
      shipment.trackingNumber = dto.trackingNumber;
    }
    return this.shipmentRepository.save(shipment);
  }
}
