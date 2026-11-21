import { createReadStream } from 'node:fs';
import { open, unlink } from 'node:fs/promises';
import path from 'node:path';
import * as installationService from '../services/installationService.js';
import { validationError } from '../utils/errors.js';

async function assertImageSignature(file) {
  if (!file) throw validationError('An image file is required', { file: 'upload a JPEG or PNG image' });
  const handle = await open(file.path, 'r');
  try {
    const bytes = Buffer.alloc(8);
    const { bytesRead } = await handle.read(bytes, 0, bytes.length, 0);
    const header = bytes.subarray(0, bytesRead);
    const jpeg = file.mimetype === 'image/jpeg' && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    const png = file.mimetype === 'image/png' && header.length >= 8 && header.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (!jpeg && !png) {
      await unlink(file.path).catch(() => {});
      throw validationError('Uploaded file contents must be a JPEG or PNG image', { file: 'invalid image signature' });
    }
  } finally {
    await handle.close();
  }
}

export async function listMy(req, res) { res.status(200).json(await installationService.getMyInstallations(req.user.id, req.validated.query)); }
export async function get(req, res) { res.status(200).json({ data: await installationService.getInstallation(req.validated.params.id, req.user) }); }
export async function start(req, res) { res.status(200).json({ data: await installationService.startInstallation(req.validated.params.id, req.user.id) }); }
export async function checklist(req, res) {
  res.status(200).json({ data: await installationService.updateChecklist(req.validated.params.id, req.user.id, req.validated.body) });
}
export async function photos(req, res) {
  try {
    for (const file of req.files) await assertImageSignature(file);
    const photos = await installationService.persistPhotos(req.validated.params.id, req.user.id, req.files, req.body.caption);
    res.status(201).json({ data: photos.map((photo) => ({ ...photo, fileUrl: `/api/installations/${req.validated.params.id}/photos/${photo.id}/file` })) });
  } catch (error) {
    await Promise.all((req.files ?? []).map((file) => unlink(file.path).catch(() => {})));
    throw error;
  }
}
export async function signature(req, res) {
  try {
    await assertImageSignature(req.file);
    res.status(201).json({ data: await installationService.persistSignature(req.validated.params.id, req.user.id, req.file, req.body.customerSignedName) });
  } catch (error) {
    if (req.file?.path) await unlink(req.file.path).catch(() => {});
    throw error;
  }
}
export async function complete(req, res) {
  res.status(200).json({ data: await installationService.completeInstallation(req.validated.params.id, req.user, req.validated.body) });
}
export async function file(req, res) {
  const relative = await installationService.getPhotoFile(req.validated.params.id, req.validated.params.photoId, req.user);
  const root = path.resolve(process.cwd(), 'uploads');
  const absolute = path.resolve(root, relative);
  if (!absolute.startsWith(`${root}${path.sep}`)) throw validationError('Invalid stored file path');
  res.type(path.extname(absolute));
  createReadStream(absolute).on('error', () => {
    if (!res.headersSent) res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Installation photo file not found' } });
  }).pipe(res);
}
