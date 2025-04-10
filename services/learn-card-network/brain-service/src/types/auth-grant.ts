import { z } from 'zod';

import { AUTH_GRANT_ACTIVE_STATUS, AUTH_GRANT_REVOKED_STATUS } from 'src/constants/auth-grant';
import { StringQuery } from '@learncard/types';

export const AuthGrantValidator = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    challenge: z
        .string()
        .min(10, { message: 'Challenge is too short' })
        .max(100, { message: 'Challenge is too long' }),
    status: z.enum(['revoked', 'active'], {
        required_error: 'Status is required',
        invalid_type_error: 'Status must be either active or revoked',
    }),
    scope: z.string(),
    createdAt: z
        .string()
        .datetime({ message: 'createdAt must be a valid ISO 8601 datetime string' }),
    expiresAt: z
        .string()
        .datetime({ message: 'expiresAt must be a valid ISO 8601 datetime string' })
        .nullish()
        .optional(),
});
export type AuthGrantType = z.infer<typeof AuthGrantValidator>;

export const FlatAuthGrantValidator = z.object({ id: z.string() }).catchall(z.any());
export type FlatAuthGrantType = z.infer<typeof FlatAuthGrantValidator>;

export const AuthGrantQueryValidator = z
    .object({
        id: StringQuery,
        name: StringQuery,
        description: StringQuery,
        status: z.enum([AUTH_GRANT_REVOKED_STATUS, AUTH_GRANT_ACTIVE_STATUS]),
    })
    .partial();
export type AuthGrantQuery = z.infer<typeof AuthGrantQueryValidator>;
