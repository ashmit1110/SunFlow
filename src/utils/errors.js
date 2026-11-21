export class AppError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    if (fields) this.fields = fields;
  }
}

export const validationError = (message, fields) => new AppError(400, 'VALIDATION_ERROR', message, fields);
export const unauthorizedError = (message = 'Authentication required') => new AppError(401, 'UNAUTHENTICATED', message);
export const forbiddenError = (message = 'You do not have permission to access this resource') => new AppError(403, 'FORBIDDEN', message);
export const notFoundError = (message = 'Resource not found') => new AppError(404, 'NOT_FOUND', message);
export const conflictError = (message = 'The request conflicts with the current resource state') => new AppError(409, 'CONFLICT', message);
export const unprocessableError = (message = 'The request cannot be processed', fields) => new AppError(422, 'UNPROCESSABLE', message, fields);
