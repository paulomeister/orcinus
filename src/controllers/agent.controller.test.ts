import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { Request, Response } from 'express';
import { list } from './agent.controller';
import { listAgents } from '../services/agent.service';

vi.mock('../services/agent.service');

describe('agent.controller - list', () => {
  const mockAgents = [
    { id: '1', name: 'Agent A', email: 'a@example.com' },
    { id: '2', name: 'Agent B', email: 'b@example.com' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls listAgents and returns 200 with agent array', async () => {
    (listAgents as Mock).mockResolvedValue(mockAgents);

    const mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await list({} as Request, mockResponse as unknown as Response);

    expect(listAgents).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockAgents);
  });

  it('returns empty array when no agents exist', async () => {
    (listAgents as Mock).mockResolvedValue([]);

    const mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await list({} as Request, mockResponse as unknown as Response);

    expect(listAgents).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith([]);
  });
});
