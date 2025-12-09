import { Injectable } from '@nestjs/common';
import { IngestEventDto } from './dto/ingest-event.dto';

interface Counters {
  orders: number;
  payments: number;
  shipments: number;
}

interface Totals {
  gmv: number;
  paymentsTotal: number;
  shipmentsTotal: number;
}

@Injectable()
export class AppService {
  private counters: Counters = {
    orders: 0,
    payments: 0,
    shipments: 0,
  };

  private totals: Totals = {
    gmv: 0,
    paymentsTotal: 0,
    shipmentsTotal: 0,
  };

  private paymentAttempts = 0;
  private orderValues: number[] = [];

  health() {
    return {
      service: 'analytics',
      status: 'ok',
      orders: this.counters.orders,
      payments: this.counters.payments,
      shipments: this.counters.shipments,
      timestamp: new Date().toISOString(),
    };
  }

  ingest(dto: IngestEventDto) {
    if (dto.type === 'order') {
      this.counters.orders += 1;
      if (dto.amount) {
        this.totals.gmv += dto.amount;
        this.orderValues.push(dto.amount);
      }
    } else if (dto.type === 'payment') {
      this.counters.payments += 1;
      this.paymentAttempts += 1;
      if (dto.amount) {
        this.totals.paymentsTotal += dto.amount;
      }
    } else if (dto.type === 'shipment') {
      this.counters.shipments += 1;
      if (dto.amount) {
        this.totals.shipmentsTotal += dto.amount;
      }
    }
    return { accepted: true };
  }

  metrics() {
    const totalOrders = this.counters.orders;
    const totalGmv = this.totals.gmv;
    const aov = totalOrders ? totalGmv / totalOrders : 0;
    return {
      summary: {
        orders: totalOrders,
        payments: this.counters.payments,
        shipments: this.counters.shipments,
      },
      gmv: totalGmv,
      avgOrderValue: aov,
      paymentAttempts: this.paymentAttempts,
      updatedAt: new Date().toISOString(),
    };
  }
}
