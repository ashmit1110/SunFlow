import * as dispatchService from '../services/dispatchService.js';

export async function create(req, res) {
  const dispatch = await dispatchService.createDispatch(req.validated.params.id, req.validated.body, req.user.id);
  res.status(201).json({ data: dispatch });
}
export async function confirm(req, res) { res.status(200).json({ data: await dispatchService.confirmDispatch(req.validated.params.id, req.user.id) }); }
export async function deliver(req, res) { res.status(200).json({ data: await dispatchService.deliverDispatch(req.validated.params.id) }); }
export async function get(req, res) { res.status(200).json({ data: await dispatchService.getDispatch(req.validated.params.id) }); }
