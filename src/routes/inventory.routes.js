import { Router } from 'express';
import { z } from 'zod';
import * as inventoryController from '../controllers/inventoryController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paginationSchema } from '../utils/pagination.js';
import { validate } from '../utils/validate.js';

const router = Router();
const productIdSchema = z.object({ productId: z.string().min(1) });
const listSchema = paginationSchema;
const adjustSchema = z.object({
  type: z.enum(['INBOUND', 'OUTBOUND', 'ADJUSTMENT']),
  quantity: z.number().int().positive(),
  referenceType: z.string().trim().min(1).max(64),
  notes: z.string().trim().max(500).optional(),
});

router.use(authenticate, authorize(['WAREHOUSE', 'ADMIN']));
router.get('/', validate(listSchema, 'query'), asyncHandler(inventoryController.list));
router.post('/:productId/adjust', validate(productIdSchema, 'params'), validate(adjustSchema), asyncHandler(inventoryController.adjust));

export default router;
