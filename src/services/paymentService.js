import { OrderStatus, PaymentType } from '@prisma/client';
import { prisma } from '../config/database.js';
import { conflictError, notFoundError, unprocessableError } from '../utils/errors.js';
import { decimal, money } from '../utils/money.js';
import { paginationArgs, paginationMeta } from '../utils/pagination.js';
import { serializePayment } from '../utils/serialization.js';

export async function recordPayment(orderId, input, userId) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.installationOrder.findUnique({ where: { id: orderId } });
    if (!order) throw notFoundError('Installation order not found');
    if (order.status === OrderStatus.CANCELLED) throw conflictError('Payments cannot be recorded against a cancelled order');
    const amount = decimal(input.amount);
    if (input.type !== PaymentType.SERVICE && amount.gt(order.balanceDue)) {
      throw unprocessableError('Payment exceeds outstanding balance');
    }
    const payment = await tx.payment.create({
      data: { installationOrderId: orderId, amount, type: input.type, method: input.method, recordedByUserId: userId },
      include: { recordedBy: { select: { id: true, name: true } } },
    });
    let totals = { advancePaid: order.advancePaid, balanceDue: order.balanceDue };
    if (input.type !== PaymentType.SERVICE) {
      const aggregate = await tx.payment.aggregate({ where: { installationOrderId: orderId, type: { not: PaymentType.SERVICE } }, _sum: { amount: true } });
      const advancePaid = aggregate._sum.amount ?? decimal(0);
      const balanceDue = decimal(order.totalAmount).minus(advancePaid);
      const updated = await tx.installationOrder.update({ where: { id: orderId }, data: { advancePaid, balanceDue }, select: { advancePaid: true, balanceDue: true } });
      totals = updated;
    }
    return { payment: serializePayment(payment), order: { advancePaid: money(totals.advancePaid), balanceDue: money(totals.balanceDue) } };
  });
}

export async function listPayments(orderId, query) {
  const order = await prisma.installationOrder.findUnique({ where: { id: orderId }, select: { id: true } });
  if (!order) throw notFoundError('Installation order not found');
  const where = { installationOrderId: orderId };
  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({ where, ...paginationArgs(query), orderBy: [{ paidAt: 'desc' }, { id: 'desc' }], include: { recordedBy: { select: { id: true, name: true } } } }),
    prisma.payment.count({ where }),
  ]);
  return { data: payments.map(serializePayment), meta: paginationMeta(query, total) };
}
