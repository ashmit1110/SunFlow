import { Router } from 'express';
import { z } from 'zod';
import * as bomController from '../controllers/bomController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paginationSchema } from '../utils/pagination.js';
import { validate } from '../utils/validate.js';
import { systemTypes } from '../services/bomService.js';

const router = Router();
const idSchema = z.object({ id: z.string().min(1) });
const itemSchema = z.object({
  productId: z.string().min(1),
  quantityPerKw: z.number().finite().positive().optional(),
  quantityFixed: z.number().int().positive().max(2147483647).optional(),
  notes: z.string().trim().max(500).optional(),
}).refine((item) => (item.quantityPerKw !== undefined) !== (item.quantityFixed !== undefined), {
  message: 'exactly one of quantityPerKw or quantityFixed is required',
});
const createSchema = z.object({
  name: z.string().trim().min(1),
  systemType: z.enum(systemTypes),
  minCapacityKw: z.number().finite().min(1).max(5),
  maxCapacityKw: z.number().finite().min(1).max(5),
  description: z.string().trim().optional(),
  items: z.array(itemSchema).min(1),
}).refine((template) => template.minCapacityKw <= template.maxCapacityKw, {
  path: ['maxCapacityKw'],
  message: 'maxCapacityKw must be greater than or equal to minCapacityKw',
});
const listSchema = paginationSchema.extend({ systemType: z.enum(systemTypes).optional() });
const resolveSchema = z.object({
  systemType: z.enum(systemTypes),
  capacityKw: z.number().finite().min(1).max(5),
});

router.use(authenticate);
router.get('/', validate(listSchema, 'query'), asyncHandler(bomController.list));
router.post('/', authorize(['ADMIN']), validate(createSchema), asyncHandler(bomController.create));
router.post('/resolve', authorize(['SALES', 'ADMIN']), validate(resolveSchema), asyncHandler(bomController.resolve));
router.get('/:id', validate(idSchema, 'params'), asyncHandler(bomController.get));

export default router;
