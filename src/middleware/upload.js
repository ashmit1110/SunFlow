import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import { validationError } from '../utils/errors.js';

const uploadRoot = path.resolve(process.cwd(), 'uploads', 'installations');
const storage = multer.diskStorage({
  destination: async (req, _file, callback) => {
    const folder = path.join(uploadRoot, req.validated.params.id);
    try { await mkdir(folder, { recursive: true }); callback(null, folder); } catch (error) { callback(error); }
  },
  filename: (_req, file, callback) => {
    const ext = file.mimetype === 'image/png' ? '.png' : '.jpg';
    callback(null, `${randomUUID()}${ext}`);
  },
});

export const uploadInstallationImage = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, callback) => {
    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      return callback(validationError('Only JPEG and PNG image files are accepted', { file: 'unsupported image type' }));
    }
    return callback(null, true);
  },
});
