import * as inventoryService from '../services/inventoryService.js';

export async function list(req, res) {
  res.status(200).json(await inventoryService.listInventory(req.validated.query));
}

export async function adjust(req, res) {
  const result = await inventoryService.adjustInventory(
    req.validated.params.productId,
    req.validated.body,
    req.user.id,
  );
  res.status(200).json({ data: result });
}
