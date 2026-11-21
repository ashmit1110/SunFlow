import { Router } from 'express';
import { z } from 'zod';
import * as installationController from '../controllers/installationController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { uploadInstallationImage } from '../middleware/upload.js';
import * as installationService from '../services/installationService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paginationSchema } from '../utils/pagination.js';
import { validate } from '../utils/validate.js';

const router = Router();
const idParams = z.object({ id: z.string().regex(/^[A-Za-z0-9_-]+$/) });
const fileParams = idParams.extend({ photoId: z.string().min(1) });
const myQuery = paginationSchema;
const checklistBody = z.object({
  checklist: z.record(z.string().trim().min(1), z.boolean()).optional(),
  confirmedCapacityKw: z.number().finite().min(1).max(5).optional(),
}).refine((body) => Object.keys(body).length > 0, { message: 'At least one checklist field is required' });
const completeBody = z.object({
  confirmedCapacityKw: z.number().finite().min(1).max(5).optional(),
  customerSignedName: z.string().trim().min(1).max(120),
});

const requireOwner = asyncHandler(async (req, _res, next) => {
  await installationService.assertCanUpload(req.validated.params.id, req.user.id);
  next();
});

router.get('/installations/my', authenticate, authorize(['TECHNICIAN']), validate(myQuery, 'query'), asyncHandler(installationController.listMy));
router.get('/installations/:id/photos/:photoId/file', authenticate, authorize(['TECHNICIAN', 'SALES', 'ADMIN', 'SUPPORT']), validate(fileParams, 'params'), asyncHandler(installationController.file));
router.patch('/installations/:id/start', authenticate, authorize(['TECHNICIAN']), validate(idParams, 'params'), asyncHandler(installationController.start));
router.patch('/installations/:id/checklist', authenticate, authorize(['TECHNICIAN']), validate(idParams, 'params'), validate(checklistBody), asyncHandler(installationController.checklist));
router.post('/installations/:id/photos', authenticate, authorize(['TECHNICIAN']), validate(idParams, 'params'), requireOwner, uploadInstallationImage.array('photos', 10), asyncHandler(installationController.photos));
router.post('/installations/:id/signature', authenticate, authorize(['TECHNICIAN']), validate(idParams, 'params'), requireOwner, uploadInstallationImage.single('signature'), asyncHandler(installationController.signature));
router.post('/installations/:id/complete', authenticate, authorize(['TECHNICIAN', 'ADMIN']), validate(idParams, 'params'), validate(completeBody), asyncHandler(installationController.complete));
router.get('/installations/:id', authenticate, authorize(['TECHNICIAN', 'SALES', 'ADMIN']), validate(idParams, 'params'), asyncHandler(installationController.get));

export default router;
