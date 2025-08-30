const te = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');

export function makeSalt(len = 16) {
  const a = new Uint8Array(len);
  crypto.getRandomValues(a);
  return hex(a.buffer);
}

export async function sha256Hex(input) {
  const buf = await crypto.subtle.digest('SHA-256', te.encode(input));
  return hex(buf);
}

export const makeToken = () => crypto.randomUUID().replace(/-/g, '') + makeSalt();

