import type { Request, Response } from 'express';
import { listAgents } from '../services/agent.service';

export async function list(_req: Request, res: Response) {
  const agents = await listAgents();
  res.status(200).json(agents);
}
