import { config } from 'bun';

export const WORKER_NAME = process.env.WORKER_NAME || 'unknown-worker';
export const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
export const API_BASE = process.env.API_BASE || 'http://127.0.0.1:8000';
