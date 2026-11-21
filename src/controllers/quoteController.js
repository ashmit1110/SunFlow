import * as quoteService from '../services/quoteService.js';

export async function create(req, res) {
  const quote = await quoteService.createQuote(req.validated.params.leadId, req.validated.body, req.user.id);
  res.status(201).json({ data: quote });
}

export async function list(req, res) {
  res.status(200).json(await quoteService.listQuotes(req.validated.query));
}

export async function get(req, res) {
  res.status(200).json({ data: await quoteService.getQuote(req.validated.params.id) });
}

export async function updateItems(req, res) {
  const quote = await quoteService.updateQuoteItems(req.validated.params.id, req.validated.body.items);
  res.status(200).json({ data: quote });
}

export async function send(req, res) {
  res.status(200).json({ data: await quoteService.sendQuote(req.validated.params.id) });
}

export async function accept(req, res) {
  res.status(200).json({ data: await quoteService.acceptQuote(req.validated.params.id) });
}

export async function reject(req, res) {
  res.status(200).json({ data: await quoteService.rejectQuote(req.validated.params.id) });
}
