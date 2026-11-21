import { JobExpenseType, OrderStatus, StockMovementType } from '@prisma/client';
import { prisma } from '../config/database.js';
import { conflictError, notFoundError } from '../utils/errors.js';
import { paginationArgs, paginationMeta } from '../utils/pagination.js';
import { money } from '../utils/money.js';
import { serializeExpense, serializeQuoteDetails } from '../utils/serialization.js';

const orderInclude = {
  customer: true,
  quote: { include: { customer: { select: { id: true, name: true, phone: true, email: true } }, items: { include: { product: true } } } },
  payments: { orderBy: { paidAt: 'desc' }, include: { recordedBy: { select: { id: true, name: true } } } },
  dispatches: { orderBy: { createdAt: 'desc' }, include: { items: { include: { product: true } }, equipment: { include: { product: true } } } },
  serializedEquipment: { include: { product: { select: { id: true, sku: true, name: true, category: true, isSerialized: true } } } },
  installationRecord: { include: { technician: { select: { id: true, name: true, email: true } }, photos: true } },
  jobExpenses: { orderBy: { incurredAt: 'desc' } },
};

function serializeOrder(order) {
  return {
    ...order,
    totalAmount: money(order.totalAmount),
    advancePaid: money(order.advancePaid),
    balanceDue: money(order.balanceDue),
    quote: order.quote ? serializeQuoteDetails(order.quote) : order.quote,
    payments: order.payments?.map((payment) => ({ ...payment, amount: money(payment.amount) })),
    jobExpenses: order.jobExpenses?.map(serializeExpense),
  };
}

export async function listOrders(query) {
  const where = query.status ? { status: query.status } : {};
  const [orders, total] = await prisma.$transaction([
    prisma.installationOrder.findMany({ where, ...paginationArgs(query), orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], include: orderInclude }),
    prisma.installationOrder.count({ where }),
  ]);
  return { data: orders.map(serializeOrder), meta: paginationMeta(query, total) };
}

export async function getOrder(id) {
  const order = await prisma.installationOrder.findUnique({ where: { id }, include: orderInclude });
  if (!order) throw notFoundError('Installation order not found');
  return serializeOrder(order);
}

export async function getPickingList(id) {
  const order = await prisma.installationOrder.findUnique({
    where: { id },
    include: { quote: { include: { items: { include: { product: true } } } } },
  });
  if (!order) throw notFoundError('Installation order not found');
  if (order.status !== OrderStatus.CONFIRMED) throw conflictError('Picking lists are available only for CONFIRMED orders');

  const requirements = new Map();
  for (const item of order.quote.items) {
    const current = requirements.get(item.productId) ?? { productId: item.productId, name: item.product.name, serialized: item.product.isSerialized, quantityNeeded: 0 };
    current.quantityNeeded += item.quantity;
    requirements.set(item.productId, current);
  }
  const serializedRequirements = [];
  const nonSerializedRequirements = [];
  for (const requirement of requirements.values()) {
    if (requirement.serialized) {
      const quantityAvailable = await prisma.serializedEquipment.count({ where: { productId: requirement.productId, status: 'IN_STOCK' } });
      serializedRequirements.push({ productId: requirement.productId, name: requirement.name, quantityNeeded: requirement.quantityNeeded, quantityAvailable });
    } else {
      const inventory = await prisma.inventory.findUnique({ where: { productId: requirement.productId }, select: { quantityOnHand: true } });
      nonSerializedRequirements.push({ ...requirement, quantityAvailable: inventory?.quantityOnHand ?? 0 });
      delete nonSerializedRequirements.at(-1).serialized;
    }
  }
  return { serializedRequirements, nonSerializedRequirements };
}

export async function cancelOrder(id) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.installationOrder.findUnique({ where: { id }, include: { dispatches: { where: { status: 'PREPARED' } } } });
    if (!order) throw notFoundError('Installation order not found');
    if (order.status !== OrderStatus.CONFIRMED) throw conflictError('Only a CONFIRMED order can be cancelled');

    const preparedIds = order.dispatches.map(({ id: dispatchId }) => dispatchId);
    if (preparedIds.length) {
      await tx.serializedEquipment.updateMany({
        where: { dispatchId: { in: preparedIds }, status: 'RESERVED' },
        data: { status: 'IN_STOCK', dispatchId: null, installationOrderId: null },
      });
      await tx.dispatch.deleteMany({ where: { id: { in: preparedIds } } });
    }
    return tx.installationOrder.update({ where: { id }, data: { status: OrderStatus.CANCELLED }, include: orderInclude }).then(serializeOrder);
  });
}

export async function addExpense(orderId, input, userId) {
  const order = await prisma.installationOrder.findUnique({ where: { id: orderId }, select: { id: true } });
  if (!order) throw notFoundError('Installation order not found');
  const expense = await prisma.jobExpense.create({
    data: { installationOrderId: orderId, type: input.type, amount: input.amount, description: input.description, recordedByUserId: userId },
  });
  return serializeExpense(expense);
}

export const jobExpenseTypes = Object.values(JobExpenseType);
