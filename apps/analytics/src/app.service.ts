import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { IngestEventDto } from './dto/ingest-event.dto';
import { AnalyticsMetricDocument, AnalyticsMetricEntity } from './schemas/analytics_metrics_schema';


@Injectable()
export class AppService {
  private readonly metricsKey = 'global';

  constructor(
    @InjectModel(AnalyticsMetricEntity.name)
    private readonly metricModel: Model<AnalyticsMetricDocument>,
  ) {}

  private async getMetricsDoc(): Promise<AnalyticsMetricDocument> {
    let doc = await this.metricModel.findOne({ key: this.metricsKey }).exec();
    if (!doc) {
      doc = await this.metricModel.create({ key: this.metricsKey });
    }
    return doc;
  }

  async health() {
    const metrics = await this.metricModel.findOne({ key: this.metricsKey }).lean().exec();
    return {
      service: 'analytics',
      status: 'ok',
      orders: metrics?.orders ?? 0,
      payments: metrics?.payments ?? 0,
      shipments: metrics?.shipments ?? 0,
      timestamp: new Date().toISOString(),
    };
  }

  async ingest(dto: IngestEventDto) {
    const inc: Record<string, number> = {};
    const amount = dto.amount ?? 0;

    if (dto.type === 'order') {
      inc.orders = 1;
      if (amount) {
        inc.gmv = amount;
      }
    } else if (dto.type === 'payment') {
      inc.payments = 1;
      inc.paymentAttempts = 1;
      if (amount) {
        inc.paymentsTotal = amount;
      }
    } else if (dto.type === 'shipment') {
      inc.shipments = 1;
      if (amount) {
        inc.shipmentsTotal = amount;
      }
    }

    await this.metricModel.updateOne(
      { key: this.metricsKey },
      { $inc: inc },
      { upsert: true },
    );

    return { accepted: true };
  }

  async metrics() {
    const metrics = await this.getMetricsDoc();
    const totalOrders = metrics.orders;
    const totalGmv = metrics.gmv;
    const avgOrderValue = totalOrders ? totalGmv / totalOrders : 0;

    return {
      summary: {
        orders: totalOrders,
        payments: metrics.payments,
        shipments: metrics.shipments,
      },
      gmv: totalGmv,
      avgOrderValue,
      paymentAttempts: metrics.paymentAttempts,
      updatedAt: new Date().toISOString(),
    };
  }
}
