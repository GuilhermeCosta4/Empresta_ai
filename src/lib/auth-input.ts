import { z } from "zod";

export const loginInput = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  password: z.string().min(1).max(1024),
});

export type LoginInput = z.infer<typeof loginInput>;
