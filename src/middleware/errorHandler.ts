import type { Request, Response, NextFunction } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string | object;
  timestamp: string;
}

const getStatusCode = (err: Error): number => {
  if ('statusCode' in err && typeof err.statusCode === 'number') {
    return err.statusCode;
  }
  if ('status' in err && typeof err.status === 'number') {
    return err.status;
  }
  return 500;
};

const getErrorDetails = (err: Error): string | object => {
  if (err.name === 'PrismaClientValidationError') {
    return err.message;
  }
  if (err.name === 'PrismaClientKnownRequestError') {
    return {
      code: err.message,
      message: err.message,
    };
  }
  if (err.name === 'ValidationError' || err.name === 'ZodError') {
    return err.message;
  }
  return err.message;
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
    message: err.message || 'Internal Server Error',
    error: errorDetails,
    timestamp,
  };

  res.status(statusCode).json(errorResponse);
}
