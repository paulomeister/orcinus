import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock the controller module
vi.mock('../controllers/agent.controller', () => ({
  list: vi.fn(),
}));

import agentRoutes from './agent.routes';
import { list } from '../controllers/agent.controller';

describe('agent.routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', agentRoutes);
  });

  describe('GET /api/agents', () => {
    it('responds on correct path', async () => {
      const mockAgents = [
        { id: '1', name: 'Agent 1', email: 'agent1@example.com' },
      ];
      
      vi.mocked(list).mockImplementation(async (_req, res) => {
        res.status(200).json(mockAgents);
      });

      const response = await request(app).get('/api/agents');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAgents);
    });

    it('calls controller.list', async () => {
      const mockResponse = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      
      vi.mocked(list).mockImplementation(async (_req, res) => {
        res.status(200).json([]);
      });

      await request(app).get('/api/agents');

      expect(list).toHaveBeenCalled();
    });
  });
});
