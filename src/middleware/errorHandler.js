export function notFoundHandler(req, _res, next) {
  next({ status: 404, code: 'NOT_FOUND', message: `Route not found: ${req.method} ${req.path}` });
}

export function errorHandler(error, _req, res, _next) {
  const isMulterError = error?.name === 'MulterError';
  const status = isMulterError ? 400 : Number.isInteger(error.status) ? error.status : 500;
  const code = isMulterError ? 'VALIDATION_ERROR' : error.code ?? (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');
  const message = isMulterError ? 'Uploaded file is invalid or exceeds the allowed limit' : status === 500 ? 'An unexpected server error occurred' : error.message;

  if (status >= 500) {
    console.error(error);
  }

  const responseError = { code, message };
  if (code === 'VALIDATION_ERROR') responseError.fields = error.fields ?? (isMulterError ? { file: 'check file type and maximum size of 8 MB' } : undefined);

  res.status(status).json({ error: responseError });
}
