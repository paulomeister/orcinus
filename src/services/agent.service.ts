import { findAll } from '../repositories/agent.repository';

export async function listAgents() {
  return findAll();
}
