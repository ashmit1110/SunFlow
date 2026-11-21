import { money } from './money.js';

export function serializePayment(payment) {
  return { ...payment, amount: money(payment.amount) };
}

export function serializeExpense(expense) {
  return { ...expense, amount: money(expense.amount) };
}

export function quoteNumber(quote) {
  return `Q-${quote.createdAt.getUTCFullYear()}-${quote.id.toUpperCase()}`;
}

export function serializeQuoteDetails(quote) {
  if (!quote) return quote;
  return {
    ...quote,
    quoteNumber: quoteNumber(quote),
    subtotal: money(quote.subtotal),
    discount: money(quote.discount),
    tax: money(quote.tax),
    total: money(quote.total),
    items: quote.items?.map((item) => ({
      ...item,
      unitPriceAtQuote: money(item.unitPriceAtQuote),
      lineTotal: money(item.lineTotal),
      ...(item.product ? { product: { ...item.product, unitPrice: money(item.product.unitPrice) } } : {}),
    })),
  };
}
