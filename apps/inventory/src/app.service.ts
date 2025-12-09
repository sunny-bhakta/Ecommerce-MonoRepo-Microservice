import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { AdjustmentDto } from './dto/adjustment.dto';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpsertStockDto } from './dto/upsert-stock.dto';
import { Stock, StockDocument } from './schemas/stock.schema';
import { Warehouse, WarehouseDocument } from './schemas/warehouse.schema';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Warehouse.name) private readonly warehouseModel: Model<WarehouseDocument>,
    @InjectModel(Stock.name) private readonly stockModel: Model<StockDocument>,
  ) {}

  async health() {
    const [warehouses, skus] = await Promise.all([
      this.warehouseModel.estimatedDocumentCount(),
      this.stockModel.estimatedDocumentCount(),
    ]);
    return {
      service: 'inventory',
      status: 'ok',
      warehouses,
      skus,
      timestamp: new Date().toISOString(),
    };
  }

  async createWarehouse(dto: CreateWarehouseDto) {
    const created = await this.warehouseModel.create({ name: dto.name, location: dto.location });
    return this.toWarehouse(created);
  }

  async listWarehouses() {
    const docs = await this.warehouseModel.find().sort({ createdAt: -1 }).lean();
    return docs.map((d) => this.toWarehouse(d));
  }

  async upsertStock(dto: UpsertStockDto) {
    await this.ensureWarehouse(dto.warehouseId);
    const updated = await this.stockModel
      .findOneAndUpdate(
        { sku: dto.sku, warehouseId: dto.warehouseId } satisfies FilterQuery<Stock>,
        { $set: { onHand: dto.onHand }, $setOnInsert: { reserved: 0 } },
        { new: true, upsert: true },
      )
      .lean();
    return this.toStock(updated!);
  }

  async getAvailability(sku: string) {
    const records = await this.stockModel.find({ sku }).lean();
    const totalOnHand = records.reduce((sum, r) => sum + r.onHand, 0);
    const totalReserved = records.reduce((sum, r) => sum + r.reserved, 0);
    return {
      sku,
      totalOnHand,
      totalReserved,
      totalAvailable: totalOnHand - totalReserved,
      warehouses: records.map((r) => ({
        warehouseId: r.warehouseId,
        onHand: r.onHand,
        reserved: r.reserved,
        available: r.onHand - r.reserved,
      })),
    };
  }

  async reserve(dto: AdjustmentDto) {
    const record = await this.ensureStock(dto);
    if (record.onHand - record.reserved < dto.quantity) {
      throw new BadRequestException('Insufficient available stock');
    }
    record.reserved += dto.quantity;
    await record.save();
    return this.toReservationResult(record);
  }

  async release(dto: AdjustmentDto) {
    const record = await this.ensureStock(dto);
    if (record.reserved < dto.quantity) {
      throw new BadRequestException('Cannot release more than reserved');
    }
    record.reserved -= dto.quantity;
    await record.save();
    return this.toReservationResult(record);
  }

  async allocate(dto: AdjustmentDto) {
    const record = await this.ensureStock(dto);
    if (record.reserved < dto.quantity) {
      throw new BadRequestException('Cannot allocate more than reserved');
    }
    record.reserved -= dto.quantity;
    record.onHand -= dto.quantity;
    await record.save();
    return this.toReservationResult(record);
  }

  private async ensureWarehouse(id: string) {
    const exists = await this.warehouseModel.exists({ _id: id });
    if (!exists) {
      throw new NotFoundException(`Warehouse ${id} not found`);
    }
  }

  private async ensureStock(dto: AdjustmentDto) {
    await this.ensureWarehouse(dto.warehouseId);
    const record = await this.stockModel.findOne({
      sku: dto.sku,
      warehouseId: dto.warehouseId,
    });
    if (!record) {
      throw new NotFoundException('Stock record not found');
    }
    return record;
  }

  private toWarehouse(doc: WarehouseDocument | Warehouse) {
    const obj = typeof (doc as any).toObject === 'function' ? (doc as any).toObject() : doc;
    return {
      id: obj._id?.toString?.() ?? obj.id,
      name: obj.name,
      location: obj.location,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }

  private toStock(doc: StockDocument | Stock) {
    const obj = typeof (doc as any).toObject === 'function' ? (doc as any).toObject() : doc;
    return {
      sku: obj.sku,
      warehouseId: obj.warehouseId,
      onHand: obj.onHand,
      reserved: obj.reserved,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }

  private toReservationResult(record: StockDocument) {
    return {
      sku: record.sku,
      warehouseId: record.warehouseId,
      onHand: record.onHand,
      reserved: record.reserved,
      available: record.onHand - record.reserved,
    };
  }
}
