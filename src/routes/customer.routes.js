import { Router } from 'express';
import { z } from 'zod';
import * as customerController from '../controllers/customerController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { paginationSchema } from '../utils/pagination.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../utils/validate.js';

const router = Router();
const phoneSchema = z.string().trim().regex(/^\+?[0-9][0-9 ()-]{5,18}[0-9]$/, 'phone must contain 7–15 digits');
const idSchema = z.object({ id: z.string().min(1) });
const createSchema = z.object({
  name: z.string().trim().min(1),
  phone: phoneSchema,
  email: z.union([z.email(), z.literal('')]).optional().transform((value) => value || null),
  address: z.string().trim().min(1),
});
const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  phone: phoneSchema.optional(),
  email: z.union([z.email(), z.literal(''), z.null()]).optional().transform((value) => value || null),
  address: z.string().trim().min(1).optional(),
}).refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' });
const listSchema = paginationSchema.extend({ search: z.string().trim().max(100).optional() });

router.use(authenticate);
router.post('/', authorize(['ADMIN', 'SALES']), validate(createSchema), asyncHandler(customerController.create));
router.get('/', authorize(['ADMIN', 'SALES', 'SUPPORT']), validate(listSchema, 'query'), asyncHandler(customerController.list));
router.get('/:id', authorize(['ADMIN', 'SALES', 'SUPPORT']), validate(idSchema, 'params'), asyncHandler(customerController.get));
router.patch('/:id', authorize(['ADMIN', 'SALES']), validate(idSchema, 'params'), validate(updateSchema), asyncHandler(customerController.update));

export default router;
