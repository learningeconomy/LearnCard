import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';

import { SESSION_COOKIE_NAME, readSessionCookie } from '@session';

import type { ConsoleAuthService } from '../app';
import type { ConsoleContext } from './trpc';

export type CreateConsoleContextDeps = {
    authService: ConsoleAuthService;
    cookieSecret: string;
};

export function makeCreateConsoleContext(deps: CreateConsoleContextDeps) {
    return async ({ req }: CreateFastifyContextOptions): Promise<ConsoleContext> => {
        const sessionId = readSessionCookie(req.cookies[SESSION_COOKIE_NAME], deps.cookieSecret);

        const session = sessionId ? await deps.authService.getSession(sessionId) : null;

        return { session };
    };
}
