export function parseCookies(req) {
  const raw = req.headers.get('cookie') || '';
  return Object.fromEntries(
    raw.split(';').map(v => v.trim().split('=').map(decodeURIComponent)).filter(([k]) => k)
  );
}

export function cookie(name, value, opts = {}) {
  const attrs = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${opts.path || '/'}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax'
  ];
  if (opts.maxAge) attrs.push(`Max-Age=${opts.maxAge}`);
  return attrs.join('; ');
}

