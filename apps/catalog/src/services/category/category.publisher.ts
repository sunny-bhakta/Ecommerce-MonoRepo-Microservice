import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

import { CatalogEventNames, CategoryChangedEvent, CategoryChangedEventPayload } from '@app/events';
import { CATALOG_EVENTS_CLIENT } from './category.constants';

@Injectable()
export class CategoryPublisher {
  private readonly logger = new Logger(CategoryPublisher.name);

  constructor(@Inject(CATALOG_EVENTS_CLIENT) private readonly client: ClientProxy) {}

  async publishCategoryChanged(payload: CategoryChangedEventPayload): Promise<void> {
    const event: CategoryChangedEvent = {
      name: CatalogEventNames.CATEGORY_CHANGED,
      occurredAt: new Date().toISOString(),
      payload,
    };

    try {
      await lastValueFrom(this.client.emit(event.name, event));
      this.logger.debug(`Published category event for ${payload.categoryId}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to publish category event: ${err?.message}`, err?.stack);
    }
  }
}