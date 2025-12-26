import { BadRequestException, Injectable } from '@nestjs/common';
import { Attribute, OptionDefinitionInput } from '../shared';
import { OptionDefinition } from './schemas/product.schema';

@Injectable()
export class ProductOptionsService {
  normalizeOptionDefinitions(options: OptionDefinitionInput[]): OptionDefinition[] {
    const seenNames = new Set<string>();
    return options.map((option) => {
      const name = option.name;
      if (seenNames.has(name)) {
        throw new BadRequestException(`Duplicate option name "${name}" on product`);
      }
      seenNames.add(name);

      const uniqueValues = Array.from(new Set(option.values ?? []));
      if (uniqueValues.length === 0) {
        throw new BadRequestException(`Option "${name}" must have at least one value`);
      }
      if (uniqueValues.length !== (option.values ?? []).length) {
        throw new BadRequestException(`Option "${name}" has duplicate values`);
      }

      return { name, values: uniqueValues };
    });
  }

  normalizeAttributesForOptions(attributes: Attribute[], options: OptionDefinition[]): Attribute[] {
    const attrMap = new Map<string, string>();
    for (const attr of attributes ?? []) {
      if (attrMap.has(attr.key)) {
        throw new BadRequestException(`Duplicate attribute key "${attr.key}" on variant`);
      }
      attrMap.set(attr.key, attr.value);
    }

    if (options.length === 0) {
      const sorted = Array.from(attrMap.entries()).sort(([a], [b]) => a.localeCompare(b));
      return sorted.map(([key, value]) => ({ key, value }));
    }

    const result: Attribute[] = [];
    const optionNames = new Set(options.map((o) => o.name));
    const extraKeys = Array.from(attrMap.keys()).filter((key) => !optionNames.has(key));
    if (extraKeys.length > 0) {
      throw new BadRequestException(
        `Variant contains attributes not defined as options: ${extraKeys.join(', ')}`,
      );
    }

    for (const option of options) {
      const value = attrMap.get(option.name);
      if (!value) {
        throw new BadRequestException(`Variant missing value for option "${option.name}"`);
      }
      if (!option.values.includes(value)) {
        throw new BadRequestException(
          `Variant value "${value}" is not allowed for option "${option.name}"`,
        );
      }
      result.push({ key: option.name, value });
    }

    return result;
  }

  buildCombinationKey(attributes: Attribute[]): string {
    if (attributes.length === 0) {
      return '__none__';
    }
    return attributes.map((attr) => `${attr.key}:${attr.value}`).join('|');
  }

  areAttributesEqual(left: Attribute[], right: Attribute[]): boolean {
    if (left.length !== right.length) {
      return false;
    }
    return left.every((item, index) => {
      const other = right[index];
      return other && other.key === item.key && other.value === item.value;
    });
  }
}
