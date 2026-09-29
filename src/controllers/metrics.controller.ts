import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import * as metricsService from '../services/metrics.service';
import { metricsQuerySchema } from '../schemas/metrics.schema';
import { BadRequestError } from '../errors/AppError';

function toValidationError(err: unknown): unknown {
  if (err instanceof ZodError) {
    const messages = err.issues.map(
      (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`
    );
    return new BadRequestError('Validation failed', messages);
  }
  return err;
}

export async function getMetrics(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate } = metricsQuerySchema.parse(req.query);
    const result = await metricsService.getMetrics(startDate, endDate);
    res.status(200).json(result);
  } catch (err) {
    next(toValidationError(err));
  }
}