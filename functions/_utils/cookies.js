export function setCookie(name, value, {maxAge=60*60*24*30}={}) {
  const attrs = [`Path=/`,`HttpOnly`,`Secure`,`SameSite=Strict`,`Max-Age=${maxAge}`];
  return `${name}=${value}; ${attrs.join('; ')}`;
}
export function clearCookie(name){
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}
export function getCookie(req, name){
  const c = req.headers.get('cookie') || '';
  const m = c.match(new RegExp('(^|; )'+name+'=([^;]+)'));
  return m ? decodeURIComponent(m[2]) : null;
}
