import { z } from 'zod';

export const ConsentFlowValidator = z.object({ endpoint: z.string() });
export type ConsentFlowType = z.infer<typeof ConsentFlowValidator>;
