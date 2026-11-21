import * as dashboardService from '../services/dashboardService.js';

export async function summary(req, res) { res.status(200).json({ data: await dashboardService.getSummary(req.validated.query.range) }); }
export async function profitability(_req, res) { res.status(200).json({ data: await dashboardService.getOrdersProfitability() }); }
export async function serviceOverview(_req, res) { res.status(200).json({ data: await dashboardService.getServiceOverview() }); }
