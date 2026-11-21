import * as userService from '../services/userService.js';

export async function list(req, res) {
  const result = await userService.listUsers(req.validated.query);
  res.status(200).json(result);
}

export async function create(req, res) {
  const user = await userService.createUser(req.validated.body);
  res.status(201).json({ data: user });
}

export async function update(req, res) {
  const user = await userService.updateUser(req.validated.params.id, req.validated.body);
  res.status(200).json({ data: user });
}
