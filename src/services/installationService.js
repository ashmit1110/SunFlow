import { EquipmentStatus, OrderStatus, Role } from '@prisma/client';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../config/database.js';
import { conflictError, forbiddenError, notFoundError, unprocessableError, validationError } from '../utils/errors.js';
import { addCalendarMonths } from '../utils/warranty.js';

const recordInclude = {
  technician: { select: { id: true, name: true, email: true, phone: true } },
  photos: { orderBy: { uploadedAt: 'asc' } },
  order: { include: { customer: true, quote: { include: { items: { include: { product: true } } } }, serializedEquipment: { include: { product: true, warranty: true } } } },
};

export async function assignTechnician(orderId, input) {
  const order = await prisma.installationOrder.findUnique({ where: { id: orderId } });
  if (!order) throw notFoundError('Installation order not found');
  if (![OrderStatus.CONFIRMED, OrderStatus.DISPATCHED].includes(order.status)) {
    throw conflictError('Technicians can be assigned only to CONFIRMED or DISPATCHED orders');
  }
  const technician = await prisma.user.findUnique({ where: { id: input.technicianUserId }, select: { id: true, role: true, isActive: true } });
  if (!technician || technician.role !== Role.TECHNICIAN || !technician.isActive) {
    throw validationError('technicianUserId must identify an active TECHNICIAN');
  }
  const scheduledDate = input.scheduledDate ? new Date(input.scheduledDate) : null;
  return prisma.$transaction(async (tx) => {
    await tx.installationOrder.update({ where: { id: orderId }, data: { scheduledDate } });
    return tx.installationRecord.upsert({
      where: { installationOrderId: orderId },
      create: { installationOrderId: orderId, technicianUserId: technician.id, scheduledDate, status: order.status },
      update: { technicianUserId: technician.id, scheduledDate },
      include: recordInclude,
    });
  });
}

export async function getMyInstallations(userId, query) {
  const [records, total] = await prisma.$transaction([
    prisma.installationRecord.findMany({ where: { technicianUserId: userId }, skip: (query.page - 1) * query.pageSize, take: query.pageSize, orderBy: [{ scheduledDate: 'asc' }, { id: 'asc' }], include: recordInclude }),
    prisma.installationRecord.count({ where: { technicianUserId: userId } }),
  ]);
  return { data: records.map(serializeInstallation), meta: { page: query.page, pageSize: query.pageSize, total } };
}

export async function getInstallation(id, user) {
  const record = await prisma.installationRecord.findUnique({ where: { id }, include: recordInclude });
  if (!record) throw notFoundError('Installation record not found');
  if (user.role === Role.TECHNICIAN && record.technicianUserId !== user.id) throw forbiddenError();
  return serializeInstallation(record);
}

function serializeInstallation(record) {
  let checklist = {};
  try { checklist = JSON.parse(record.checklistJson); } catch { /* invalid persisted JSON is handled as empty in read response */ }
  return { ...record, checklist, checklistJson: undefined };
}

async function ownedRecord(installationId, userId, client = prisma) {
  const record = await client.installationRecord.findUnique({ where: { id: installationId }, include: recordInclude });
  if (!record) throw notFoundError('Installation record not found');
  if (record.technicianUserId !== userId) throw forbiddenError('This installation is assigned to another technician');
  if (record.completedAt) throw conflictError('The installation is already complete');
  return record;
}

export async function assertCanUpload(installationId, userId) {
  await ownedRecord(installationId, userId);
}

export async function startInstallation(id, userId) {
  const record = await ownedRecord(id, userId);
  if (record.order.status !== OrderStatus.DISPATCHED) throw conflictError('The order must be DISPATCHED before work can start');
  if (record.startedAt) throw conflictError('Installation work has already started');
  return prisma.installationRecord.update({ where: { id }, data: { startedAt: new Date(), status: OrderStatus.DISPATCHED } }).then((updated) => ({ ...serializeInstallation({ ...record, ...updated }) }));
}

export async function updateChecklist(id, userId, input) {
  return prisma.$transaction(async (tx) => {
    const record = await ownedRecord(id, userId, tx);
    if (record.order.status !== OrderStatus.DISPATCHED) throw conflictError('The order must be DISPATCHED before updating an installation checklist');
    const existing = JSON.parse(record.checklistJson || '{}');
    const checklist = { ...existing, ...(input.checklist ?? {}) };
    const updated = await tx.installationRecord.update({
      where: { id },
      data: { checklistJson: JSON.stringify(checklist), ...(input.confirmedCapacityKw !== undefined ? { confirmedCapacityKw: input.confirmedCapacityKw } : {}) },
      include: recordInclude,
    });
    return serializeInstallation(updated);
  });
}

export async function persistPhotos(id, userId, files, caption) {
  if (!files?.length) throw validationError('At least one installation photo is required', { photos: 'upload one or more JPEG or PNG files' });
  try {
    return await prisma.$transaction(async (tx) => {
      const record = await ownedRecord(id, userId, tx);
      const created = [];
      for (const file of files) {
        const relativePath = `installations/${id}/${file.filename}`;
        created.push(await tx.installationPhoto.create({
          data: { installationRecordId: record.id, filePath: relativePath, caption: caption || null },
        }));
      }
      return created;
    });
  } catch (error) {
    await Promise.all(files.map((file) => unlink(file.path).catch(() => {})));
    throw error;
  }
}

export async function persistSignature(id, userId, file, customerSignedName) {
  if (!file) throw validationError('A signature image is required', { signature: 'upload one JPEG or PNG file' });
  try {
    return await prisma.$transaction(async (tx) => {
      const record = await ownedRecord(id, userId, tx);
      const signatureImagePath = `installations/${id}/${file.filename}`;
      const updated = await tx.installationRecord.update({ where: { id }, data: { signatureImagePath, ...(customerSignedName ? { customerSignedName } : {}) } });
      if (record.signatureImagePath && record.signatureImagePath !== signatureImagePath) {
        await unlink(path.resolve(process.cwd(), 'uploads', record.signatureImagePath)).catch(() => {});
      }
      return { signatureImagePath: updated.signatureImagePath, customerSignedName: updated.customerSignedName };
    });
  } catch (error) {
    await unlink(file.path).catch(() => {});
    throw error;
  }
}

export async function getPhotoFile(id, photoId, user) {
  const photo = await prisma.installationPhoto.findUnique({ where: { id: photoId }, include: { record: { select: { id: true, technicianUserId: true } } } });
  if (!photo || photo.record.id !== id) throw notFoundError('Installation photo not found');
  if (user.role === Role.TECHNICIAN && photo.record.technicianUserId !== user.id) throw forbiddenError();
  return photo.filePath;
}

export async function completeInstallation(id, user, input) {
  return prisma.$transaction(async (tx) => {
    const record = await tx.installationRecord.findUnique({ where: { id }, include: recordInclude });
    if (!record) throw notFoundError('Installation record not found');
    if (user.role === Role.TECHNICIAN && record.technicianUserId !== user.id) throw forbiddenError();
    if (record.completedAt) throw conflictError('Installation is already complete');
    if (record.order.status !== OrderStatus.DISPATCHED) throw conflictError('The order must be DISPATCHED before installation can be completed');
    if (!record.signatureImagePath) throw unprocessableError('A customer signature is required before completion', { signature: 'upload a signature first' });
    const checklist = JSON.parse(record.checklistJson || '{}');
    const incomplete = Object.entries(checklist).filter(([, value]) => value !== true).map(([key]) => key);
    if (incomplete.length) throw unprocessableError('Installation checklist is incomplete', { checklist: incomplete.join(', ') });

    const completedAt = new Date();
    const completedCapacityKw = input.confirmedCapacityKw ?? record.confirmedCapacityKw;
    if (!completedCapacityKw) throw validationError('confirmedCapacityKw is required, either in this request or the saved checklist');
    const updatedRecord = await tx.installationRecord.update({
      where: { id },
      data: { completedAt, confirmedCapacityKw: completedCapacityKw, customerSignedName: input.customerSignedName, status: OrderStatus.INSTALLED },
    });
    let warrantiesCreated = 0;
    for (const unit of record.order.serializedEquipment) {
      if (unit.status !== EquipmentStatus.DISPATCHED) throw conflictError(`Serialized equipment ${unit.serialNumber} is not DISPATCHED`);
      const warrantyExpiryDate = addCalendarMonths(completedAt, unit.product.warrantyMonths);
      await tx.serializedEquipment.update({ where: { id: unit.id }, data: { status: EquipmentStatus.INSTALLED, deliveredAt: completedAt } });
      await tx.warranty.create({
        data: {
          serializedEquipmentId: unit.id,
          installationOrderId: record.order.id,
          customerId: record.order.customerId,
          warrantyStartDate: completedAt,
          warrantyMonths: unit.product.warrantyMonths,
          warrantyExpiryDate,
        },
      });
      warrantiesCreated += 1;
    }
    const order = await tx.installationOrder.update({ where: { id: record.order.id }, data: { status: OrderStatus.INSTALLED } });
    return {
      installationRecord: { id: updatedRecord.id, status: updatedRecord.status, completedAt: updatedRecord.completedAt },
      order: { id: order.id, status: order.status },
      warrantiesCreated,
    };
  });
}
