import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

import {
  CatalogEventNames,
  ProductChangedEvent,
  ProductChangedEventPayload,
  VariantChangedEvent,
  VariantChangedEventPayload,
} from '@app/events';
import { CATALOG_EVENTS_CLIENT } from '../category/category.constants';

@Injectable()
export class ProductPublisher {
  private readonly logger = new Logger(ProductPublisher.name);

  constructor(@Inject(CATALOG_EVENTS_CLIENT) private readonly client: ClientProxy) {}

  async publishProductChanged(payload: ProductChangedEventPayload): Promise<void> {
    const event: ProductChangedEvent = {
      name: CatalogEventNames.PRODUCT_CHANGED,
      occurredAt: new Date().toISOString(),
      payload,
    };

    try {
      await lastValueFrom(this.client.emit(event.name, event));
      this.logger.debug(`Published product event for ${payload.productId}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to publish product event: ${err?.message}`, err?.stack);
    }
  }

  async publishVariantChanged(payload: VariantChangedEventPayload): Promise<void> {
    const event: VariantChangedEvent = {
      name: CatalogEventNames.VARIANT_CHANGED,
      occurredAt: new Date().toISOString(),
      payload,
    };

    try {
      await lastValueFrom(this.client.emit(event.name, event));
      this.logger.debug(
        `Published variant event for ${payload.variantId} (product ${payload.productId})`,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to publish variant event: ${err?.message}`, err?.stack);
    }
  }
}
