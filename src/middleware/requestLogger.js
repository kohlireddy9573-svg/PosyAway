import morgan from 'morgan';

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key,
      /password|token|secret|authorization/i.test(key) ? '[REDACTED]' : redact(item),
    ]));
  }
  return value;
}

export function redactRequestBody(body) {
  if (body === undefined || body === null) return '-';
  const serialized = JSON.stringify(redact(body));
  if (!serialized) return '-';
  return serialized.length > 1000 ? `${serialized.slice(0, 1000)}...[truncated]` : serialized;
}

morgan.token('safe-body', (request) => redactRequestBody(request.body));

export const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms body=:safe-body',
  { skip: (request) => request.originalUrl.startsWith('/api/signup') || request.originalUrl.startsWith('/api/signin') },
);