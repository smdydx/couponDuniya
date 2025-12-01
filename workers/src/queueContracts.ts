import { z } from 'zod';

export const EmailJobSchema = z.object({
  to: z.string().email(),
  template: z.string(),
  vars: z.record(z.string()).optional()
});
export type EmailJob = z.infer<typeof EmailJobSchema>;

export const SmsJobSchema = z.object({
  to: z.string(),
  message: z.string().max(320)
});
export type SmsJob = z.infer<typeof SmsJobSchema>;

export const CashbackJobSchema = z.object({
  user_id: z.number().int(),
  offer_id: z.number().int(),
  amount: z.number().positive(),
  txn_ref: z.string()
});
export type CashbackJob = z.infer<typeof CashbackJobSchema>;

// Redis key patterns
export const QUEUES = {
  email: 'queue:email',
  sms: 'queue:sms',
  cashback: 'queue:cashback'
};
