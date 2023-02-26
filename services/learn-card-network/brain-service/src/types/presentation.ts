import { z } from 'zod';

export const PresentationValidator = z.object({ id: z.string(), presentation: z.string() });
export type PresentationType = z.infer<typeof PresentationValidator>;
