import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';

import { SESSION_COOKIE_NAME, readSessionCookie } from '@session';

import type { ConsoleAuthService } from '../app';
import type { ConsoleContext } from './trpc';

import type { BrainServiceTransport } from '../brain';
import type { KeyManagementService, ManagedKeyRef } from '@kms';
import type { MutableManagedKeyDirectory } from '@did';

export type CreateConsoleContextDeps = {
    transport: BrainServiceTransport;
    kms: KeyManagementService;
    keyRefFor: (did: string) => Promise<ManagedKeyRef | null>;
    directory: MutableManagedKeyDirectory;
    consoleDomain: string;
    authService: ConsoleAuthService;
    cookieSecret: string;
};

export function makeCreateConsoleContext(deps: CreateConsoleContextDeps) {
    return async ({ req }: CreateFastifyContextOptions): Promise<ConsoleContext> => {
        const sessionId = readSessionCookie(req.cookies[SESSION_COOKIE_NAME], deps.cookieSecret);

        const session = sessionId ? await deps.authService.getSession(sessionId) : null;

        return {
            session,
            transport: deps.transport,
            kms: deps.kms,
            keyRefFor: deps.keyRefFor,
            directory: deps.directory,
            consoleDomain: deps.consoleDomain,
        };
    };
}
