import { requireAuth } from './auth.js';

export const requireStudentSession = (req, env) =>
  requireAuth(req, env, 'student');

