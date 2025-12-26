import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';

import { CategoryNode, mapCategory } from './category-tree.utils';
import { CategoryDocument, CategoryEntity } from './schemas/category.schema';
import { CategoryChangedEvent } from './category-events.bus';

type MutableCategoryNode = Omit<CategoryNode, 'children'> & { children: MutableCategoryNode[] };

@Injectable()
export class CategoryTreeCacheService {
  private readonly logger = new Logger(CategoryTreeCacheService.name);
  private readonly ttlMs: number;
  private readonly nodeIndex = new Map<string, MutableCategoryNode>();
  private rootNodes: MutableCategoryNode[] = [];
  private expiresAt = 0;

  constructor(
    @InjectModel(CategoryEntity.name) private readonly categoryModel: Model<CategoryDocument>,
    config: ConfigService,
  ) {
    const ttl = Number(config.get<string>('CATEGORY_TREE_CACHE_TTL_MS'));
    this.ttlMs = Number.isFinite(ttl) && ttl > 0 ? ttl : 60_000;
  }

  async getTree(): Promise<CategoryNode[]> {
    await this.ensureInitialized();
    return this.cloneNodes(this.rootNodes);
  }

  async rebuildTree(): Promise<CategoryNode[]> {
    const categories = await this.categoryModel.find().lean({ virtuals: true }).exec();
    const mapped = categories.map((category) => mapCategory(category));
    this.hydrateFullSnapshot(mapped);
    this.expiresAt = Date.now() + this.ttlMs;
    return this.cloneNodes(this.rootNodes);
  }

  async applyCategoryMutation(event: CategoryChangedEvent): Promise<void> {
    await this.ensureInitialized();

    if (event.action === 'deleted') {
      this.removeBranch(event.categoryId);
      this.touchTtl();
      return;
    }

    if (!event.category) {
      await this.rebuildTree();
      return;
    }

    if (event.action === 'created') {
      this.insertNode(event.category);
    } else {
      this.updateNode(event.category);
    }
    this.touchTtl();
  }

  clear(): void {
    this.rootNodes = [];
    this.nodeIndex.clear();
    this.expiresAt = 0;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.rootNodes.length === 0 || Date.now() > this.expiresAt) {
      await this.rebuildTree();
    }
  }

  /**
   * Rebuilds the in-memory tree + lookup map from a flat list of categories.
   *
   * @example
   * ```ts
   * this.hydrateFullSnapshot([
   *   { id: '1', parentId: null, name: 'Root', sortIndex: 0, isVisible: true, slug: 'root' },
   *   { id: '2', parentId: '1', name: 'Child', sortIndex: 0, isVisible: true, slug: 'child' },
   * ]);
   * // rootNodes -> [{ id: '1', children: [{ id: '2', children: [] }] }]
   * // nodeIndex.get('2') === child node reference
   * ```
   *
   * @param nodes Flat `CategoryNode` array (usually from Mongo).
   * @returns void – mutates `rootNodes`, `nodeIndex`, and resets cache ordering.
   */
  private hydrateFullSnapshot(nodes: CategoryNode[]): void {
    const nodeMap = new Map<string, MutableCategoryNode>();
    nodes.forEach((node) => nodeMap.set(node.id, this.createMutableNode(node)));

    const roots: MutableCategoryNode[] = [];
    nodeMap.forEach((node) => {
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    roots.forEach((node) => this.sortBranch(node));
    this.sortChildren(roots);

    this.rootNodes = roots;
    this.nodeIndex.clear();
    nodeMap.forEach((node, id) => this.nodeIndex.set(id, node));
  }

  private insertNode(snapshot: CategoryNode): void {
    if (this.nodeIndex.has(snapshot.id)) {
      this.updateNode(snapshot);
      return;
    }

    const node = this.createMutableNode(snapshot);
    this.nodeIndex.set(node.id, node);
    this.attachToParent(node);
  }

  private updateNode(snapshot: CategoryNode): void {
    const node = this.nodeIndex.get(snapshot.id);
    if (!node) {
      this.insertNode(snapshot);
      return;
    }

    const previousParent = node.parentId ?? null;
    node.name = snapshot.name;
    node.slug = snapshot.slug;
    node.sortIndex = snapshot.sortIndex;
    node.isVisible = snapshot.isVisible;
    node.localeNames = snapshot.localeNames;
    node.parentId = snapshot.parentId;

    if (previousParent !== node.parentId) {
      this.detachFromParent(node, previousParent);
      this.attachToParent(node);
    } else if (node.parentId) {
      const parent = this.nodeIndex.get(node.parentId);
      if (parent) {
        this.sortChildren(parent.children);
      }
    } else {
      this.sortChildren(this.rootNodes);
    }
  }

  private removeBranch(categoryId: string): void {
    const node = this.nodeIndex.get(categoryId);
    if (!node) {
      return;
    }

    this.detachFromParent(node, node.parentId ?? null);
    const stack: MutableCategoryNode[] = [node];
    while (stack.length > 0) {
      const current = stack.pop()!;
      this.nodeIndex.delete(current.id);
      current.children.forEach((child) => stack.push(child));
      current.children = [];
    }
  }

  private attachToParent(node: MutableCategoryNode): void {
    if (node.parentId) {
      const parent = this.nodeIndex.get(node.parentId);
      if (parent) {
        parent.children.push(node);
        this.sortChildren(parent.children);
        return;
      }
    }

    this.rootNodes.push(node);
    this.sortChildren(this.rootNodes);
  }

  private detachFromParent(node: MutableCategoryNode, parentId: string | null): void {
    if (parentId) {
      const parent = this.nodeIndex.get(parentId);
      if (parent) {
        parent.children = parent.children.filter((child) => child.id !== node.id);
      }
    } else {
      this.rootNodes = this.rootNodes.filter((root) => root.id !== node.id);
    }
  }

  private sortBranch(node: MutableCategoryNode): void {
    this.sortChildren(node.children);
    node.children.forEach((child) => this.sortBranch(child));
  }

  private sortChildren(nodes: MutableCategoryNode[]): void {
    nodes.sort((a, b) => {
      if (a.sortIndex === b.sortIndex) {
        return a.name.localeCompare(b.name);
      }
      return a.sortIndex - b.sortIndex;
    });
  }

  private cloneNodes(nodes: MutableCategoryNode[]): CategoryNode[] {
    return nodes.map((node) => ({
      id: node.id,
      name: node.name,
      slug: node.slug,
      parentId: node.parentId,
      sortIndex: node.sortIndex,
      isVisible: node.isVisible,
      localeNames: node.localeNames,
      ...(node.children.length > 0 ? { children: this.cloneNodes(node.children) } : {}),
    }));
  }

  private createMutableNode(snapshot: CategoryNode): MutableCategoryNode {
    return {
      ...snapshot,
      children: snapshot.children?.map((child) => this.createMutableNode(child)) ?? [],
    };
  }

  private touchTtl(): void {
    this.expiresAt = Date.now() + this.ttlMs;
  }
}