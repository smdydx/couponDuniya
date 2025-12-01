export async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

export function log(worker: string, msg: string, meta?: any) {
  const base = `[${new Date().toISOString()}][${worker}] ${msg}`;
  if (meta) console.log(base, meta); else console.log(base);
}
