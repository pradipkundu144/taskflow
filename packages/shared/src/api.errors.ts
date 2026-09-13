export const ERROR_CODES = {
  BAD_REQUEST: 'bad_request',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  TOO_MANY: 'too_many_requests',
  VALIDATION: 'validation_error',
  INTERNAL: 'internal_error',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface ApiErrorIssue {
  path: string;
  message: string;
}

export interface ApiErrorBody {
  code: ErrorCode | string;
  message: string;
  issues?: ApiErrorIssue[];
  details?: unknown;
}
