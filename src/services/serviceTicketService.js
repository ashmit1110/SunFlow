import { ServiceTicketStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { conflictError, notFoundError, unprocessableError, validationError } from '../utils/errors.js';
import { paginationArgs, paginationMeta } from '../utils/pagination.js';
import { money } from '../utils/money.js';
import { getWarrantyStatus } from '../utils/warranty.js';

const ticketInclude = {
  customer: { select: { id: true, name: true, phone: true, email: true } },
  equipment: { include: { product: { select: { id: true, sku: true, name: true, category: true, isSerialized: true } }, warranty: true } },
  order: { select: { id: true, status: true } },
  assignedUser: { select: { id: true, name: true } },
  charges: { orderBy: { id: 'asc' } },
};

function serializeTicket(ticket) {
  return {
    ...ticket,
    charges: ticket.charges?.map((charge) => ({ ...charge, amount: money(charge.amount) })),
    equipment: ticket.equipment ? { ...ticket.equipment, warranty: ticket.equipment.warranty ? { ...ticket.equipment.warranty, status: getWarrantyStatus(ticket.equipment.warranty) } : null } : null,
  };
}

export async function createTicket(input) {
  const equipment = await prisma.serializedEquipment.findUnique({
    where: { serialNumber: input.serialNumber },
    include: { warranty: true, installationOrder: { select: { id: true, customerId: true } } },
  });
  if (!equipment) throw notFoundError('Serial number is not registered');
  const customerId = equipment.currentCustomerId ?? equipment.installationOrder?.customerId;
  if (!customerId) {
    throw validationError('Cannot create a service ticket until this equipment is linked to a customer', {
      serialNumber: 'the equipment has no associated customer; the ticket schema requires customerId',
    });
  }

  return prisma.$transaction(async (tx) => {
    const count = await tx.serviceTicket.count();
    const ticketNumber = `SVC-${String(count + 1).padStart(5, '0')}`;
    try {
      return serializeTicket(await tx.serviceTicket.create({
        data: {
          ticketNumber,
          customerId,
          serializedEquipmentId: equipment.id,
          installationOrderId: equipment.installationOrder?.id ?? null,
          issueDescription: input.issueDescription,
          faultCode: input.faultCode,
          warrantyCovered: getWarrantyStatus(equipment.warranty) === 'ACTIVE',
        },
        include: ticketInclude,
      }));
    } catch (error) {
      if (error.code === 'P2002') throw conflictError('Unable to allocate a unique ticket number; retry the request');
      throw error;
    }
  });
}

export async function listTickets(query) {
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.customerId ? { customerId: query.customerId } : {}),
  };
  const [tickets, total] = await prisma.$transaction([
    prisma.serviceTicket.findMany({ where, ...paginationArgs(query), orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], include: ticketInclude }),
    prisma.serviceTicket.count({ where }),
  ]);
  return { data: tickets.map(serializeTicket), meta: paginationMeta(query, total) };
}

export async function getTicket(id) {
  const ticket = await prisma.serviceTicket.findUnique({ where: { id }, include: ticketInclude });
  if (!ticket) throw notFoundError('Service ticket not found');
  return serializeTicket(ticket);
}

const transitions = {
  [ServiceTicketStatus.OPEN]: [ServiceTicketStatus.IN_PROGRESS],
  [ServiceTicketStatus.IN_PROGRESS]: [ServiceTicketStatus.AWAITING_PARTS, ServiceTicketStatus.RESOLVED],
  [ServiceTicketStatus.AWAITING_PARTS]: [ServiceTicketStatus.IN_PROGRESS],
  [ServiceTicketStatus.RESOLVED]: [ServiceTicketStatus.CLOSED],
  [ServiceTicketStatus.CLOSED]: [],
};

export async function updateTicket(id, input) {
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.serviceTicket.findUnique({ where: { id }, include: { charges: true } });
    if (!ticket) throw notFoundError('Service ticket not found');
    if (input.status && input.status !== ticket.status && !transitions[ticket.status].includes(input.status)) {
      throw conflictError(`Invalid service-ticket transition: ${ticket.status} to ${input.status}`);
    }
    if (input.warrantyCovered !== undefined && input.warrantyCovered !== ticket.warrantyCovered
      && input.warrantyCovered && ticket.charges.length) {
      throw conflictError('Warranty coverage cannot be enabled while charges exist');
    }
    return serializeTicket(await tx.serviceTicket.update({
      where: { id },
      data: {
        ...(input.status ? { status: input.status, ...(input.status === ServiceTicketStatus.RESOLVED ? { resolvedAt: new Date() } : {}) } : {}),
        ...(input.warrantyCovered !== undefined ? { warrantyCovered: input.warrantyCovered } : {}),
      },
      include: ticketInclude,
    }));
  });
}

export async function addCharge(id, input) {
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.serviceTicket.findUnique({ where: { id } });
    if (!ticket) throw notFoundError('Service ticket not found');
    if (ticket.status === ServiceTicketStatus.CLOSED) throw conflictError('Charges cannot be added to a closed ticket');
    if (ticket.warrantyCovered) throw conflictError('Charges can be added only to a ticket not covered by warranty');
    const charge = await tx.serviceTicketCharge.create({
      data: { serviceTicketId: id, description: input.description, amount: input.amount, type: input.type },
    });
    const charges = await tx.serviceTicketCharge.findMany({ where: { serviceTicketId: id }, orderBy: { id: 'asc' } });
    return { ...ticket, charges: charges.map((item) => ({ ...item, amount: money(item.amount) })) };
  });
}
