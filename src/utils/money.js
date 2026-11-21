import { Prisma } from '@prisma/client';

export function decimal(value) {
  return new Prisma.Decimal(value ?? '0');
}

export function money(value) {
  return decimal(value).toFixed(2);
}

export function serializeProduct(product) {
  if (!product) return product;
  return { ...product, unitPrice: money(product.unitPrice) };
}

export function serializeQuote(quote) {
  if (!quote) return quote;
  return {
    ...quote,
    subtotal: money(quote.subtotal),
    discount: money(quote.discount),
    tax: money(quote.tax),
    total: money(quote.total),
    items: quote.items?.map((item) => ({
      ...item,
      unitPriceAtQuote: money(item.unitPriceAtQuote),
      lineTotal: money(item.lineTotal),
      ...(item.product ? { product: serializeProduct(item.product) } : {}),
    })),
  };
}
