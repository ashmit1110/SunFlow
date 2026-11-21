import { decimal } from './money.js';
import { unprocessableError } from './errors.js';

export function expandBom(template, capacityKw) {
  let subtotal = decimal(0);
  const items = template.items.map((templateItem) => {
    const computed = templateItem.quantityFixed ?? Math.ceil(templateItem.quantityPerKw * capacityKw);
    if (!Number.isSafeInteger(computed) || computed < 1 || computed > 2147483647) {
      throw unprocessableError(`BOM item ${templateItem.productId} expands to an invalid quantity`);
    }

    const unitPrice = decimal(templateItem.product.unitPrice);
    const lineTotal = unitPrice.mul(computed);
    subtotal = subtotal.plus(lineTotal);
    return {
      productId: templateItem.productId,
      name: templateItem.product.name,
      quantity: computed,
      unitPrice,
      lineTotal,
    };
  });

  return { bomTemplateId: template.id, capacityKw, items, subtotal };
}
