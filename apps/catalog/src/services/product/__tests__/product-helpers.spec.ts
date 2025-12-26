import { strict as assert } from 'node:assert';
import { BadRequestException } from '@nestjs/common';
import { ProductOptionsService } from '../product-options.service';
import { ProductMapper } from '../product.mapper';
import { ProductDoc, VariantDoc } from '../product.types';

interface TestCase {
  name: string;
  fn: () => void | Promise<void>;
}

const tests: TestCase[] = [];
function test(name: string, fn: () => void | Promise<void>) {
  tests.push({ name, fn });
}

const optionsService = new ProductOptionsService();
const mapper = new ProductMapper();

test('normalizeOptionDefinitions enforces uniqueness and structure', () => {
  const normalized = optionsService.normalizeOptionDefinitions([
    { name: 'Size', values: ['S', 'M', 'L'] },
    { name: 'Color', values: ['Red', 'Blue'] },
  ]);

  assert.equal(normalized.length, 2);
  assert.deepEqual(normalized[0], { name: 'Size', values: ['S', 'M', 'L'] });
  assert.throws(
    () =>
      optionsService.normalizeOptionDefinitions([
        { name: 'Size', values: ['S', 'M'] },
        { name: 'Size', values: ['L'] },
      ]),
    BadRequestException,
  );
});

test('normalizeAttributesForOptions sorts loose attributes and validates variants', () => {
  const noOptions = optionsService.normalizeAttributesForOptions(
    [
      { key: 'material', value: 'cotton' },
      { key: 'fit', value: 'regular' },
    ],
    [],
  );
  assert.deepEqual(noOptions, [
    { key: 'fit', value: 'regular' },
    { key: 'material', value: 'cotton' },
  ]);

  const options = [{ name: 'Size', values: ['S', 'M'] }];
  const normalized = optionsService.normalizeAttributesForOptions(
    [{ key: 'Size', value: 'M' }],
    options,
  );
  assert.deepEqual(normalized, [{ key: 'Size', value: 'M' }]);
  assert.throws(
    () => optionsService.normalizeAttributesForOptions([{ key: 'Color', value: 'Red' }], options),
    /not defined as options/i,
  );
});

test('buildCombinationKey and equality helpers behave consistently', () => {
  const attrs = [
    { key: 'Size', value: 'M' },
    { key: 'Color', value: 'Blue' },
  ];
  const key = optionsService.buildCombinationKey(attrs);
  assert.equal(key, 'Size:M|Color:Blue');
  assert.equal(optionsService.buildCombinationKey([]), '__none__');
  assert.equal(optionsService.areAttributesEqual(attrs, [...attrs]), true);
  assert.equal(
    optionsService.areAttributesEqual(attrs, [{ key: 'Size', value: 'L' }, { key: 'Color', value: 'Blue' }]),
    false,
  );
});

test('ProductMapper maps product and variant payloads with overrides', () => {
  const productDoc = {
    _id: '507f1f77bcf86cd799439011',
    id: '507f1f77bcf86cd799439011',
    name: 'T-Shirt',
    description: 'Soft cotton tee',
    categoryId: '507f1f77bcf86cd799439012',
    subCategoryId: '607f1f77bcf86cd799439015',
    basePrice: 25,
    attributes: [{ key: 'material', value: 'cotton' }],
    options: [{ name: 'Size', values: ['S', 'M'] }],
    variants: [
      {
        _id: '607f1f77bcf86cd799439013',
        id: '607f1f77bcf86cd799439013',
        productId: '507f1f77bcf86cd799439011',
        sku: 'TS-RED-M',
        price: 27,
        stock: 10,
        attributes: [{ key: 'Size', value: 'M' }],
      },
    ],
    status: 'pending',
    categoryBreadcrumb: [
      { id: '507f1f77bcf86cd799439012', name: 'Clothing', slug: 'clothing' },
      { id: '607f1f77bcf86cd799439015', name: 'Tops', slug: 'tops' },
    ],
  } as unknown as ProductDoc;

  const mapped = mapper.mapProduct(productDoc);
  assert.equal(mapped.id, '507f1f77bcf86cd799439011');
  assert.equal(mapped.variants.length, 1);
  assert.equal(mapped.variants[0].id, '607f1f77bcf86cd799439013');
  assert.equal(mapped.subCategoryId, '607f1f77bcf86cd799439015');
  assert.deepEqual(mapped.categoryBreadcrumb, [
    { id: '507f1f77bcf86cd799439012', name: 'Clothing', slug: 'clothing' },
    { id: '607f1f77bcf86cd799439015', name: 'Tops', slug: 'tops' },
  ]);

  const overrideVariant: VariantDoc = {
    _id: '707f1f77bcf86cd799439014',
    id: '707f1f77bcf86cd799439014',
    productId: '507f1f77bcf86cd799439011',
    sku: 'TS-BLUE-S',
    price: 24,
    stock: 5,
    attributes: [{ key: 'Size', value: 'S' }],
  } as VariantDoc;

  const mappedWithOverride = mapper.mapProduct(productDoc, [overrideVariant]);
  assert.equal(mappedWithOverride.variants[0].id, '707f1f77bcf86cd799439014');
  assert.equal(mappedWithOverride.variants[0].sku, 'TS-BLUE-S');
});

async function run() {
  for (const { name, fn } of tests) {
    await fn();
    console.log(`✓ ${name}`);
  }
  console.log(`\n${tests.length} helper tests passed`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
