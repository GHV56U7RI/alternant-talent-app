const TE = new TextEncoder();
export async function pbkdf2Hash(password, salt){
  const key = await crypto.subtle.importKey('raw', TE.encode(password), {name:'PBKDF2'}, false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name:'PBKDF2', hash:'SHA-256', salt: TE.encode(String(salt||'')), iterations: 120000}, key, 256);
  const b = new Uint8Array(bits);
  return Array.from(b).map(x=>x.toString(16).padStart(2,'0')).join('');
}
