import * as customerService from '../services/customerService.js';

export async function create(req, res) {
  const customer = await customerService.createCustomer(req.validated.body);
  res.status(201).json({ data: customer });
}

export async function list(req, res) {
  const result = await customerService.listCustomers(req.validated.query);
  res.status(200).json(result);
}

export async function get(req, res) {
  const customer = await customerService.getCustomer(req.validated.params.id);
  res.status(200).json({ data: customer });
}

export async function update(req, res) {
  const customer = await customerService.updateCustomer(req.validated.params.id, req.validated.body);
  res.status(200).json({ data: customer });
}
