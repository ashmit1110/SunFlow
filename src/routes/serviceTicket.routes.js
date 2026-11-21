import { Router } from 'express';
import { ServiceTicketStatus } from '@prisma/client';
import { z } from 'zod';
import * as serviceTicketController from '../controllers/serviceTicketController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paginationSchema } from '../utils/pagination.js';
import { validate } from '../utils/validate.js';

const router = Router();
const idParams = z.object({ id: z.string().min(1) });
const query = paginationSchema.extend({ status: z.enum(Object.values(ServiceTicketStatus)).optional(), customerId: z.string().min(1).optional() });
const createBody = z.object({ serialNumber: z.string().trim().min(1).max(128), issueDescription: z.string().trim().min(1).max(4000), faultCode: z.string().trim().max(128).optional() });
const updateBody = z.object({ status: z.enum(Object.values(ServiceTicketStatus)).optional(), warrantyCovered: z.boolean().optional() })
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' });
const chargeBody = z.object({
  description: z.string().trim().min(1).max(500),
  amount: z.string().regex(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/).refine((value) => Number(value) > 0, 'amount must be greater than zero'),
  type: z.enum(['PART', 'LABOUR']),
});
const roles = [authenticate, authorize(['SUPPORT', 'ADMIN'])];

router.post('/service-tickets', ...roles, validate(createBody), asyncHandler(serviceTicketController.create));
router.get('/service-tickets', ...roles, validate(query, 'query'), asyncHandler(serviceTicketController.list));
router.get('/service-tickets/:id', ...roles, validate(idParams, 'params'), asyncHandler(serviceTicketController.get));
router.patch('/service-tickets/:id/status', ...roles, validate(idParams, 'params'), validate(updateBody), asyncHandler(serviceTicketController.update));
router.post('/service-tickets/:id/charges', ...roles, validate(idParams, 'params'), validate(chargeBody), asyncHandler(serviceTicketController.addCharge));

export default router;
