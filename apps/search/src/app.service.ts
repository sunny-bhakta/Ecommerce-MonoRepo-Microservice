import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { IndexDocumentDto } from './dto/index-document.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import {
  SearchDocumentDocument,
  SearchDocumentEntity,
} from './schemas/search-document.schema';

export interface SearchDocument {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  type: 'product' | 'category' | 'general';
  metadata: Record<string, unknown>;
}

@Injectable()
export class AppService {
  constructor(
    @InjectModel(SearchDocumentEntity.name)
    private readonly documentModel: Model<SearchDocumentDocument>,
  ) {}

  async health() {
    const documents = await this.documentModel.countDocuments().exec();
    return {
      service: 'search',
      status: 'ok',
      documents,
      timestamp: new Date().toISOString(),
    };
  }

  async indexDocument(dto: IndexDocumentDto): Promise<SearchDocument> {
    const tags = dto.tags ?? [];
    const tagsNormalized = tags.map((tag) => tag.toLowerCase());
    const type = dto.type ?? 'general';
    const metadata = dto.metadata ?? {};

    const doc = await this.documentModel
      .findOneAndUpdate(
        { documentId: dto.id },
        {
          $set: {
            documentId: dto.id,
            title: dto.title,
            description: dto.description,
            tags,
            tagsNormalized,
            type,
            metadata,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .lean({ virtuals: true })
      .exec();

    return this.mapDocument(doc);
  }

  async search(dto: SearchQueryDto): Promise<SearchDocument[]> {
    const filters: FilterQuery<SearchDocumentDocument> = {};
    const normalizedTags = dto.tags?.map((tag) => tag.toLowerCase());

    if (normalizedTags?.length) {
      filters.tagsNormalized = { $all: normalizedTags };
    }

    if (dto.type) {
      filters.type = dto.type;
    }

    const query = dto.query?.trim();
    let queryBuilder = this.documentModel.find(filters).lean({ virtuals: true });

    if (query) {
      filters.$text = { $search: query } as any;
      queryBuilder = this.documentModel
        .find(filters, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .lean({ virtuals: true });
    }

    const results = await queryBuilder.exec();
    return results.map((doc) => this.mapDocument(doc));
  }

  async getDocument(id: string): Promise<SearchDocument> {
    const doc = await this.documentModel
      .findOne({ documentId: id })
      .lean({ virtuals: true })
      .exec();
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    return this.mapDocument(doc);
  }

  async seedDummyData() {
    const seeds: IndexDocumentDto[] = [
      {
        id: 'category-footwear',
        title: 'Footwear',
        description: 'Sneakers, boots, sandals, and performance trainers.',
        tags: ['category', 'shoes'],
        type: 'category',
        metadata: {
          slug: 'footwear',
          icon: 'shoe',
          productCount: 128,
        },
      },
      {
        id: 'category-electronics',
        title: 'Electronics',
        description: 'Laptops, phones, audio gear, wearables, and accessories.',
        tags: ['category', 'electronics'],
        type: 'category',
        metadata: {
          slug: 'electronics',
          icon: 'chip',
          productCount: 312,
        },
      },
      {
        id: 'category-home-decor',
        title: 'Home & Decor',
        description: 'Lighting, textiles, and curated decor for modern homes.',
        tags: ['category', 'home'],
        type: 'category',
        metadata: {
          slug: 'home-decor',
          icon: 'lamp',
          productCount: 86,
        },
      },
      {
        id: 'product-velocity-runner-x1',
        title: 'Velocity Runner X1',
        description: 'Breathable mesh upper with energy return foam midsole.',
        tags: ['product', 'running', 'shoe', 'men'],
        type: 'product',
        metadata: {
          price: 129.99,
          currency: 'USD',
          categoryId: 'category-footwear',
          vendor: 'Acme Athletics',
          rating: 4.7,
          image: 'https://cdn.example.com/products/velocity-runner-x1.jpg',
        },
      },
      {
        id: 'product-lumina-echo-sneaker',
        title: 'Lumina Echo Sneaker',
        description: 'Knit upper, cloud foam cushioning, everyday lifestyle sneaker.',
        tags: ['product', 'shoe', 'lifestyle', 'women'],
        type: 'product',
        metadata: {
          price: 99.0,
          currency: 'USD',
          categoryId: 'category-footwear',
          vendor: 'Lumina Collective',
          rating: 4.5,
          image: 'https://cdn.example.com/products/lumina-echo.jpg',
        },
      },
      {
        id: 'product-aurora-anc-headphones',
        title: 'Aurora ANC Headphones',
        description: '40-hour battery, multi-point Bluetooth, adaptive noise control.',
        tags: ['product', 'electronics', 'audio'],
        type: 'product',
        metadata: {
          price: 249.0,
          currency: 'USD',
          categoryId: 'category-electronics',
          vendor: 'SoundLab',
          rating: 4.8,
          image: 'https://cdn.example.com/products/aurora-anc.jpg',
        },
      },
      {
        id: 'product-polaris-ultrabook-14',
        title: 'Polaris Ultrabook 14"',
        description: '1kg magnesium chassis, OLED display, 10-hour battery life.',
        tags: ['product', 'electronics', 'laptop'],
        type: 'product',
        metadata: {
          price: 1399.0,
          currency: 'USD',
          categoryId: 'category-electronics',
          vendor: 'Northwind Devices',
          rating: 4.6,
          image: 'https://cdn.example.com/products/polaris-ultrabook.jpg',
        },
      },
      {
        id: 'product-lumen-orbit-lamp',
        title: 'Lumen Orbit Table Lamp',
        description: 'Matte brass finish with adjustable warm/cool light modes.',
        tags: ['product', 'home', 'lighting'],
        type: 'product',
        metadata: {
          price: 189.0,
          currency: 'USD',
          categoryId: 'category-home-decor',
          vendor: 'Studio Lumen',
          rating: 4.4,
          image: 'https://cdn.example.com/products/lumen-orbit-lamp.jpg',
        },
      },
      {
        id: 'guide-spring-style-edit',
        title: 'Spring Style Edit',
        description: 'Curated looks that blend breathable footwear with smart wearables.',
        tags: ['general', 'guide', 'spring'],
        type: 'general',
        metadata: {
          heroImage: 'https://cdn.example.com/campaigns/spring-style.jpg',
          featuredCategories: ['category-footwear', 'category-electronics'],
          cta: 'Shop the edit',
        },
      },
    ];

    const results = [] as SearchDocument[];
    for (const seed of seeds) {
      const doc = await this.indexDocument(seed);
      results.push(doc);
    }

    return {
      seeded: results.length,
      documents: results,
    };
  }

  private mapDocument(doc: {
    documentId?: string;
    id?: string;
    title: string;
    description?: string;
    tags?: string[];
    type?: 'product' | 'category' | 'general';
    metadata?: Record<string, unknown>;
  }): SearchDocument {
    return {
      id: doc.documentId ?? doc.id ?? '',
      title: doc.title,
      description: doc.description,
      tags: doc.tags ?? [],
      type: doc.type ?? 'general',
      metadata: doc.metadata ?? {},
    };
  }
}
