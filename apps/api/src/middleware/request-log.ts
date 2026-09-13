import pinoHttp from 'pino-http';
import { randomUUID } from 'node:crypto';
import { logger } from '../lib/logger';

export const requestLog = pinoHttp({
  logger,
  genReqId: (req) =>
    (req.headers['x-request-id'] as string | undefined) ?? randomUUID(),
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
