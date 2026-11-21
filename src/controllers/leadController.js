import * as leadService from '../services/leadService.js';

export async function create(req, res) {
  const result = await leadService.createLead(req.validated.body);
  res.status(201).json({ data: result });
}

export async function list(req, res) {
  const result = await leadService.listLeads(req.validated.query);
  res.status(200).json(result);
}

export async function get(req, res) {
  const lead = await leadService.getLead(req.validated.params.id);
  res.status(200).json({ data: lead });
}

export async function qualify(req, res) {
  const lead = await leadService.qualifyLead(req.validated.params.id, req.validated.body);
  res.status(200).json({ data: lead });
}

export async function updateStatus(req, res) {
  const lead = await leadService.updateLeadStatus(req.validated.params.id, req.validated.body.status);
  res.status(200).json({ data: lead });
}
