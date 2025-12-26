import { CategoryDocument, CategoryEntity } from './schemas/category.schema';

type LeanCategory = Partial<CategoryEntity> & { _id?: unknown; id?: string };

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  sortIndex: number;
  isVisible: boolean;
  localeNames?: Record<string, string>;
  children?: CategoryNode[];
}

export type CategoryDocLike = CategoryDocument | LeanCategory;


/**
 * Normalizes a Mongo document / lean object into a DTO-friendly `CategoryNode`.
 * Safely handles missing slugs, locale maps, and derives the id from either
 * `_id` or `id`.
 *
 * @example
 * ```ts
 * const category = await this.categoryModel.findById(id);
 * const node = mapCategory(category);
 * // node = { id: '...', name: 'Shoes', slug: 'shoes', sortIndex: 0 }
 * ```
 */
export function mapCategory(doc: CategoryDocLike): CategoryNode {
  const obj = typeof (doc as any).toObject === 'function' ? (doc as any).toObject({ virtuals: true }) : doc;
  const slugValue =
    typeof obj.slug === 'string' && obj.slug.length > 0
      ? obj.slug
      : String(obj.name ?? 'category')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || 'category';
  const localeNamesValue =
    obj.localeNames instanceof Map
      ? Object.fromEntries(obj.localeNames)
      : obj.localeNames && typeof obj.localeNames === 'object'
        ? obj.localeNames
        : undefined;
  return {
    id: obj.id ?? String(obj._id),
    name: obj.name,
    slug: slugValue,
    parentId: obj.parentId ?? undefined,
    sortIndex: typeof obj.sortIndex === 'number' ? obj.sortIndex : 0,
    isVisible: obj.isVisible ?? true,
    localeNames: localeNamesValue,
  } satisfies CategoryNode;
}

type CategoryNodeWithChildren = Omit<CategoryNode, 'children'> & { children: CategoryNodeWithChildren[] };

/**
 * Materializes parent/child relationships from a flat `CategoryNode[]` and returns
 * a sorted forest (multiple roots) ready to serve from the API or cache.
 *
 * @example
 * ```ts
 * const tree = buildCategoryTree([
 *   { id: 'root', parentId: undefined, name: 'Root', sortIndex: 0, isVisible: true, slug: 'root' },
 *   { id: 'child', parentId: 'root', name: 'Child', sortIndex: 1, isVisible: true, slug: 'child' },
 * ]);
 * // tree === [{ id: 'root', children: [{ id: 'child' }] }]
 * ```
 */
export function buildCategoryTree(categories: CategoryNode[]): CategoryNode[] {
  const nodes = new Map<string, CategoryNodeWithChildren>();
  categories.forEach((category) => {
    nodes.set(category.id, { ...category, children: [] });
  });

  const roots: CategoryNodeWithChildren[] = [];

  nodes.forEach((node) => {
    if (node.parentId) {
      const parent = nodes.get(node.parentId);
      if (parent) {
        parent.children.push(node);
        return;
      }
    }
    roots.push(node);
  });

  const prune = (node: CategoryNodeWithChildren): CategoryNode => {
    const children = node.children.map((child) => prune(child));
    children.sort((a, b) => {
      if (a.sortIndex === b.sortIndex) {
        return a.name.localeCompare(b.name);
      }
      return a.sortIndex - b.sortIndex;
    });
    return {
      id: node.id,
      name: node.name,
      slug: node.slug,
      parentId: node.parentId,
      sortIndex: node.sortIndex,
      isVisible: node.isVisible,
      localeNames: node.localeNames,
      ...(children.length > 0 ? { children } : {}),
    } satisfies CategoryNode;
  };

  roots.sort((a, b) => {
    if (a.sortIndex === b.sortIndex) {
      return a.name.localeCompare(b.name);
    }
    return a.sortIndex - b.sortIndex;
  });

  return roots.map((node) => prune(node));
}
