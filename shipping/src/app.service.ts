import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';

type ShipmentStatus = 'pending' | 'label_generated' | 'in_transit' | 'delivered' | 'failed';

interface Shipment {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber?: string;
  destination: string;
  status: ShipmentStatus;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class AppService {
  private shipments: Shipment[] = [];

  health() {
    return {
      service: 'shipping',
      status: 'ok',
      shipments: this.shipments.length,
      timestamp: new Date().toISOString(),
    };
  }

  createShipment(dto: CreateShipmentDto): Shipment {
    const now = new Date().toISOString();
    const shipment: Shipment = {
      id: randomUUID(),
      orderId: dto.orderId,
      carrier: dto.carrier,
      trackingNumber: dto.trackingNumber,
      destination: dto.destination,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    this.shipments.push(shipment);
    return shipment;
  }

  listShipments(orderId?: string): Shipment[] {
    return orderId ? this.shipments.filter((s) => s.orderId === orderId) : this.shipments;
  }

  getShipment(id: string): Shipment {
    const shipment = this.shipments.find((s) => s.id === id);
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }
    return shipment;
  }

  updateStatus(id: string, dto: UpdateShipmentStatusDto): Shipment {
    const shipment = this.getShipment(id);
    shipment.status = dto.status;
    if (dto.trackingNumber !== undefined) {
      shipment.trackingNumber = dto.trackingNumber;
    }
    shipment.updatedAt = new Date().toISOString();
    return shipment;
  }
}
