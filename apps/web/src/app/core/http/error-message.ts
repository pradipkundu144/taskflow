import { HttpErrorResponse } from '@angular/common/http';
import { ERROR_CODES, type ApiErrorBody } from '@taskflow/shared';

const FRIENDLY: Record<string, string> = {
  [ERROR_CODES.UNAUTHORIZED]: 'please sign in to continue',
  [ERROR_CODES.FORBIDDEN]: 'you do not have permission for this action',
  [ERROR_CODES.NOT_FOUND]: 'not found',
  [ERROR_CODES.CONFLICT]: 'this already exists',
  [ERROR_CODES.TOO_MANY]: 'too many attempts, try again shortly',
  [ERROR_CODES.VALIDATION]: 'please review the highlighted fields',
  [ERROR_CODES.INTERNAL]: 'something went wrong on our side',
};

export function toErrorMessage(err: unknown, fallback = 'something went wrong'): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'unable to reach the server';
    const body = err.error as ApiErrorBody | string | null;
    if (body && typeof body === 'object') {
      if (typeof body.message === 'string' && body.message.trim().length > 0) {
        return body.message;
      }
      if (typeof body.code === 'string') {
        const friendly = FRIENDLY[body.code];
        if (friendly) return friendly;
      }
    }
    if (typeof body === 'string' && body.length > 0) return body;
    return err.statusText || fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function extractIssues(err: unknown): Record<string, string> {
  if (!(err instanceof HttpErrorResponse)) return {};
  const body = err.error as ApiErrorBody | null;
  if (!body?.issues) return {};
  const out: Record<string, string> = {};
  for (const issue of body.issues) {
    if (!out[issue.path]) out[issue.path] = issue.message;
  }
  return out;
}

export function isAuthEndpoint(url: string): boolean {
  return url.includes('/api/auth/');
}
