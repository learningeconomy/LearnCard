/**
 * Client-side stand-in for `@learncard/email-templates`' tenant type.
 *
 * It only appears in the brain service's request context, which tRPC clients never see.
 */
export type ResolvedTenant = Record<string, unknown>;
