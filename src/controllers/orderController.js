import * as orderService from '../services/orderService.js';
import * as paymentService from '../services/paymentService.js';
import * as installationService from '../services/installationService.js';

export async function list(req, res) { res.status(200).json(await orderService.listOrders(req.validated.query)); }
export async function get(req, res) { res.status(200).json({ data: await orderService.getOrder(req.validated.params.id) }); }
export async function pickingList(req, res) { res.status(200).json({ data: await orderService.getPickingList(req.validated.params.id) }); }
export async function cancel(req, res) { res.status(200).json({ data: await orderService.cancelOrder(req.validated.params.id) }); }
export async function expense(req, res) { res.status(201).json({ data: await orderService.addExpense(req.validated.params.id, req.validated.body, req.user.id) }); }
export async function assignTechnician(req, res) {
  res.status(200).json({ data: await installationService.assignTechnician(req.validated.params.id, req.validated.body) });
}
export async function createPayment(req, res) {
  res.status(201).json({ data: await paymentService.recordPayment(req.validated.params.id, req.validated.body, req.user.id) });
}
export async function listPayments(req, res) {
  res.status(200).json(await paymentService.listPayments(req.validated.params.id, req.validated.query));
}
