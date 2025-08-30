import { requireStudentSession } from '../../../_utils/auth_student.js';
import { json } from '../../../_utils/response.js';

export async function onRequest({ request, env }) {
  const sess = await requireStudentSession(request, env);
  if (!sess) return json({authenticated:false});
  return json({authenticated:true, email: sess.email});
}
