import { z } from 'zod';
import { DidDocumentValidator } from '@learncard/types';

export const DidMetadataValidator = DidDocumentValidator.partial().extend({ id: z.string() });
export type DidMetadataType = z.infer<typeof DidMetadataValidator>;

export const FlatDidMetadataValidator = z.object({ id: z.string() }).catchall(z.any());
export type FlatDidMetadataType = z.infer<typeof FlatDidMetadataValidator>;
