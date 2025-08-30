export function setCookie(name, value, { maxAge = 60*60*24*30 } = {}) {
  const attrs = [`Path=/`,`HttpOnly`,`Secure`,`SameSite=Strict`,`Max-Age=${maxAge}`];
  return `${name}=${value}; ${attrs.join('; ')}`;
}
export function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}
export function getCookie(req, name) {
  const c = req.headers.get('cookie') || '';
  const m = c.match(new RegExp('(^|; )' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[2]) : null;
}

/* --- Compatibilité anciens endpoints --- */
export function parseCookies(header) {
  const h = header || '';
  return h.split(';').reduce((acc, part) => {
    const [k, ...rest] = part.trim().split('=');
    if (!k) return acc;
    acc[k] = decodeURIComponent(rest.join('=') || '');
    return acc;
  }, {});
}
// alias "cookie" attendu par l'ancien code
export function cookie(name, value, opts) {
  return setCookie(name, value, opts);
}
