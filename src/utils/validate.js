export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const fields = Object.fromEntries(
        result.error.issues.map((issue) => [issue.path.join('.') || source, issue.message]),
      );
      return next({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        fields,
      });
    }

    req.validated ??= {};
    req.validated[source] = result.data;
    return next();
  };
}
