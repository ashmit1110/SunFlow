import { Prisma, ServiceTicketStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { money } from '../utils/money.js';

function rangeBounds(range, now = new Date()) {
  const end = new Date(now);
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (range === 'week') {
    const weekday = start.getUTCDay() || 7;
    start.setUTCDate(start.getUTCDate() - weekday + 1);
  } else if (range === 'month') {
    start.setUTCDate(1);
  }
  return { start, end };
}

const decimalSum = (value) => value ?? new Prisma.Decimal(0);

export async function getSummary(range) {
  const { start, end } = rangeBounds(range);
  const [revenue, expenses, outstanding, openServiceTickets, ordersCompleted] = await Promise.all([
    prisma.payment.aggregate({ where: { paidAt: { gte: start, lte: end } }, _sum: { amount: true } }),
    prisma.jobExpense.aggregate({ where: { incurredAt: { gte: start, lte: end } }, _sum: { amount: true } }),
    prisma.installationOrder.aggregate({ where: { status: { not: 'CANCELLED' } }, _sum: { balanceDue: true } }),
    prisma.serviceTicket.count({ where: { status: { in: [ServiceTicketStatus.OPEN, ServiceTicketStatus.IN_PROGRESS, ServiceTicketStatus.AWAITING_PARTS] } } }),
    prisma.installationRecord.count({ where: { completedAt: { gte: start, lte: end } } }),
  ]);
  return {
    range,
    recordedRevenue: money(decimalSum(revenue._sum.amount)),
    recordedExpenses: money(decimalSum(expenses._sum.amount)),
    outstandingBalance: money(decimalSum(outstanding._sum.balanceDue)),
    openServiceTickets,
    ordersCompleted,
    note: 'Figures above are recorded sums of Payment and JobExpense rows. See orders-profitability for estimated — not audited — per-job margin.',
  };
}

export async function getOrdersProfitability() {
  const orders = await prisma.installationOrder.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    include: {
      customer: { select: { name: true } },
      quote: { select: { systemType: true, capacityKw: true, items: { select: { lineTotal: true } } } },
      payments: { where: { type: { not: 'SERVICE' } }, select: { amount: true } },
      jobExpenses: { select: { amount: true } },
    },
  });
  return orders.map((order) => {
    const recordedPayments = order.payments.reduce((sum, payment) => sum.plus(payment.amount), new Prisma.Decimal(0));
    const bomCost = order.quote?.items.reduce((sum, item) => sum.plus(item.lineTotal), new Prisma.Decimal(0)) ?? new Prisma.Decimal(0);
    const jobExpenses = order.jobExpenses.reduce((sum, expense) => sum.plus(expense.amount), new Prisma.Decimal(0));
    return {
      orderId: order.id,
      customerName: order.customer.name,
      systemType: order.quote?.systemType ?? null,
      capacityKw: order.quote?.capacityKw ?? null,
      recordedPayments: money(recordedPayments),
      bomCost: money(bomCost),
      jobExpenses: money(jobExpenses),
      estimatedMargin: money(recordedPayments.minus(bomCost).minus(jobExpenses)),
    };
  });
}

export async function getServiceOverview() {
  const counts = await prisma.serviceTicket.groupBy({ by: ['status'], _count: { _all: true } });
  const countByStatus = new Map(counts.map((entry) => [entry.status, entry._count._all]));
  return Object.values(ServiceTicketStatus).map((status) => ({ status, count: countByStatus.get(status) ?? 0 }));
}
