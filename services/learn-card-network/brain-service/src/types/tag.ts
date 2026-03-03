import { z } from 'zod';
import { TagValidator, TagType } from '@learncard/types';

export { TagValidator, TagType };

// Brain-service specific flat types
export type FlatTagType = z.infer<typeof TagValidator>;
export const FlatTagValidator = TagValidator;
