import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';

// Mock the controller module
vi.mock('../controllers/metrics.controller', () => ({
  getMetrics: vi.fn(),
}));

import metricsRoutes from './metrics.routes.js';
import { getMetrics } from '../controllers/metrics.controller.js';

describe('metrics.routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', metricsRoutes);
  });

  describe('GET /api/metrics', () => {
    it('responds on correct path', async () => {
      const mockResponse = {
        startDate: '2026-09-01',
        endDate: '2026-09-05',
        agentMetrics: [],
        dailyVolume: [],
      };

      (getMetrics as any).mockImplementation(async (_req: Request, res: Response) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app).get('/api/metrics');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('calls controller.getMetrics', async () => {
      const mockResponse = {
        startDate: '2026-09-01',
        endDate: '2026-09-05',
        agentMetrics: [],
        dailyVolume: [],
      };

      (getMetrics as any).mockImplementation(async (_req: Request, res: Response) => {
        res.status(200).json(mockResponse);
      });

      await request(app).get('/api/metrics?startDate=2026-09-01&endDate=2026-09-05');

      expect(getMetrics).toHaveBeenCalled();
    });

    it('returns 400 when startDate is missing', async () => {
      (getMetrics as any).mockImplementation(async (_req: Request, res: Response, next: NextFunction) => {
        const err = new Error('Validation failed');
        (err as any).statusCode = 400;
        next(err);
      });

      const response = await request(app).get('/api/metrics?endDate=2026-09-05');

      expect(response.status).toBe(400);
    });

    it('returns 400 when endDate is missing', async () => {
      (getMetrics as any).mockImplementation(async (_req: Request, res: Response, next: NextFunction) => {
        const err = new Error('Validation failed');
        (err as any).statusCode = 400;
        next(err);
      });

      const response = await request(app).get('/api/metrics?startDate=2026-09-01');

      expect(response.status).toBe(400);
    });

    it('returns 400 when date range is inverted', async () => {
      (getMetrics as any).mockImplementation(async (_req: Request, res: Response, next: NextFunction) => {
        const err = new Error('startDate cannot be greater than endDate');
        (err as any).statusCode = 400;
        next(err);
      });

      const response = await request(app).get('/api/metrics?startDate=2026-09-10&endDate=2026-09-01');

      expect(response.status).toBe(400);
    });
  });
});
