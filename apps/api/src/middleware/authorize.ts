import type { RequestHandler } from 'express';
import type { Role } from '@taskflow/shared';
import { ForbiddenError, UnauthorizedError } from '../lib/errors';

export function authorize(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('not authenticated'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('role not allowed'));
    }
    next();
  };
}
