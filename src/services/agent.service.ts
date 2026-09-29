import { findAll } from '../repositories/agent.repository.js';

export async function listAgents() {
  return findAll();
}
