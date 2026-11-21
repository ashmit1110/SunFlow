import { Router } from 'express';
import { z } from 'zod';
import * as dashboardController from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../utils/validate.js';

const router = Router();
const summaryQuery = z.object({ range: z.enum(['today', 'week', 'month']).default('month') });
router.get('/dashboard/summary', authenticate, authorize(['ADMIN']), validate(summaryQuery, 'query'), asyncHandler(dashboardController.summary));
router.get('/dashboard/orders-profitability', authenticate, authorize(['ADMIN']), asyncHandler(dashboardController.profitability));
router.get('/dashboard/service-overview', authenticate, authorize(['ADMIN', 'SUPPORT']), asyncHandler(dashboardController.serviceOverview));
export default router;
