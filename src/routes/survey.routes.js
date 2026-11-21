import { Router } from 'express';
import { z } from 'zod';
import * as surveyController from '../controllers/surveyController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../utils/validate.js';

const router = Router();
const idSchema = z.object({ id: z.string().min(1) });
const leadIdSchema = z.object({ leadId: z.string().min(1) });
const createSchema = z.object({
  roofDirection: z.string().trim().min(1),
  roofTiltDegrees: z.number().finite().nonnegative(),
  cableDistanceMeters: z.number().finite().nonnegative(),
});
const rejectSchema = z.object({ rejectionReason: z.string().trim().min(1) });

router.post('/leads/:leadId/surveys', authenticate, authorize(['SALES', 'TECHNICIAN', 'ADMIN']), validate(leadIdSchema, 'params'), validate(createSchema), asyncHandler(surveyController.create));
router.get('/surveys/:id', authenticate, authorize(['SALES', 'ADMIN']), validate(idSchema, 'params'), asyncHandler(surveyController.get));
router.post('/surveys/:id/approve', authenticate, authorize(['SALES', 'ADMIN']), validate(idSchema, 'params'), asyncHandler(surveyController.approve));
router.post('/surveys/:id/reject', authenticate, authorize(['SALES', 'ADMIN']), validate(idSchema, 'params'), validate(rejectSchema), asyncHandler(surveyController.reject));

export default router;
