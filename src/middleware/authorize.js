import { forbiddenError, unauthorizedError } from '../utils/errors.js';

export function authorize(allowedRoles = []) {
  return (req, _res, next) => {
    if (!req.user) return next(unauthorizedError());
    if (!allowedRoles.includes(req.user.role)) return next(forbiddenError());
    return next();
  };
}
