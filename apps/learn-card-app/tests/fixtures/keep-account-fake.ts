import { createContext } from 'react';
import type React from 'react';

import { setAuthConfigOverrides, walletStore } from 'learn-card-base';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import type { ClassLinkAccountContinuity } from '@learncard/lca-api-plugin';
import type {
    AppAuthContextValue,
    PinSetupOptions,
    RecoverySetupOptions,
} from '../../src/providers/AuthCoordinatorProvider';

/**
 * A fake lca-api and app-auth context for the ClassLink "keep your account" step, shared
 * by the keep-account and School Connect harnesses. It follows lca-api's sign-in email
 * contract: a verified personal email becomes the sign-in email of the ClassLink login
 * (`primaryUid`, here `uid-t`), verify and remove return a custom token for it, and the
 * escrow backup names the contact it was last sealed to (`contactStale` until a PIN
 * confirm, a new PIN or the silent no-PIN re-seal seals the sign-in email). Query params:
 * - `step`: email | pin | confirmPin | method | done (the server's starting state)
 * - `escrow`: 0 for an account without escrow; default 1, except for `step=method`
 * - `pin`: none | enabled | locked (the escrow PIN; default enabled, none for `step=pin`)
 * - `reason`: a refusal reason (makes the email step not allowed)
 * - `shared`: 1 to refuse the verified address as another account's (`CONFLICT`)
 * - `student`: 0 for staff or another adult (the headline drops "after school")
 * - `placeholder`: 1 for a placeholder school email (no escrow until the personal email
 *   is the sign-in email; then it gains escrow and cannot be removed, only changed)
 * - `school`: 0|1 whether the school email still signs in (default 1, 0 for placeholder)
 * - `escrowOff`: 1 when escrow cannot enroll here (the rollout gate): no PIN, a passkey
 * - `sameReject`: 1 to refuse the first new PIN as the same PIN (`SameEscrowPinError`)
 * - `pinMismatch`: 1 to refuse the first PIN confirm as a wrong PIN
 * - `otherUid`: 1 when this session is another login of the account (not `uid-t`)
 * - `method`: 1 when the account also holds a passkey or phrase (with escrow too)
 * Every seal is recorded in `window.keepAccountHarness.sealedContacts`.
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
            sealedContacts: string[];
            reauths: number;
            confirms: number;
        };
    }
}

const trpcError = (code: string, reason?: string): Error =>
    Object.assign(new Error(code), { data: { code, ...(reason ? { reason } : {}) } });
const named = (name: string): Error => Object.assign(new Error(name), { name });

const PRIMARY_UID = 'uid-t';
const SCHOOL_EMAIL = 'student@school.example';
const PLACEHOLDER_EMAIL = 'cl-123@placeholder.invalid';
const STARTING_PERSONAL_EMAIL = 'student@example.org';

/** Installs the fake wallet and returns the app-auth context and value to provide. */
export const installKeepAccountFake = (
    params: URLSearchParams
): {
    AppAuthContext: React.Context<AppAuthContextValue | null>;
    appAuthValue: AppAuthContextValue;
} => {
    // Escrow is on for the app (as in production); `escrowOff` models the rollout gate.
    setAuthConfigOverrides({ providerConfig: { sss: { escrowEnclaveMode: 'nitro' } } });
    window.keepAccountHarness = {
        setupOptions: [],
        pinSetupOptions: [],
        pinsSet: 0,
        removed: 0,
        sends: [],
        birthDateOpened: 0,
        sealedContacts: [],
        reauths: 0,
        confirms: 0,
    };

    const startStep = params.get('step') ?? 'email';
    const reason = params.get('reason') as ClassLinkAccountContinuity['personalEmail']['reason'];
    const shared = params.get('shared') === '1';
    const placeholder = params.get('placeholder') === '1';
    const school = (params.get('school') ?? (placeholder ? '0' : '1')) === '1';
    const escrowOff = params.get('escrowOff') === '1';
    let sameReject = params.get('sameReject') === '1';
    let pinMismatch = params.get('pinMismatch') === '1';
    const sessionUid = params.get('otherUid') === '1' ? 'uid-other' : PRIMARY_UID;
    const startPin = (params.get('pin') ??
        (startStep === 'pin' ? 'none' : 'enabled')) as ClassLinkAccountContinuity['pinState'];
    const accountEmail = placeholder ? PLACEHOLDER_EMAIL : SCHOOL_EMAIL;
    const hasPersonal = startStep !== 'email';

    const server = {
        /** The personal (sign-in) email, once verified. */
        email: hasPersonal ? STARTING_PERSONAL_EMAIL : undefined,
        escrow:
            !placeholder &&
            !escrowOff &&
            (params.get('escrow') ?? (startStep === 'method' ? '0' : '1')) === '1',
        method:
            (startStep === 'done' && params.get('escrow') === '0') || params.get('method') === '1',
        pin: 'none' as ClassLinkAccountContinuity['pinState'],
        /** The contact the escrow backup is sealed to. */
        sealed: undefined as string | undefined,
        pending: undefined as string | undefined,
    };
    if (placeholder && hasPersonal && !escrowOff) server.escrow = true;
    if (server.escrow) {
        server.pin = startPin;
        // `confirmPin` starts with the backup still sealed to the school email.
        server.sealed = startStep === 'confirmPin' ? accountEmail : (server.email ?? accountEmail);
    }
    const signInEmail = (): string => server.email ?? accountEmail;
    // What this device's session knows (a stale session keeps the old one until reauth).
    const session = {
        email: sessionUid === PRIMARY_UID ? signInEmail() : 'other-login@example.net',
        confirmed: hasPersonal ? STARTING_PERSONAL_EMAIL : undefined,
    };
    /** The coordinator's gate: only an address confirmed on this device, or re-typed now. */
    const confirmable = (retypedEmail?: string): void => {
        const unconfirmed = (): Error =>
            Object.assign(named('EscrowContactNotConfirmedError'), { reason: 'unconfirmed' });
        if (retypedEmail !== undefined) {
            if (retypedEmail.trim().toLowerCase() !== session.email) throw unconfirmed();
            session.confirmed = session.email;
        }
        if (session.confirmed !== session.email) throw unconfirmed();
    };
    const seal = (contact: string): void => {
        server.sealed = contact;
        window.keepAccountHarness.sealedContacts.push(contact);
    };

    // Mirrors lca-api's `getAccountContinuity` (remote escrow mode).
    const continuity = (): ClassLinkAccountContinuity => {
        const emailPrimary = Boolean(server.email);
        const pinRecoverable = server.escrow && server.pin === 'enabled';
        // lca-api: a recorded seal that differs from the sign-in email is stale (after a
        // removal too); with none recorded, only a promoted email is.
        const contactStale =
            server.escrow &&
            (server.sealed !== undefined ? server.sealed !== signInEmail() : emailPrimary);
        return {
            personalEmail: reason ? { allowed: false, reason } : { allowed: true },
            emailVerified: emailPrimary,
            ...(server.email ? { maskedEmail: `${server.email[0]}***@example.org` } : {}),
            emailPrimary,
            primaryUid: PRIMARY_UID,
            ...(emailPrimary ? { signInEmailSource: 'personal' as const } : {}),
            hasSchoolEmail: school,
            contactStale,
            canRemove: !(placeholder && server.escrow),
            hasServerConfirmedMethod: server.method || server.escrow,
            hasUserRecoveryMethod: server.method,
            pinState: server.pin,
            pinRecoverable,
            nextStep:
                contactStale && server.pin === 'enabled'
                    ? 'confirmPin'
                    : !emailPrimary
                      ? 'email'
                      : server.method || pinRecoverable
                        ? 'done'
                        : server.escrow || (emailPrimary && !escrowOff)
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
                if (shared) throw trpcError('CONFLICT');
                server.email = email;
                return {
                    success: true as const,
                    verified: true as const,
                    primary: true,
                    primaryUid: PRIMARY_UID,
                    customToken: `e2e-custom-token-${PRIMARY_UID}`,
                };
            },
            classlinkRemovePersonalEmail: async () => {
                if (placeholder && server.escrow)
                    throw trpcError('PRECONDITION_FAILED', 'placeholder_escrow');
                window.keepAccountHarness.removed += 1;
                server.email = undefined;
                return {
                    success: true as const,
                    removed: true as const,
                    customToken: `e2e-custom-token-${PRIMARY_UID}`,
                };
            },
        },
    };
    walletStore.set.wallet(fakeWallet as unknown as BespokeLearnCard);

    const APP_AUTH_CONTEXT_KEY = '__learncardAppAuthContext__';
    const globalScope = globalThis as typeof globalThis & {
        [APP_AUTH_CONTEXT_KEY]?: React.Context<AppAuthContextValue | null>;
    };
    globalScope[APP_AUTH_CONTEXT_KEY] ??= createContext<AppAuthContextValue | null>(null);

    // The real overlays and escrow calls are the AuthCoordinator's; these confirm at once.
    const appAuthValue = {
        get state() {
            return {
                status: 'ready',
                did: 'did:key:z6MkKeepAccountHarness',
                authUser: { id: sessionUid, email: session.email },
                escrowEnrollment: server.escrow ? 'enrolled' : 'not-enrolled',
            };
        },
        openRecoverySetup: (options: RecoverySetupOptions = {}) => {
            window.keepAccountHarness.setupOptions.push(options);
            server.method = true;
            options.onCompleted?.(options.initialMethod ?? 'passkey');
        },
        openPinSetup: (options: PinSetupOptions = {}) => {
            window.keepAccountHarness.pinSetupOptions.push(options);
            server.pin = 'enabled';
            seal(session.email);
            options.onComplete?.();
        },
        setEscrowPin: async (
            _pin: string,
            contact?: { primaryUid: string; retypedEmail?: string }
        ) => {
            // A new PIN that re-seals (the PIN confirm's "choose a new PIN") runs the gates.
            if (contact) confirmable(contact.retypedEmail);
            if (sameReject) {
                sameReject = false;
                throw named('SameEscrowPinError');
            }
            window.keepAccountHarness.pinsSet += 1;
            server.escrow = true;
            server.pin = 'enabled';
            seal(session.email);
        },
        refreshAccountContact: async ({ customToken }: { customToken?: string }) => {
            if (customToken) window.keepAccountHarness.reauths += 1;
            session.email = signInEmail();
            // The escrow refresh enrolls an account that can now have escrow.
            if (!server.escrow && !escrowOff && server.email) {
                server.escrow = true;
                seal(session.email);
            }
            return 'ok';
        },
        rememberConfirmedContact: (email: string) => {
            session.confirmed = email.trim().toLowerCase();
        },
        getConfirmedContact: () => session.confirmed,
        getPendingAccountContact: () => undefined,
        confirmEscrowPin: async ({ pin, retypedEmail }: { pin: string; retypedEmail?: string }) => {
            window.keepAccountHarness.confirms += 1;
            confirmable(retypedEmail);
            if (pinMismatch || pin.length !== 6) {
                pinMismatch = false;
                throw named('EscrowPinMismatchError');
            }
            seal(session.email);
        },
        resealEscrowContact: async ({ retypedEmail }: { retypedEmail?: string } = {}) => {
            confirmable(retypedEmail);
            seal(session.email);
        },
    } as unknown as AppAuthContextValue;

    return { AppAuthContext: globalScope[APP_AUTH_CONTEXT_KEY], appAuthValue };
};
