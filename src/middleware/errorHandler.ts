import type { Request, Response, NextFunction } from 'express';
import { STATUS_CODES } from 'http';
import { ZodError } from 'zod';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
}

const getStatusCode = (err: Error): number => {
  if (err instanceof ZodError) {
    return 400;
  }
  if ('statusCode' in err && typeof err.statusCode === 'number') {
    return err.statusCode;
  }
  if ('status' in err && typeof err.status === 'number') {
    return err.status;
  }
  return 500;
};

// error is always the pure HTTP reason phrase, matching design.md's example
const getErrorLabel = (statusCode: number): string => {
  return STATUS_CODES[statusCode] ?? 'Internal Server Error';
};

const getMessage = (err: Error): string | string[] => {
  if ('details' in err && Array.isArray((err as any).details)) {
    return (err as any).details;
  }
  return err.message || 'Internal Server Error';
};

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = getStatusCode(err);
  const timestamp = new Date().toISOString();

  const errorResponse: ErrorResponse = {
    statusCode,
    message: getMessage(err),
    error: getErrorLabel(statusCode),
    timestamp,
  };

  res.status(statusCode).json(errorResponse);
}