export function notFoundHandler(req, _res, next) {
  next({ status: 404, code: 'NOT_FOUND', message: `Route not found: ${req.method} ${req.path}` });
}

export function errorHandler(error, _req, res, _next) {
  const status = Number.isInteger(error.status) ? error.status : 500;
  const code = error.code ?? (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');
  const message = status === 500 ? 'An unexpected server error occurred' : error.message;

  if (status >= 500) {
    console.error(error);
  }

  const responseError = { code, message };
  if (code === 'VALIDATION_ERROR' && error.fields) responseError.fields = error.fields;

  res.status(status).json({ error: responseError });
}
