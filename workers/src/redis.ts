import Redis from 'ioredis';
import { REDIS_URL } from './env';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true
});

redis.on('error', (e) => console.error('[redis:error]', e));
redis.on('connect', () => console.log('[redis] connected'));
