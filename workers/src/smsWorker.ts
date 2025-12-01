import { Elysia } from 'elysia';
import { redis } from './redis';
import { QUEUES, SmsJobSchema } from './queueContracts';
import { sleep, log } from './utils';

const WORKER = 'sms-worker';

async function processLoop() {
  log(WORKER, 'starting loop');
  while (true) {
    const res = await redis.brpop(QUEUES.sms, 5);
    if (res) {
      const payloadStr = res[1];
      try {
        const json = JSON.parse(payloadStr);
        const parsed = SmsJobSchema.parse(json);
        log(WORKER, 'send sms', parsed);
        // Real impl: integrate with Twilio / MSG91 / Vonage
      } catch (e: any) {
        log(WORKER, 'invalid sms job', { error: e.message, raw: payloadStr });
      }
    } else {
      await sleep(500);
    }
  }
}

processLoop();

export const app = new Elysia().get('/', () => ({ status: 'ok', worker: WORKER }));
app.listen(4002);
log(WORKER, 'listening on :4002');
