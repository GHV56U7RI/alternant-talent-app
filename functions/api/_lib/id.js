export async function stableId(prefix, input) {
  const data = new TextEncoder().encode(String(input ?? Math.random()));
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hex = [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
  return `${prefix}-${hex.slice(0,24)}`;
}

