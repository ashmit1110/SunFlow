import { prisma } from '../config/database.js';
import { conflictError, notFoundError, validationError } from '../utils/errors.js';
import { paginationArgs, paginationMeta } from '../utils/pagination.js';
import { getWarrantyStatus } from '../utils/warranty.js';

const equipmentInclude = {
  product: { select: { id: true, sku: true, name: true, category: true, isSerialized: true, warrantyMonths: true } },
  currentCustomer: { select: { id: true, name: true, phone: true } },
  warranty: true,
};

export async function registerEquipment(input) {
  const product = await prisma.product.findUnique({ where: { id: input.productId }, select: { id: true, isSerialized: true } });
  if (!product) throw notFoundError('Product not found');
  if (!product.isSerialized) throw validationError('productId must refer to a serialized product');
  try {
    return await prisma.serializedEquipment.create({ data: input, include: equipmentInclude });
  } catch (error) {
    if (error.code === 'P2002') throw conflictError('Serial number already registered');
    throw error;
  }
}

export async function listEquipment(query) {
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.productId ? { productId: query.productId } : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.serializedEquipment.findMany({ where, ...paginationArgs(query), orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }], include: equipmentInclude }),
    prisma.serializedEquipment.count({ where }),
  ]);
  return { data: items.map((item) => ({ ...item, warranty: item.warranty ? { ...item.warranty, status: getWarrantyStatus(item.warranty) } : null })), meta: paginationMeta(query, total) };
}

export async function getBySerial(serial) {
  const item = await prisma.serializedEquipment.findUnique({ where: { serialNumber: serial }, include: equipmentInclude });
  if (!item) throw notFoundError('Serialized equipment not found');
  return { ...item, warranty: item.warranty ? { ...item.warranty, status: getWarrantyStatus(item.warranty) } : null };
}

export async function getPassport(serial) {
  const item = await prisma.serializedEquipment.findUnique({
    where: { serialNumber: serial },
    include: {
      product: { select: { id: true, sku: true, name: true, category: true, isSerialized: true, warrantyMonths: true } },
      currentCustomer: { select: { id: true, name: true, phone: true } },
      installationOrder: { include: { installationRecord: { include: { photos: { orderBy: { uploadedAt: 'asc' } } } } } },
      warranty: true,
      serviceTickets: { orderBy: { createdAt: 'desc' }, select: { id: true, ticketNumber: true, status: true, warrantyCovered: true, createdAt: true, issueDescription: true } },
    },
  });
  if (!item) throw notFoundError('Serialized equipment not found');
  const warranty = item.warranty;
  const record = item.installationOrder?.installationRecord;
  return {
    serialNumber: item.serialNumber,
    productName: item.product.name,
    manufacturer: item.manufacturer,
    model: item.model,
    status: item.status,
    customer: item.currentCustomer,
    installationOrderId: item.installationOrderId,
    deliveredAt: item.deliveredAt,
    warranty: warranty ? {
      startDate: warranty.warrantyStartDate,
      expiryDate: warranty.warrantyExpiryDate,
      status: getWarrantyStatus(warranty),
    } : null,
    photos: record?.photos.map((photo) => ({ filePath: photo.filePath, caption: photo.caption, uploadedAt: photo.uploadedAt, fileUrl: `/api/installations/${record.id}/photos/${photo.id}/file` })) ?? [],
    serviceHistory: item.serviceTickets,
  };
}
