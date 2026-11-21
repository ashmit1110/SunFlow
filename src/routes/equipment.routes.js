import { Router } from 'express';
import { EquipmentStatus } from '@prisma/client';
import { z } from 'zod';
import * as equipmentController from '../controllers/equipmentController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paginationSchema } from '../utils/pagination.js';
import { validate } from '../utils/validate.js';

const router = Router();
const serialParams = z.object({ serial: z.string().trim().min(1).max(128) });
const listQuery = paginationSchema.extend({
  status: z.enum(Object.values(EquipmentStatus)).optional(),
  productId: z.string().min(1).optional(),
});
const createBody = z.object({
  serialNumber: z.string().trim().min(1).max(128),
  productId: z.string().min(1),
  manufacturer: z.string().trim().max(120).optional(),
  model: z.string().trim().max(120).optional(),
});

router.post('/equipment', authenticate, authorize(['WAREHOUSE', 'ADMIN']), validate(createBody), asyncHandler(equipmentController.create));
router.get('/equipment', authenticate, authorize(['WAREHOUSE', 'ADMIN', 'SUPPORT']), validate(listQuery, 'query'), asyncHandler(equipmentController.list));
router.get('/equipment/:serial/passport', authenticate, authorize(['SUPPORT', 'ADMIN', 'WAREHOUSE']), validate(serialParams, 'params'), asyncHandler(equipmentController.passport));
router.get('/equipment/:serial', authenticate, authorize(['WAREHOUSE', 'ADMIN', 'SUPPORT']), validate(serialParams, 'params'), asyncHandler(equipmentController.get));

export default router;
