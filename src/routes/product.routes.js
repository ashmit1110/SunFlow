import { Router } from 'express';
import { ProductCategory } from '@prisma/client';
import { z } from 'zod';
import * as productController from '../controllers/productController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paginationSchema } from '../utils/pagination.js';
import { validate } from '../utils/validate.js';

const router = Router();
const idSchema = z.object({ id: z.string().min(1) });
const booleanQuery = z.enum(['true', 'false']).transform((value) => value === 'true');
const listSchema = paginationSchema.extend({
  category: z.enum(Object.values(ProductCategory)).optional(),
  isSerialized: booleanQuery.optional(),
});
const moneyString = z.string().regex(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/, 'unitPrice must be a non-negative decimal with up to 2 places');
const createSchema = z.object({
  sku: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1),
  category: z.enum(Object.values(ProductCategory)),
  isSerialized: z.boolean(),
  unitPrice: moneyString,
  unit: z.string().trim().min(1),
  warrantyMonths: z.number().int().nonnegative().default(0),
});
const updateSchema = z.object({
  sku: z.string().trim().min(1).max(64).optional(),
  name: z.string().trim().min(1).optional(),
  category: z.enum(Object.values(ProductCategory)).optional(),
  isSerialized: z.boolean().optional(),
  unitPrice: moneyString.optional(),
  unit: z.string().trim().min(1).optional(),
  warrantyMonths: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
}).refine((body) => Object.keys(body).length > 0, { message: 'At least one product field is required' });
const movementListSchema = paginationSchema;

router.use(authenticate);
router.get('/', validate(listSchema, 'query'), asyncHandler(productController.list));
router.post('/', authorize(['ADMIN', 'WAREHOUSE']), validate(createSchema), asyncHandler(productController.create));
router.patch('/:id', authorize(['ADMIN', 'WAREHOUSE']), validate(idSchema, 'params'), validate(updateSchema), asyncHandler(productController.update));
router.get('/:id/stock-movements', authorize(['ADMIN', 'WAREHOUSE']), validate(idSchema, 'params'), validate(movementListSchema, 'query'), asyncHandler(productController.stockMovements));

export default router;
