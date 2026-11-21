import * as bomService from '../services/bomService.js';

export async function list(req, res) {
  res.status(200).json(await bomService.listTemplates(req.validated.query));
}

export async function create(req, res) {
  res.status(201).json({ data: await bomService.createTemplate(req.validated.body) });
}

export async function get(req, res) {
  res.status(200).json({ data: await bomService.getTemplate(req.validated.params.id) });
}

export async function resolve(req, res) {
  const { systemType, capacityKw } = req.validated.body;
  const result = await bomService.resolveBom(undefined, systemType, capacityKw);
  res.status(200).json({ data: bomService.serializeResolvedBom(result) });
}
