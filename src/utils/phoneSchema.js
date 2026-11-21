import { z } from 'zod';

export const phoneSchema = z.string().trim().refine((phone) => {
  const digits = phone.match(/[0-9]/g)?.length ?? 0;
  return /^\+?[0-9 ()-]+$/.test(phone) && digits >= 7 && digits <= 15;
}, 'phone must contain 7–15 digits and may start with +');
