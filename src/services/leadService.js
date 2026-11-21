import { LeadStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { conflictError, notFoundError, validationError } from '../utils/errors.js';
import { paginationArgs, paginationMeta } from '../utils/pagination.js';

export async function createLead(input) {
  return prisma.$transaction(async (tx) => {
    if (input.assignedSalesUserId) {
      const assignedUser = await tx.user.findUnique({ where: { id: input.assignedSalesUserId }, select: { role: true, isActive: true } });
      if (!assignedUser?.isActive || assignedUser.role !== 'SALES') {
        throw validationError('assignedSalesUserId must refer to an active SALES user', {
          assignedSalesUserId: 'must refer to an active SALES user',
        });
      }
    }

    const customer = await tx.customer.upsert({
      where: { phone: input.customerPhone },
      update: {},
      create: {
        name: input.customerName,
        phone: input.customerPhone,
        address: input.customerAddress,
      },
    });

    const lead = await tx.lead.create({
      data: {
        customerId: customer.id,
        requestedCapacityKw: input.requestedCapacityKw,
        systemTypeInterest: input.systemTypeInterest,
        subsidyInterest: input.subsidyInterest,
        source: input.source,
        assignedSalesUserId: input.assignedSalesUserId,
      },
    });

    return { lead, customer };
  });
}

export async function listLeads(query) {
  const where = query.status ? { status: query.status } : {};
  const [leads, total] = await prisma.$transaction([
    prisma.lead.findMany({
      where,
      ...paginationArgs(query),
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      include: { customer: true, survey: true },
    }),
    prisma.lead.count({ where }),
  ]);
  return { data: leads, meta: paginationMeta(query, total) };
}

export async function getLead(id) {
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { customer: true, survey: true, quotes: { include: { items: true } } },
  });
  if (!lead) throw notFoundError('Lead not found');
  return lead;
}

export async function qualifyLead(id, input) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.lead.findUnique({ where: { id } });
    if (!current) throw notFoundError('Lead not found');
    if ([LeadStatus.LOST, LeadStatus.CONVERTED].includes(current.status)) {
      throw conflictError(`A ${current.status} lead cannot be qualified`);
    }

    const values = {
      shadowFreeRoofAreaSqm: input.shadowFreeRoofAreaSqm ?? current.shadowFreeRoofAreaSqm,
      avgMonthlyBillInr: input.avgMonthlyBillInr ?? current.avgMonthlyBillInr,
      gridSuitable: input.gridSuitable ?? current.gridSuitable,
    };
    const isQualified = Object.values(values).every((value) => value !== null);
    const shouldAdvanceToQualified = isQualified && [LeadStatus.NEW, LeadStatus.CONTACTED].includes(current.status);
    return tx.lead.update({
      where: { id },
      data: { ...values, ...(shouldAdvanceToQualified ? { status: LeadStatus.QUALIFIED } : {}) },
      include: { customer: true, survey: true },
    });
  });
}

export async function updateLeadStatus(id, status) {
  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({ where: { id } });
    if (!lead) throw notFoundError('Lead not found');

    const allowed = lead.status === LeadStatus.NEW && status === LeadStatus.CONTACTED;
    const canLose = status === LeadStatus.LOST && ![LeadStatus.CONVERTED, LeadStatus.LOST].includes(lead.status);
    if (!allowed && !canLose) throw conflictError(`Lead cannot move from ${lead.status} to ${status}`);

    return tx.lead.update({ where: { id }, data: { status }, include: { customer: true, survey: true } });
  });
}
