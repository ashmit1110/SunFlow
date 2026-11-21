import * as serviceTicketService from '../services/serviceTicketService.js';

export async function create(req, res) { res.status(201).json({ data: await serviceTicketService.createTicket(req.validated.body) }); }
export async function list(req, res) { res.status(200).json(await serviceTicketService.listTickets(req.validated.query)); }
export async function get(req, res) { res.status(200).json({ data: await serviceTicketService.getTicket(req.validated.params.id) }); }
export async function update(req, res) { res.status(200).json({ data: await serviceTicketService.updateTicket(req.validated.params.id, req.validated.body) }); }
export async function addCharge(req, res) { res.status(201).json({ data: await serviceTicketService.addCharge(req.validated.params.id, req.validated.body) }); }
