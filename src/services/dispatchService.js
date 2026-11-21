import { DispatchStatus, EquipmentStatus, OrderStatus, StockMovementType } from '@prisma/client';
import { prisma } from '../config/database.js';
import { conflictError, notFoundError, unprocessableError, validationError } from '../utils/errors.js';

const dispatchInclude = {
  order: { include: { customer: true } },
  items: { include: { product: { select: { id: true, sku: true, name: true, category: true, unit: true, isSerialized: true } } } },
  equipment: { include: { product: { select: { id: true, sku: true, name: true, category: true, isSerialized: true } } } },
  dispatchedBy: { select: { id: true, name: true } },
};

function aggregateItems(items) {
  const map = new Map();
  for (const item of items) map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity);
  return map;
}

function compareRequirements(expected, actual, fields, label) {
  for (const [productId, quantity] of expected) {
    const selected = actual.get(productId) ?? 0;
    if (selected < quantity) fields[productId] = `${label} ${quantity}, selected ${selected}`;
    if (selected > quantity) fields[productId] = `${label} ${quantity}, selected ${selected} (exceeds BOM)`;
  }
  for (const [productId, quantity] of actual) {
    if (!expected.has(productId)) fields[productId] = `product ${productId} is not required by this order's BOM`;
  }
}

async function getOrderWithBom(client, orderId) {
  const order = await client.installationOrder.findUnique({
    where: { id: orderId },
    include: { quote: { include: { items: { include: { product: true } } } }, customer: true },
  });
  if (!order) throw notFoundError('Installation order not found');
  return order;
}

export async function createDispatch(orderId, input, userId) {
  if (new Set(input.serializedEquipmentIds).size !== input.serializedEquipmentIds.length) {
    throw validationError('serializedEquipmentIds must not contain duplicates');
  }
  const requestedItems = aggregateItems(input.nonSerializedItems);
  if (requestedItems.size !== input.nonSerializedItems.length) {
    throw validationError('nonSerializedItems must contain each product only once');
  }

  return prisma.$transaction(async (tx) => {
    const order = await getOrderWithBom(tx, orderId);
    if (order.status !== OrderStatus.CONFIRMED) throw conflictError('Only a CONFIRMED order can be dispatched');

    const serializedRequired = new Map();
    const nonSerializedRequired = new Map();
    for (const item of order.quote.items) {
      const target = item.product.isSerialized ? serializedRequired : nonSerializedRequired;
      target.set(item.productId, (target.get(item.productId) ?? 0) + item.quantity);
    }

    const equipment = input.serializedEquipmentIds.length
      ? await tx.serializedEquipment.findMany({ where: { id: { in: input.serializedEquipmentIds } }, select: { id: true, productId: true, status: true } })
      : [];
    const selectedIds = new Set(equipment.map(({ id }) => id));
    const selectedEquipmentCounts = new Map();
    const failures = {};
    for (const serialId of input.serializedEquipmentIds) {
      if (!selectedIds.has(serialId)) failures[serialId] = 'serialized equipment does not exist';
    }
    for (const unit of equipment) {
      if (unit.status !== EquipmentStatus.IN_STOCK) failures[unit.id] = 'serialized equipment is not IN_STOCK';
      if (!serializedRequired.has(unit.productId)) failures[unit.id] = 'product is not required by this order BOM';
      selectedEquipmentCounts.set(unit.productId, (selectedEquipmentCounts.get(unit.productId) ?? 0) + 1);
    }
    compareRequirements(serializedRequired, selectedEquipmentCounts, failures, 'required');
    compareRequirements(nonSerializedRequired, requestedItems, failures, 'required');

    for (const [productId, quantity] of nonSerializedRequired) {
      const inventory = await tx.inventory.findUnique({ where: { productId }, select: { quantityOnHand: true } });
      if (!inventory || inventory.quantityOnHand < quantity) {
        failures[productId] = `requested ${quantity}, available ${inventory?.quantityOnHand ?? 0}`;
      }
    }
    if (Object.keys(failures).length) {
      throw unprocessableError('Dispatch cannot be prepared — insufficient stock or missing serials', failures);
    }

    const dispatch = await tx.dispatch.create({
      data: {
        installationOrderId: orderId,
        dispatchedByUserId: userId,
        status: DispatchStatus.PREPARED,
        items: { create: input.nonSerializedItems },
      },
    });
    for (const serialId of input.serializedEquipmentIds) {
      const reserved = await tx.serializedEquipment.updateMany({
        where: { id: serialId, status: EquipmentStatus.IN_STOCK },
        data: { status: EquipmentStatus.RESERVED, dispatchId: dispatch.id, installationOrderId: orderId },
      });
      if (reserved.count !== 1) throw conflictError(`Serialized equipment ${serialId} was reserved by another dispatch`);
    }
    return tx.dispatch.findUnique({ where: { id: dispatch.id }, include: dispatchInclude });
  });
}

export async function confirmDispatch(id, userId) {
  return prisma.$transaction(async (tx) => {
    const dispatch = await tx.dispatch.findUnique({
      where: { id },
      include: {
        ...dispatchInclude,
        order: {
          include: {
            customer: true,
            quote: { include: { items: { include: { product: true } } } },
          },
        },
      },
    });
    if (!dispatch) throw notFoundError('Dispatch not found');
    if (dispatch.status !== DispatchStatus.PREPARED) throw conflictError('Only a PREPARED dispatch can be confirmed');
    if (dispatch.order.status !== OrderStatus.CONFIRMED) throw conflictError('The installation order is not CONFIRMED');

    const expectedSerialized = new Map();
    for (const item of dispatch.order.quote.items) {
      if (item.product.isSerialized) expectedSerialized.set(item.productId, (expectedSerialized.get(item.productId) ?? 0) + item.quantity);
    }
    const reservedByProduct = new Map();
    const reservationErrors = {};
    for (const equipment of dispatch.equipment) {
      if (equipment.status !== EquipmentStatus.RESERVED || equipment.dispatchId !== id) reservationErrors[equipment.id] = 'equipment is not reserved for this dispatch';
      reservedByProduct.set(equipment.productId, (reservedByProduct.get(equipment.productId) ?? 0) + 1);
    }
    compareRequirements(expectedSerialized, reservedByProduct, reservationErrors, 'required');
    if (Object.keys(reservationErrors).length) throw unprocessableError('Dispatch is missing required serialized equipment', reservationErrors);
    for (const item of dispatch.items) {
      const decrement = await tx.inventory.updateMany({
        where: { productId: item.productId, quantityOnHand: { gte: item.quantity } },
        data: { quantityOnHand: { decrement: item.quantity } },
      });
      if (decrement.count !== 1) {
        const inventory = await tx.inventory.findUnique({ where: { productId: item.productId }, select: { quantityOnHand: true } });
        throw unprocessableError('Stock changed after dispatch preparation', {
          [item.productId]: `requested ${item.quantity}, available ${inventory?.quantityOnHand ?? 0}`,
        });
      }
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: StockMovementType.OUTBOUND,
          quantity: item.quantity,
          referenceType: 'DISPATCH',
          referenceId: id,
          createdByUserId: userId,
        },
      });
    }
    await tx.serializedEquipment.updateMany({
      where: { dispatchId: id, status: EquipmentStatus.RESERVED },
      data: { status: EquipmentStatus.DISPATCHED, currentCustomerId: dispatch.order.customerId },
    });
    await tx.installationOrder.update({ where: { id: dispatch.installationOrderId }, data: { status: OrderStatus.DISPATCHED } });
    const updatedDispatch = await tx.dispatch.update({ where: { id }, data: { status: DispatchStatus.DISPATCHED, dispatchDate: new Date() }, include: dispatchInclude });
    return { ...updatedDispatch, order: { id: dispatch.installationOrderId, status: OrderStatus.DISPATCHED } };
  });
}

export async function deliverDispatch(id) {
  return prisma.$transaction(async (tx) => {
    const dispatch = await tx.dispatch.findUnique({ where: { id } });
    if (!dispatch) throw notFoundError('Dispatch not found');
    if (dispatch.status !== DispatchStatus.DISPATCHED) throw conflictError('Only a DISPATCHED dispatch can be marked delivered');
    return tx.dispatch.update({ where: { id }, data: { status: DispatchStatus.DELIVERED, deliveredDate: new Date() }, include: dispatchInclude });
  });
}

export async function getDispatch(id) {
  const dispatch = await prisma.dispatch.findUnique({ where: { id }, include: dispatchInclude });
  if (!dispatch) throw notFoundError('Dispatch not found');
  return dispatch;
}
