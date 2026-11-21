import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { unauthorizedError } from '../utils/errors.js';

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user?.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
    throw unauthorizedError('Email or password is incorrect');
  }

  const token = jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    algorithm: 'HS256',
    expiresIn: '12h',
  });

  return {
    token,
    user: { id: user.id, name: user.name, role: user.role },
  };
}

export async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true },
  });
  if (!user) throw unauthorizedError('The current user no longer exists');
  return user;
}
