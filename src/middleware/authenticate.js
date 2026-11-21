import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { unauthorizedError } from '../utils/errors.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const authorization = req.get('authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) throw unauthorizedError('A valid Bearer token is required');

  let payload;
  try {
    payload = jwt.verify(match[1], env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    throw unauthorizedError('The access token is invalid or expired');
  }

  if (!payload || typeof payload !== 'object' || typeof payload.sub !== 'string') {
    throw unauthorizedError('The access token is invalid');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  if (!user?.isActive) throw unauthorizedError('This account is inactive or no longer exists');

  req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  return next();
});
