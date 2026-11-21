import { LeadStatus, QuoteStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { conflictError, notFoundError, validationError } from '../utils/errors.js';
import { decimal } from '../utils/money.js';
import { paginationArgs, paginationMeta } from '../utils/pagination.js';
import { quoteNumber, serializeQuoteDetails } from '../utils/serialization.js';
import { resolveBom } from './bomService.js';

const quoteInclude = {
  customer: { select: { id: true, name: true, phone: true, email: true, address: true } },
  items: {
    orderBy: { id: 'asc' },
    include: { product: { select: { id: true, sku: true, name: true, category: true, unit: true, unitPrice: true, isSerialized: true } } },
  },
};

export async function createQuote(leadId, input, userId) {
  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({
      where: { id: leadId },
      include: { survey: true },
    });
    if (!lead) throw notFoundError('Lead not found');
    if (![LeadStatus.SURVEY_APPROVED, LeadStatus.QUOTED].includes(lead.status) || lead.survey?.status !== 'APPROVED') {
      throw conflictError('Lead survey is not approved');
    }

    const bom = await resolveBom(tx, input.systemType, input.capacityKw);
    const discount = decimal(input.discount);
    const tax = decimal(input.tax);
    const total = bom.subtotal.minus(discount).plus(tax);
    if (total.isNegative()) {
      throw validationError('Quote total cannot be negative', { discount: 'must not produce a negative total' });
    }

    const quote = await tx.quote.create({
      data: {
        leadId,
        customerId: lead.customerId,
        bomTemplateId: bom.bomTemplateId,
        systemType: input.systemType,
        capacityKw: input.capacityKw,
        subtotal: bom.subtotal,
        discount,
        tax,
        total,
        validUntil: input.validUntil ? new Date(`${input.validUntil}T00:00:00.000Z`) : null,
        createdByUserId: userId,
        items: {
          create: bom.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPriceAtQuote: item.unitPrice,
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: quoteInclude,
    });
    await tx.lead.update({ where: { id: leadId }, data: { status: LeadStatus.QUOTED } });
    return serializeQuoteDetails(quote);
  });
}

export async function getQuote(id) {
  const quote = await prisma.quote.findUnique({ where: { id }, include: quoteInclude });
  if (!quote) throw notFoundError('Quote not found');
  return serializeQuoteDetails(quote);
}

export async function listQuotes(query) {
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.leadId ? { leadId: query.leadId } : {}),
    ...(query.customerId ? { customerId: query.customerId } : {}),
  };
  if (query.search) {
    const yearMatch = query.search.match(/^Q-(\d{4})/i);
    const idSearch = query.search.replace(/^Q-\d{4}-/i, '');
    const searchClauses = [
      { id: { contains: idSearch || query.search } },
      { customer: { name: { contains: query.search } } },
      { customer: { phone: { contains: query.search } } },
      { customer: { email: { contains: query.search } } },
    ];
    if (yearMatch) {
      const year = Number(yearMatch[1]);
      searchClauses.push({ createdAt: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } });
    }
    where.AND = [...(where.AND ?? []), { OR: searchClauses }];
  }
  const [quotes, total] = await prisma.$transaction([
    prisma.quote.findMany({ where, ...paginationArgs(query), orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], include: quoteInclude }),
    prisma.quote.count({ where }),
  ]);
  return { data: quotes.map(serializeQuoteDetails), meta: paginationMeta(query, total) };
}

export async function updateQuoteItems(id, requestedItems) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findUnique({ where: { id }, include: { items: true } });
    if (!quote) throw notFoundError('Quote not found');
    if (quote.status !== QuoteStatus.DRAFT) throw conflictError('Only a DRAFT quote can be adjusted');

    const requestedProductIds = requestedItems.map((item) => item.productId).sort();
    const existingProductIds = quote.items.map((item) => item.productId).sort();
    if (requestedProductIds.length !== existingProductIds.length
      || requestedProductIds.some((productId, index) => productId !== existingProductIds[index])) {
      throw validationError('Quote item products cannot be added or removed', {
        items: 'productId values must match the generated BOM structure',
      });
    }

    const existingByProductId = new Map(quote.items.map((item) => [item.productId, item]));
    if (existingByProductId.size !== quote.items.length) {
      throw validationError('This quote has duplicate product lines and cannot be adjusted by productId');
    }

    let subtotal = decimal(0);
    const updates = requestedItems.map((requested) => {
      const existing = existingByProductId.get(requested.productId);
      const lineTotal = decimal(existing.unitPriceAtQuote).mul(requested.quantity);
      subtotal = subtotal.plus(lineTotal);
      return tx.quoteItem.update({
        where: { id: existing.id },
        data: { quantity: requested.quantity, lineTotal },
      });
    });
    const total = subtotal.minus(quote.discount).plus(quote.tax);
    if (total.isNegative()) throw validationError('Quote total cannot be negative');

    await Promise.all(updates);
    const updated = await tx.quote.update({
      where: { id },
      data: { subtotal, total },
      include: quoteInclude,
    });
    return serializeQuoteDetails(updated);
  });
}

export async function sendQuote(id) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findUnique({ where: { id } });
    if (!quote) throw notFoundError('Quote not found');
    if (quote.status !== QuoteStatus.DRAFT) throw conflictError('Only a DRAFT quote can be sent');
    return serializeQuoteDetails(await tx.quote.update({ where: { id }, data: { status: QuoteStatus.SENT }, include: quoteInclude }));
  });
}

export async function acceptQuote(id) {
  try {
    return await prisma.$transaction(async (tx) => {
      const quote = await tx.quote.findUnique({ where: { id }, include: { lead: true, customer: { select: { id: true, name: true, phone: true, email: true } } } });
      if (!quote) throw notFoundError('Quote not found');
      if (quote.status !== QuoteStatus.SENT) throw conflictError('Only a SENT quote can be accepted');
      if (quote.lead.status !== LeadStatus.QUOTED) {
        throw conflictError('The lead is not in a state that can be converted by accepting this quote');
      }

      const acceptedQuote = await tx.quote.update({ where: { id }, data: { status: QuoteStatus.ACCEPTED } });
      const order = await tx.installationOrder.create({
        data: {
          quoteId: id,
          customerId: quote.customerId,
          status: 'CONFIRMED',
          totalAmount: quote.total,
          advancePaid: decimal(0),
          balanceDue: quote.total,
        },
      });
      await tx.lead.update({ where: { id: quote.leadId }, data: { status: LeadStatus.CONVERTED } });

      return {
        quote: { id: acceptedQuote.id, quoteNumber: quoteNumber(acceptedQuote), status: acceptedQuote.status },
        order: {
          id: order.id,
          quoteId: order.quoteId,
          customerId: order.customerId,
          status: order.status,
          totalAmount: order.totalAmount.toFixed(2),
          advancePaid: order.advancePaid.toFixed(2),
          balanceDue: order.balanceDue.toFixed(2),
          scheduledDate: order.scheduledDate,
          createdAt: order.createdAt,
          customer: quote.customer,
        },
      };
    });
  } catch (error) {
    if (error.code === 'P2002') throw conflictError('This quote already has an InstallationOrder');
    throw error;
  }
}

export async function rejectQuote(id) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findUnique({ where: { id } });
    if (!quote) throw notFoundError('Quote not found');
    if (![QuoteStatus.DRAFT, QuoteStatus.SENT].includes(quote.status)) {
      throw conflictError('Only a DRAFT or SENT quote can be rejected');
    }
    return serializeQuoteDetails(await tx.quote.update({ where: { id }, data: { status: QuoteStatus.REJECTED }, include: quoteInclude }));
  });
}
