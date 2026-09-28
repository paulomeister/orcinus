import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

interface ZodIssue {
  path: (string | number)[];
  message: string;
}

interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string | object;
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

const getErrorDetails = (err: Error): string | object => {
  if (err instanceof ZodError) {
    // In Zod v4, the error object has issues instead of errors
    const issues = (err as any).issues as ZodIssue[] | undefined;
    if (issues) {
      return issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }
    // Fallback to message for other ZodError instances
    return err.message;
  }
  if (err.name === 'PrismaClientValidationError') {
    return err.message;
  }
  if (err.name === 'PrismaClientKnownRequestError') {
    return {
      code: err.message,
      message: err.message,
    };
  }
  if (err.name === 'ValidationError') {
    return err.message;
  }
  return err.message;
};

const getMessage = (err: Error): string => {
  if (err instanceof ZodError) {
    return 'Validation failed';
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
  const errorDetails = getErrorDetails(err);
  const timestamp = new Date().toISOString();

  const errorResponse: ErrorResponse = {
    statusCode,
    message: getMessage(err),
    error: errorDetails,
    timestamp,
  };

  res.status(statusCode).json(errorResponse);
}