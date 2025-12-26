import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { CategoryTreeCacheService } from './category-tree.cache';
import { CategoryChangedEvent, CategoryEventBus } from './category-events.bus';

@Injectable()
export class CategoryEventsListener implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CategoryEventsListener.name);
  private readonly handler = async (event: CategoryChangedEvent): Promise<void> => {
    try {
      await this.categoryTreeCache.applyCategoryMutation(event);
      this.logger.debug(
        `Category cache updated via ${event.action} event for ${event.categoryId}`,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.warn(
        `Selective cache update failed for ${event.categoryId}: ${err.message}. Falling back to full rebuild.`,
      );
      try {
        await this.categoryTreeCache.rebuildTree();
      } catch (rebuildError) {
        const rebuildErr = rebuildError as Error;
        this.logger.error(
          `Failed to rebuild category tree cache after fallback: ${rebuildErr.message}`,
        );
      }
    }
  };

  constructor(
    private readonly categoryEventBus: CategoryEventBus,
    private readonly categoryTreeCache: CategoryTreeCacheService,
  ) {}

  onModuleInit(): void {
    this.categoryEventBus.onCategoryChanged(this.handler);
  }

  onModuleDestroy(): void {
    this.categoryEventBus.offCategoryChanged(this.handler);
  }
}