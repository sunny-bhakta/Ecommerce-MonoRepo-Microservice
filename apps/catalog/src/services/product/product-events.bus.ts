import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'node:events';

import { Product, Variant } from '../shared';

export type ProductMutationAction = 'created' | 'updated' | 'deleted';

export interface ProductChangedEvent {
  productId: string;
  action: ProductMutationAction;
  product?: Product;
}

export interface VariantChangedEvent {
  productId: string;
  variantId: string;
  action: ProductMutationAction;
  variant?: Variant;
}

export type ProductChangedListener = (event: ProductChangedEvent) => void;
export type VariantChangedListener = (event: VariantChangedEvent) => void;

@Injectable()
export class ProductEventBus extends EventEmitter {
  private readonly productEventName = 'product.changed';
  private readonly variantEventName = 'variant.changed';

  constructor() {
    super();
    this.setMaxListeners(0);
  }

  emitProductChanged(event: ProductChangedEvent): boolean {
    return this.emit(this.productEventName, event);
  }

  onProductChanged(listener: ProductChangedListener): this {
    return this.on(this.productEventName, listener);
  }

  offProductChanged(listener: ProductChangedListener): this {
    return this.off(this.productEventName, listener);
  }

  emitVariantChanged(event: VariantChangedEvent): boolean {
    return this.emit(this.variantEventName, event);
  }

  onVariantChanged(listener: VariantChangedListener): this {
    return this.on(this.variantEventName, listener);
  }

  offVariantChanged(listener: VariantChangedListener): this {
    return this.off(this.variantEventName, listener);
  }
}
