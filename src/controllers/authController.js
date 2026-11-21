import * as authService from '../services/authService.js';

export async function login(req, res) {
  const result = await authService.login(req.validated.body);
  res.status(200).json({ data: result });
}

export async function me(req, res) {
  const user = await authService.getCurrentUser(req.user.id);
  res.status(200).json({ data: user });
}
