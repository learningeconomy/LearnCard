import { createContext } from 'react';
import type React from 'react';

import { walletStore } from 'learn-card-base';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import type { ClassLinkAccountContinuity } from '@learncard/lca-api-plugin';
import type {
    AppAuthContextValue,
    PinSetupOptions,
    RecoverySetupOptions,
} from '../../src/providers/AuthCoordinatorProvider';

/**
 * A fake lca-api and app-auth context for the ClassLink "keep your account" step, shared
 * by the keep-account and School Connect harnesses. Query params:
 * - `step`: email | pin | method | done (the server's starting state)
 * - `escrow`: 0 for an account without escrow (e.g. a placeholder email); default 1,
 *   except for `step=method`
 * - `pin`: none | enabled | locked (the escrow PIN; default enabled, none for `step=pin`)
 * - `reason`: a refusal reason (makes the email step not allowed)
 * - `shared`: 1 to report the verified address as another account's recovery email
 * - `student`: 0 for staff or another adult (the headline drops "after school")
 */
declare global {
    interface Window {
        keepAccountHarness: {
            setupOptions: RecoverySetupOptions[];
            pinSetupOptions: PinSetupOptions[];
            pinsSet: number;
            removed: number;
            sends: string[];
            birthDateOpened: number;
        };
    }
}

const trpcError = (code: string): Error => Object.assign(new Error(code), { data: { code } });

/** Installs the fake wallet and returns the app-auth context and value to provide. */
export const installKeepAccountFake = (
    params: URLSearchParams
): {
    AppAuthContext: React.Context<AppAuthContextValue | null>;
    appAuthValue: AppAuthContextValue;
} => {
    window.keepAccountHarness = {
        setupOptions: [],
        pinSetupOptions: [],
        pinsSet: 0,
        removed: 0,
        sends: [],
        birthDateOpened: 0,
    };

    const startStep = params.get('step') ?? 'email';
    const reason = params.get('reason') as ClassLinkAccountContinuity['personalEmail']['reason'];
    const shared = params.get('shared') === '1';
    const escrow = (params.get('escrow') ?? (startStep === 'method' ? '0' : '1')) === '1';
    const startPin = (params.get('pin') ??
        (startStep === 'pin' ? 'none' : 'enabled')) as ClassLinkAccountContinuity['pinState'];

    const server = {
        email: startStep === 'email' ? undefined : 'student@example.org',
        recoveryEmail: startStep !== 'email',
        method: startStep === 'done' && !escrow,
        pin: escrow ? startPin : ('none' as ClassLinkAccountContinuity['pinState']),
        pending: undefined as string | undefined,
    };

    // Mirrors lca-api's rule: email first; email code + PIN recovers an escrow account.
    const continuity = (): ClassLinkAccountContinuity => {
        const pinRecoverable = escrow && server.pin === 'enabled';
        return {
            personalEmail: reason ? { allowed: false, reason } : { allowed: true },
            emailVerified: Boolean(server.email),
            ...(server.email ? { maskedEmail: `${server.email[0]}***@example.org` } : {}),
            recoveryEmailVerified: server.recoveryEmail,
            hasServerConfirmedMethod: server.method || escrow,
            hasUserRecoveryMethod: server.method,
            pinState: server.pin,
            pinRecoverable,
            nextStep:
                !server.email || !server.recoveryEmail
                    ? 'email'
                    : server.method || pinRecoverable
                      ? 'done'
                      : escrow
                        ? 'pin'
                        : 'method',
        };
    };

    const fakeWallet = {
        id: { did: () => 'did:key:z6MkKeepAccountHarness' },
        invoke: {
            classlinkGetAccountContinuity: async () => continuity(),
            classlinkGetConnection: async () => ({
                available: true,
                canConnect: true,
                connected: true,
                isStudent: params.get('student') !== '0',
            }),
            classlinkStartPersonalEmail: async ({ email }: { email: string }) => {
                if (email.endsWith('@school.example')) throw trpcError('BAD_REQUEST');
                window.keepAccountHarness.sends.push(email);
                server.pending = email;
                return { success: true };
            },
            classlinkVerifyPersonalEmail: async ({
                email,
                code,
            }: {
                email: string;
                code: string;
            }) => {
                if (code !== '123456' || email !== server.pending) throw trpcError('BAD_REQUEST');
                server.email = email;
                server.recoveryEmail = !shared;
                return shared
                    ? {
                          success: true,
                          recoveryEmailSet: false,
                          recoveryEmailSkipped: 'shared' as const,
                      }
                    : { success: true, recoveryEmailSet: true };
            },
            classlinkRemovePersonalEmail: async () => {
                window.keepAccountHarness.removed += 1;
                server.email = undefined;
                server.recoveryEmail = false;
                return { success: true };
            },
        },
    };
    walletStore.set.wallet(fakeWallet as unknown as BespokeLearnCard);

    const APP_AUTH_CONTEXT_KEY = '__learncardAppAuthContext__';
    const globalScope = globalThis as typeof globalThis & {
        [APP_AUTH_CONTEXT_KEY]?: React.Context<AppAuthContextValue | null>;
    };
    globalScope[APP_AUTH_CONTEXT_KEY] ??= createContext<AppAuthContextValue | null>(null);

    // The real overlays are the AuthCoordinator's; these confirm at once.
    const appAuthValue = {
        state: { status: 'ready', did: 'did:key:z6MkKeepAccountHarness' },
        openRecoverySetup: (options: RecoverySetupOptions = {}) => {
            window.keepAccountHarness.setupOptions.push(options);
            server.method = true;
            options.onCompleted?.(options.initialMethod ?? 'passkey');
        },
        openPinSetup: (options: PinSetupOptions = {}) => {
            window.keepAccountHarness.pinSetupOptions.push(options);
            server.pin = 'enabled';
            options.onComplete?.();
        },
        setEscrowPin: async () => {
            window.keepAccountHarness.pinsSet += 1;
            server.pin = 'enabled';
        },
    } as unknown as AppAuthContextValue;

    return { AppAuthContext: globalScope[APP_AUTH_CONTEXT_KEY], appAuthValue };
};
