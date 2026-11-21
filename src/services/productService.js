import { ProductCategory, Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { conflictError, notFoundError } from '../utils/errors.js';
import { paginationArgs, paginationMeta } from '../utils/pagination.js';
import { serializeProduct } from '../utils/money.js';

function productData(input) {
  return {
    ...input,
    ...(input.unitPrice !== undefined ? { unitPrice: new Prisma.Decimal(input.unitPrice) } : {}),
  };
}

export async function listProducts(query) {
  const where = {
    ...(query.category ? { category: query.category } : {}),
    ...(query.isSerialized !== undefined ? { isSerialized: query.isSerialized } : {}),
  };
  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({ where, ...paginationArgs(query), orderBy: [{ name: 'asc' }, { id: 'asc' }] }),
    prisma.product.count({ where }),
  ]);
  return { data: products.map(serializeProduct), meta: paginationMeta(query, total) };
}

export async function createProduct(input) {
  try {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({ data: productData(input) });
      if (!product.isSerialized) {
        await tx.inventory.create({ data: { productId: product.id } });
      }
      return serializeProduct(product);
    });
  } catch (error) {
    if (error.code === 'P2002') throw conflictError('A product with this SKU already exists');
    throw error;
  }
}

export async function updateProduct(id, input) {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({ where: { id } });
      if (!existing) throw notFoundError('Product not found');

      if (input.isSerialized !== undefined && input.isSerialized !== existing.isSerialized) {
        if (!existing.isSerialized) {
          const inventory = await tx.inventory.findUnique({ where: { productId: id } });
          if (inventory && inventory.quantityOnHand > 0) {
            throw conflictError('A product with on-hand inventory cannot be changed to serialized');
          }
          if (inventory) await tx.inventory.delete({ where: { productId: id } });
        } else {
          const equipmentCount = await tx.serializedEquipment.count({ where: { productId: id } });
          if (equipmentCount > 0) {
            throw conflictError('A product with registered serialized equipment cannot become non-serialized');
          }
          await tx.inventory.create({ data: { productId: id } });
        }
      }

      const product = await tx.product.update({ where: { id }, data: productData(input) });
      return serializeProduct(product);
    });
  } catch (error) {
    if (error.code === 'P2025') throw notFoundError('Product not found');
    if (error.code === 'P2002') throw conflictError('A product with this SKU already exists');
    throw error;
  }
}

export async function listStockMovements(productId, query) {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) throw notFoundError('Product not found');

  const where = { productId };
  const [movements, total] = await prisma.$transaction([
    prisma.stockMovement.findMany({
      where,
      ...paginationArgs(query),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    }),
    prisma.stockMovement.count({ where }),
  ]);
  return { data: movements, meta: paginationMeta(query, total) };
}

export const productCategories = Object.values(ProductCategory);
