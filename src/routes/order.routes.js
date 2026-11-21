import { Router } from 'express';
import { JobExpenseType, OrderStatus, PaymentMethod, PaymentType } from '@prisma/client';
import { z } from 'zod';
import * as orderController from '../controllers/orderController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paginationSchema } from '../utils/pagination.js';
import { validate } from '../utils/validate.js';

const router = Router();
const idParams = z.object({ id: z.string().min(1) });
const listQuery = paginationSchema.extend({ status: z.enum(Object.values(OrderStatus)).optional() });
const moneyInput = z.string().regex(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/);
const expenseBody = z.object({
  type: z.enum(Object.values(JobExpenseType)),
  amount: moneyInput.refine((value) => Number(value) > 0, 'amount must be greater than zero'),
  description: z.string().trim().max(1000).optional(),
});
const paymentBody = z.object({
  amount: moneyInput.refine((value) => Number(value) > 0, 'amount must be greater than zero'),
  type: z.enum(Object.values(PaymentType)),
  method: z.enum(Object.values(PaymentMethod)),
});
const assignmentBody = z.object({
  technicianUserId: z.string().min(1),
  scheduledDate: z.iso.datetime({ offset: true }).optional(),
});
const paymentsQuery = paginationSchema;

router.get('/orders', authenticate, authorize(['SALES', 'WAREHOUSE', 'ADMIN']), validate(listQuery, 'query'), asyncHandler(orderController.list));
router.get('/orders/:id/picking-list', authenticate, authorize(['WAREHOUSE', 'ADMIN']), validate(idParams, 'params'), asyncHandler(orderController.pickingList));
router.get('/orders/:id/payments', authenticate, authorize(['SALES', 'ADMIN']), validate(idParams, 'params'), validate(paymentsQuery, 'query'), asyncHandler(orderController.listPayments));
router.post('/orders/:id/payments', authenticate, authorize(['SALES', 'ADMIN']), validate(idParams, 'params'), validate(paymentBody), asyncHandler(orderController.createPayment));
router.post('/orders/:id/assign-technician', authenticate, authorize(['SALES', 'ADMIN']), validate(idParams, 'params'), validate(assignmentBody), asyncHandler(orderController.assignTechnician));
router.post('/orders/:id/expenses', authenticate, authorize(['ADMIN', 'WAREHOUSE']), validate(idParams, 'params'), validate(expenseBody), asyncHandler(orderController.expense));
router.post('/orders/:id/cancel', authenticate, authorize(['SALES', 'ADMIN']), validate(idParams, 'params'), asyncHandler(orderController.cancel));
router.get('/orders/:id', authenticate, authorize(['SALES', 'WAREHOUSE', 'ADMIN']), validate(idParams, 'params'), asyncHandler(orderController.get));

export default router;
