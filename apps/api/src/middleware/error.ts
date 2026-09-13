import { ERROR_CODES } from '@taskflow/shared';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../lib/errors';

export function asyncHandler(
  handler: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    req.log?.warn({ err }, 'validation error');
    res.status(400).json({
      code: ERROR_CODES.VALIDATION,
      message: 'validation failed',
      issues: err.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    });
    return;
  }

  if (err instanceof HttpError) {
    if (err.status >= 500) {
      req.log?.error({ err }, 'http error');
    } else {
      req.log?.warn({ err }, 'http error');
    }
    res.status(err.status).json({
      code: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  req.log?.error({ err }, 'unhandled error');
  res.status(500).json({ code: ERROR_CODES.INTERNAL, message: 'internal error' });
}
