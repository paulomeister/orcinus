import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import * as interactionService from '../services/interaction.service';
import {
  createInteractionSchema,
  updateStatusParamsSchema,
  updateStatusSchema,
  listInteractionsSchema,
} from '../schemas/interaction.schema';
import { serializeInteraction } from '../utils/enumMappers';
import { BadRequestError } from '../errors/AppError';

// NEW: shared helper
function toValidationError(err: unknown): unknown {
  if (err instanceof ZodError) {
    const messages = err.issues.map(
      (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`
    );
    return new BadRequestError('Validation failed', messages);
  }
  return err;
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = createInteractionSchema.parse(req.body);
    const interaction = await interactionService.createInteraction(dto);
    res.status(201).json(serializeInteraction(interaction));
  } catch (err) {
    next(toValidationError(err));
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = updateStatusParamsSchema.parse(req.params);
    const { status } = updateStatusSchema.parse(req.body);
    const interaction = await interactionService.updateInteractionStatus(id, status);
    res.status(200).json(serializeInteraction(interaction));
  } catch (err) {
    next(toValidationError(err));
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listInteractionsSchema.parse(req.query);
    const { page, pageSize, ...filters } = query;
    const result = await interactionService.listInteractions(filters, { page, pageSize });

    res.status(200).json({
      ...result,
      data: result.data.map(serializeInteraction),
    });
  } catch (err) {
    next(toValidationError(err));
  }
}