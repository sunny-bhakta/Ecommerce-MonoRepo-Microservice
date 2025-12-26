import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'node:events';

import { CategoryNode } from './category-tree.utils';

export type CategoryMutationAction = 'created' | 'updated' | 'deleted';

export interface CategoryChangedEvent {
  categoryId: string;
  action: CategoryMutationAction;
  category?: CategoryNode | null;
}

type CategoryChangedListener = (event: CategoryChangedEvent) => void;

@Injectable()
export class CategoryEventBus extends EventEmitter {
  private readonly eventName = 'category.changed';

  constructor() {
    super();
    this.setMaxListeners(0);
  }

  emitCategoryChanged(event: CategoryChangedEvent): boolean {
    return this.emit(this.eventName, event);
  }

  onCategoryChanged(listener: CategoryChangedListener): this {
    return this.on(this.eventName, listener);
  }

  offCategoryChanged(listener: CategoryChangedListener): this {
    return this.off(this.eventName, listener);
  }
}