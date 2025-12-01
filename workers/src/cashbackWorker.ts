import { Elysia } from 'elysia';
import { redis } from './redis';
import { QUEUES, CashbackJobSchema } from './queueContracts';
import { sleep, log } from './utils';

const WORKER = 'cashback-worker';

async function applyCashback(job: any) {
  // Placeholder: call backend API to post wallet transaction
  log(WORKER, 'apply cashback (stub)', job);
  // fetch(`${process.env.API_BASE}/api/v1/wallet/cashback`, { method: 'POST', body: JSON.stringify(job), headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.WORKER_TOKEN}` }});
}

async function processLoop() {
  log(WORKER, 'starting loop');
  while (true) {
    const res = await redis.brpop(QUEUES.cashback, 5);
    if (res) {
      const payloadStr = res[1];
      try {
        const json = JSON.parse(payloadStr);
        const parsed = CashbackJobSchema.parse(json);
        await applyCashback(parsed);
      } catch (e: any) {
        log(WORKER, 'invalid cashback job', { error: e.message, raw: payloadStr });
      }
    } else {
      await sleep(500);
    }
  }
}

processLoop();

export const app = new Elysia().get('/', () => ({ status: 'ok', worker: WORKER }));
app.listen(4003);
log(WORKER, 'listening on :4003');
