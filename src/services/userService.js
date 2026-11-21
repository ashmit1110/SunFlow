import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { prisma } from '../config/database.js';
import { conflictError, notFoundError, validationError } from '../utils/errors.js';
import { paginationArgs, paginationMeta } from '../utils/pagination.js';

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
};

export async function listUsers(query) {
  const where = query.role ? { role: query.role } : {};
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({ where, ...paginationArgs(query), orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], select: publicUserSelect }),
    prisma.user.count({ where }),
  ]);
  return { data: users, meta: paginationMeta(query, total) };
}

export async function createUser(input) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  try {
    return await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        role: input.role,
        passwordHash,
      },
      select: publicUserSelect,
    });
  } catch (error) {
    if (error.code === 'P2002') throw conflictError('A user with this email or phone already exists');
    throw error;
  }
}

export async function updateUser(id, input) {
  if (Object.keys(input).length === 0) {
    throw validationError('At least one field is required', { body: 'provide role or isActive' });
  }
  if (input.isActive === true) {
    throw validationError('User activation is not supported by this endpoint', { isActive: 'must be false when provided' });
  }

  try {
    return await prisma.user.update({ where: { id }, data: input, select: publicUserSelect });
  } catch (error) {
    if (error.code === 'P2025') throw notFoundError('User not found');
    throw error;
  }
}

export const supportedRoles = Object.values(Role);
