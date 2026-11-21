import { SystemType } from '@prisma/client';
import { prisma } from '../config/database.js';
import { conflictError, notFoundError, validationError } from '../utils/errors.js';
import { paginationArgs, paginationMeta } from '../utils/pagination.js';
import { expandBom } from '../utils/bomCalculator.js';
import { money, serializeProduct } from '../utils/money.js';

const templateInclude = {
  items: {
    orderBy: { id: 'asc' },
    include: { product: true },
  },
};

function serializeTemplate(template) {
  return {
    ...template,
    items: template.items?.map((item) => ({ ...item, product: serializeProduct(item.product) })),
  };
}

export async function listTemplates(query) {
  const where = query.systemType ? { systemType: query.systemType } : {};
  const [templates, total] = await prisma.$transaction([
    prisma.bOMTemplate.findMany({ where, ...paginationArgs(query), orderBy: [{ systemType: 'asc' }, { minCapacityKw: 'asc' }, { id: 'asc' }] }),
    prisma.bOMTemplate.count({ where }),
  ]);
  return { data: templates, meta: paginationMeta(query, total) };
}

export async function createTemplate(input) {
  const productIds = input.items.map(({ productId }) => productId);
  if (new Set(productIds).size !== productIds.length) {
    throw validationError('A BOM template may include each product only once', {
      items: 'productId values must be unique within a template',
    });
  }

  return prisma.$transaction(async (tx) => {
    const overlap = await tx.bOMTemplate.findFirst({
      where: {
        systemType: input.systemType,
        isActive: true,
        minCapacityKw: { lte: input.maxCapacityKw },
        maxCapacityKw: { gte: input.minCapacityKw },
      },
      select: { id: true, name: true },
    });
    if (overlap) {
      throw conflictError(`Capacity range overlaps active BOM template "${overlap.name}"`);
    }

    const productCount = await tx.product.count({ where: { id: { in: productIds } } });
    if (productCount !== productIds.length) {
      throw validationError('Every BOM item must reference an existing product', { items: 'unknown productId' });
    }

    const template = await tx.bOMTemplate.create({
      data: {
        name: input.name,
        systemType: input.systemType,
        minCapacityKw: input.minCapacityKw,
        maxCapacityKw: input.maxCapacityKw,
        description: input.description,
        items: {
          create: input.items.map(({ productId, quantityFixed, quantityPerKw, notes }) => ({
            productId,
            quantityFixed,
            quantityPerKw,
            notes,
          })),
        },
      },
      include: templateInclude,
    });
    return serializeTemplate(template);
  });
}

export async function getTemplate(id) {
  const template = await prisma.bOMTemplate.findUnique({ where: { id }, include: templateInclude });
  if (!template) throw notFoundError('BOM template not found');
  return serializeTemplate(template);
}

export async function resolveBom(client = prisma, systemType, capacityKw) {
  const template = await client.bOMTemplate.findFirst({
    where: {
      systemType,
      isActive: true,
      minCapacityKw: { lte: capacityKw },
      maxCapacityKw: { gte: capacityKw },
    },
    orderBy: [{ minCapacityKw: 'asc' }, { id: 'asc' }],
    include: templateInclude,
  });
  if (!template) {
    throw notFoundError('No active BOM template covers this capacity/system type');
  }
  return expandBom(template, capacityKw);
}

export function serializeResolvedBom(resolved) {
  return {
    bomTemplateId: resolved.bomTemplateId,
    capacityKw: resolved.capacityKw,
    items: resolved.items.map((item) => ({
      ...item,
      unitPrice: money(item.unitPrice),
      lineTotal: money(item.lineTotal),
    })),
    subtotal: money(resolved.subtotal),
  };
}

export const systemTypes = Object.values(SystemType);
