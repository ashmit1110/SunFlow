import { Router } from 'express';
import { LeadStatus, SystemType } from '@prisma/client';
import { z } from 'zod';
import * as leadController from '../controllers/leadController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { paginationSchema } from '../utils/pagination.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../utils/validate.js';

const router = Router();
const idSchema = z.object({ id: z.string().min(1) });
const phoneSchema = z.string().trim().regex(/^\+?[0-9][0-9 ()-]{5,18}[0-9]$/, 'customerPhone must contain 7–15 digits');
const createSchema = z.object({
  customerName: z.string().trim().min(1),
  customerPhone: phoneSchema,
  customerAddress: z.string().trim().min(1),
  requestedCapacityKw: z.number().finite().min(1).max(5),
  systemTypeInterest: z.enum(Object.values(SystemType)).optional().nullable(),
  subsidyInterest: z.boolean().default(false),
  source: z.string().trim().min(1).optional(),
  assignedSalesUserId: z.string().min(1).optional(),
});
const qualifySchema = z.object({
  shadowFreeRoofAreaSqm: z.number().finite().nonnegative().optional(),
  avgMonthlyBillInr: z.number().finite().nonnegative().optional(),
  gridSuitable: z.boolean().optional(),
}).refine((body) => Object.keys(body).length > 0, { message: 'At least one qualification field is required' });
const statusSchema = z.object({ status: z.enum(Object.values(LeadStatus)) });
const listSchema = paginationSchema.extend({ status: z.enum(Object.values(LeadStatus)).optional() });

router.use(authenticate, authorize(['SALES', 'ADMIN']));
router.post('/', validate(createSchema), asyncHandler(leadController.create));
router.get('/', validate(listSchema, 'query'), asyncHandler(leadController.list));
router.get('/:id', validate(idSchema, 'params'), asyncHandler(leadController.get));
router.patch('/:id/qualify', validate(idSchema, 'params'), validate(qualifySchema), asyncHandler(leadController.qualify));
router.patch('/:id/status', validate(idSchema, 'params'), validate(statusSchema), asyncHandler(leadController.updateStatus));

export default router;
