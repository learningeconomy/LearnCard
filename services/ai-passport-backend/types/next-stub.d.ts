// The LearnCard monorepo hoists `next`, and trpc-to-openapi's Next adapter types import it.
// Pulling in next/types/global.d.ts makes `ProcessEnv.NODE_ENV` required for this Bun service,
// so typecheck resolves `next` to this empty stub instead. The service never imports Next.
export type NextApiRequest = unknown;
export type NextApiResponse = unknown;
