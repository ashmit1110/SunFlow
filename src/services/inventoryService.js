import { StockMovementType } from '@prisma/client';
import { prisma } from '../config/database.js';
import { notFoundError, unprocessableError, validationError } from '../utils/errors.js';
import { paginationArgs, paginationMeta } from '../utils/pagination.js';
import { serializeProduct } from '../utils/money.js';

const manualAdjustmentTypes = [StockMovementType.INBOUND, StockMovementType.OUTBOUND, StockMovementType.ADJUSTMENT];

export async function listInventory(query) {
  const where = { product: { isSerialized: false } };
  const [rows, total] = await prisma.$transaction([
    prisma.inventory.findMany({
      where,
      ...paginationArgs(query),
      orderBy: [{ product: { name: 'asc' } }, { id: 'asc' }],
      include: { product: true },
    }),
    prisma.inventory.count({ where }),
  ]);

  return {
    data: rows.map((row) => ({ ...row, product: serializeProduct(row.product) })),
    meta: paginationMeta(query, total),
  };
}

export async function adjustInventory(productId, input, userId) {
  if (!manualAdjustmentTypes.includes(input.type)) {
    throw validationError('Only INBOUND, OUTBOUND, and ADJUSTMENT can be recorded through manual inventory adjustment', {
      type: 'must be INBOUND, OUTBOUND, or ADJUSTMENT',
    });
  }

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw notFoundError('Product not found');
    if (product.isSerialized) {
      throw validationError('Inventory adjustments are only available for non-serialized products', {
        productId: 'product is serialized',
      });
    }

    let inventory = await tx.inventory.findUnique({ where: { productId } });
    if (!inventory) inventory = await tx.inventory.create({ data: { productId } });

    if (input.type === StockMovementType.INBOUND) {
      inventory = await tx.inventory.update({
        where: { productId },
        data: { quantityOnHand: { increment: input.quantity } },
      });
    } else {
      const result = await tx.inventory.updateMany({
        where: { productId, quantityOnHand: { gte: input.quantity } },
        data: { quantityOnHand: { decrement: input.quantity } },
      });
      if (result.count !== 1) {
        throw unprocessableError('The movement would reduce quantityOnHand below zero');
      }
      inventory = await tx.inventory.findUnique({ where: { productId } });
    }

    const stockMovement = await tx.stockMovement.create({
      data: {
        productId,
        type: input.type,
        quantity: input.quantity,
        referenceType: input.referenceType,
        notes: input.notes ?? null,
        createdByUserId: userId,
      },
    });

    return { inventory, stockMovement };
  });
}
