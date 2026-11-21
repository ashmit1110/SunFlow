import { Router } from 'express';
import { z } from 'zod';
import * as dispatchController from '../controllers/dispatchController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../utils/validate.js';

const router = Router();
const idParams = z.object({ id: z.string().min(1) });
const createBody = z.object({
  serializedEquipmentIds: z.array(z.string().min(1)).default([]),
  nonSerializedItems: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().positive().max(2147483647) })).default([]),
});

router.post('/orders/:id/dispatches', authenticate, authorize(['WAREHOUSE', 'ADMIN']), validate(idParams, 'params'), validate(createBody), asyncHandler(dispatchController.create));
router.post('/dispatches/:id/confirm', authenticate, authorize(['WAREHOUSE', 'ADMIN']), validate(idParams, 'params'), asyncHandler(dispatchController.confirm));
router.post('/dispatches/:id/deliver', authenticate, authorize(['WAREHOUSE', 'TECHNICIAN', 'ADMIN']), validate(idParams, 'params'), asyncHandler(dispatchController.deliver));
router.get('/dispatches/:id', authenticate, authorize(['WAREHOUSE', 'ADMIN']), validate(idParams, 'params'), asyncHandler(dispatchController.get));

export default router;
