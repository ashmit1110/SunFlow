import { prisma } from '../config/database.js';
import { conflictError, notFoundError } from '../utils/errors.js';
import { paginationArgs, paginationMeta } from '../utils/pagination.js';

const customerListSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  address: true,
  createdAt: true,
};

export async function createCustomer(input) {
  try {
    return await prisma.customer.create({ data: input, select: customerListSelect });
  } catch (error) {
    if (error.code === 'P2002') throw conflictError('A customer with this phone number already exists');
    throw error;
  }
}

export async function listCustomers(query) {
  const search = query.search?.trim();
  const where = search
    ? { OR: ['name', 'phone', 'email'].map((field) => ({ [field]: { contains: search } })) }
    : {};
  const [customers, total] = await prisma.$transaction([
    prisma.customer.findMany({ where, ...paginationArgs(query), orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], select: customerListSelect }),
    prisma.customer.count({ where }),
  ]);
  return { data: customers, meta: paginationMeta(query, total) };
}

export async function getCustomer(id) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { createdAt: 'desc' } },
      tickets: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!customer) throw notFoundError('Customer not found');
  return customer;
}

export async function updateCustomer(id, input) {
  try {
    return await prisma.customer.update({ where: { id }, data: input, select: customerListSelect });
  } catch (error) {
    if (error.code === 'P2025') throw notFoundError('Customer not found');
    if (error.code === 'P2002') throw conflictError('A customer with this phone number already exists');
    throw error;
  }
}
