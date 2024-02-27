import { z } from 'zod';

export const ConsentFlowValidator = z.object({ id: z.string(), contract: z.string(), createdAt: z.string(), updatedAt: z.string() });
export type ConsentFlowType = z.infer<typeof ConsentFlowValidator>;
