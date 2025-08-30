const TE = new TextEncoder();

function toHex(buf) {
  const arr = buf instanceof ArrayBuffer ? new Uint8Array(buf) : new Uint8Array(buf.buffer || buf);
  return Array.from(arr).map(b => b.toString(16).padStart(2,'0')).join('');
}
function randomHex(bytes = 32) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return toHex(a);
}

/* --- Exports de compatibilité pour anciens endpoints --- */
export async function sha256Hex(input) {
  const data = TE.encode(String(input ?? ''));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(digest);
}
export function makeToken(lenBytes = 32) {
  // jeton ASCII sûr (hex)
  return randomHex(lenBytes);
}
export function makeSalt(lenBytes = 16) {
  return randomHex(lenBytes);
}

/* --- Hash moderne utilisé par les nouveaux endpoints --- */
export async function pbkdf2Hash(password, salt) {
  const key = await crypto.subtle.importKey('raw', TE.encode(String(password ?? '')), { name: 'PBKDF2' }, false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: TE.encode(String(salt ?? '')), iterations: 120000 },
    key,
    256
  );
  return toHex(bits);
}
