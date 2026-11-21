import { Router } from 'express';
import { Role } from '@prisma/client';
import { z } from 'zod';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { paginationSchema } from '../utils/pagination.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../utils/validate.js';

const router = Router();
const roles = Object.values(Role);
const idSchema = z.object({ id: z.string().min(1) });
const listSchema = paginationSchema.extend({ role: z.enum(roles).optional() });
const createSchema = z.object({
  name: z.string().trim().min(1),
  email: z.email(),
  phone: z.string().trim().min(7).max(20),
  password: z.string().min(8),
  role: z.enum(roles),
});
const updateSchema = z.object({
  role: z.enum(roles).optional(),
  isActive: z.boolean().optional(),
}).refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' });

router.use(authenticate, authorize(['ADMIN']));
router.get('/', validate(listSchema, 'query'), asyncHandler(userController.list));
router.post('/', validate(createSchema), asyncHandler(userController.create));
router.patch('/:id', validate(idSchema, 'params'), validate(updateSchema), asyncHandler(userController.update));

export default router;
