import { Elysia } from 'elysia';
import { redis } from './redis';
import { QUEUES, EmailJobSchema } from './queueContracts';
import { sleep, log } from './utils';

const WORKER = 'email-worker';

async function processLoop() {
  log(WORKER, 'starting loop');
  while (true) {
    const res = await redis.brpop(QUEUES.email, 5); // blocking pop
    if (res) {
      const payloadStr = res[1];
      try {
        const json = JSON.parse(payloadStr);
        const parsed = EmailJobSchema.parse(json);
        // Stub send
        log(WORKER, 'send email', parsed);
        // In real impl: call provider (e.g. SES, Resend, Mailgun)
      } catch (e: any) {
        log(WORKER, 'invalid email job', { error: e.message, raw: payloadStr });
      }
    } else {
      await sleep(500); // idle wait
    }
  }
}

processLoop();

export const app = new Elysia().get('/', () => ({ status: 'ok', worker: WORKER }));

app.listen(4001);
log(WORKER, 'listening on :4001');
