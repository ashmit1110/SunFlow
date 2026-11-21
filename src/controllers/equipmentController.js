import * as equipmentService from '../services/equipmentService.js';

export async function create(req, res) { res.status(201).json({ data: await equipmentService.registerEquipment(req.validated.body) }); }
export async function list(req, res) { res.status(200).json(await equipmentService.listEquipment(req.validated.query)); }
export async function get(req, res) { res.status(200).json({ data: await equipmentService.getBySerial(req.validated.params.serial) }); }
export async function passport(req, res) { res.status(200).json({ data: await equipmentService.getPassport(req.validated.params.serial) }); }
