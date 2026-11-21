import { Router } from 'express';
import { SystemType } from '@prisma/client';
import { z } from 'zod';
import * as quoteController from '../controllers/quoteController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../utils/validate.js';

const router = Router();
const idSchema = z.object({ id: z.string().min(1) });
const leadIdSchema = z.object({ leadId: z.string().min(1) });
const moneyString = z.string().regex(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/, 'amount must be a non-negative decimal with up to 2 places');
const createSchema = z.object({
  systemType: z.enum(Object.values(SystemType)),
  capacityKw: z.number().finite().min(1).max(5),
  discount: moneyString.optional().default('0.00'),
  tax: moneyString.optional().default('0.00'),
  validUntil: z.iso.date().optional(),
});
const itemSchema = z.object({ productId: z.string().min(1), quantity: z.number().int().positive().max(2147483647) });
const updateItemsSchema = z.object({
  items: z.array(itemSchema).min(1),
}).refine((body) => new Set(body.items.map((item) => item.productId)).size === body.items.length, {
  path: ['items'],
  message: 'productId values must be unique',
});

const quoteAccess = [authenticate, authorize(['SALES', 'ADMIN'])];
router.post('/leads/:leadId/quotes', ...quoteAccess, validate(leadIdSchema, 'params'), validate(createSchema), asyncHandler(quoteController.create));
router.get('/quotes/:id', ...quoteAccess, validate(idSchema, 'params'), asyncHandler(quoteController.get));
router.patch('/quotes/:id/items', ...quoteAccess, validate(idSchema, 'params'), validate(updateItemsSchema), asyncHandler(quoteController.updateItems));
router.post('/quotes/:id/send', ...quoteAccess, validate(idSchema, 'params'), asyncHandler(quoteController.send));
router.post('/quotes/:id/accept', ...quoteAccess, validate(idSchema, 'params'), asyncHandler(quoteController.accept));
router.post('/quotes/:id/reject', ...quoteAccess, validate(idSchema, 'params'), asyncHandler(quoteController.reject));

export default router;
