import { ERROR_CODES } from '@taskflow/shared';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'bad request', details?: unknown) {
    super(400, ERROR_CODES.BAD_REQUEST, message, details);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'unauthorized') {
    super(401, ERROR_CODES.UNAUTHORIZED, message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'forbidden') {
    super(422, ERROR_CODES.FORBIDDEN, message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'not found') {
    super(404, ERROR_CODES.NOT_FOUND, message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'conflict') {
    super(409, ERROR_CODES.CONFLICT, message);
    this.name = 'ConflictError';
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(message = 'too many requests') {
    super(429, ERROR_CODES.TOO_MANY, message);
    this.name = 'TooManyRequestsError';
  }
}
