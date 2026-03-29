import { NextRequest } from 'next/server';
import { POST as generateProgramPost } from '../route';

/**
 * Backward-compat endpoint.
 * Supports older clients still calling /api/workout-program/generate.
 */
export async function POST(request: NextRequest) {
  return generateProgramPost(request);
}
