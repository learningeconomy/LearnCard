import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InMemoryWebStorage } from 'oidc-client-ts';
import { AuthSessionError } from '@learncard/types';
import { createKeycloakAuthProvider } from '../createKeycloakAuthProvider';
import { createKeycloakSignInAdapter } from '../../auth-adapters/createKeycloakSignInAdapter';
import { createUser, keycloakConfig } from './keycloakTestHelpers';

const navigation = vi.hoisted(() => ({
    navigate: vi.fn(async ({ url }: { url: string }) => ({ url })),
    close: vi.fn(),
}));
const sdkEvents = vi.hoisted(() => ({ load: vi.fn() }));

vi.mock('oidc-client-ts', async importOriginal => {
    const sdk = await importOriginal<typeof import('oidc-client-ts')>();
    return {
        ...sdk,
        UserManager: class extends sdk.UserManager {
            constructor(...args: ConstructorParameters<typeof sdk.UserManager>) {
                // Exercise the SDK's revocation-enabled path even when a host
                // chooses to rely on end_session instead of prior revocation.
                super(
                    { ...args[0], revokeTokensOnSignout: true },
                    { prepare: async () => navigation, callback: async () => undefined },
                    args[2],
                    args[3]
                );
                const load = this.events.load.bind(this.events);
                this.events.load = (user, raiseEvent) => {
                    sdkEvents.load(user, raiseEvent);
                    return load(user, raiseEvent);
                };
            }
        },
    };
});

const authority = 'https://auth.example.org/realms/learncard';
const revocationEndpoint = `${authority}/protocol/openid-connect/revoke`;
const endSessionEndpoint = `${authority}/protocol/openid-connect/logout`;
const json = (body: object, status = 200): Response =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('SDK revocation-enabled Keycloak logout', () => {
    it.each(['callback', 'renewal'] as const)(
        'finishes logout without republishing while stale %s work overlaps, then admits fresh sign-in',
        async kind => {
            const sdk = await vi.importActual<typeof import('oidc-client-ts')>('oidc-client-ts');
            const storage = new InMemoryWebStorage();
            const config = {
                ...keycloakConfig,
                postLogoutRedirectUri: 'https://app.example.org/logout',
                stateStore: storage,
                userStore: storage,
            };
            let releaseRevocation!: () => void;
            let enteredRevocation!: () => void;
            const revocationGate = new Promise<void>(resolve => {
                releaseRevocation = resolve;
            });
            const revocationStarted = new Promise<void>(resolve => {
                enteredRevocation = resolve;
            });
            const fetch = vi.fn(async (input: RequestInfo | URL) => {
                const url = String(input);
                if (url.endsWith('/.well-known/openid-configuration')) {
                    return json({
                        issuer: authority,
                        revocation_endpoint: revocationEndpoint,
                        end_session_endpoint: endSessionEndpoint,
                    });
                }
                expect(url).toBe(revocationEndpoint);
                enteredRevocation();
                await revocationGate;
                return json({});
            });
            vi.stubGlobal('fetch', fetch);

            const provider = createKeycloakAuthProvider(config);
            await provider.userManager.storeUser(createUser());
            const stored = vi.spyOn(storage, 'setItem');
            const loaded = vi.fn();
            provider.userManager.events.addUserLoaded(loaded);
            const sdkLoad = sdkEvents.load;
            let releaseOld!: () => void;
            let enteredOld!: () => void;
            const oldGate = new Promise<void>(resolve => {
                releaseOld = resolve;
            });
            const oldStarted = new Promise<void>(resolve => {
                enteredOld = resolve;
            });
            const method = kind === 'callback' ? 'signinCallback' : 'signinSilent';
            vi.spyOn(sdk.UserManager.prototype, method).mockImplementationOnce(async function () {
                enteredOld();
                await oldGate;
                const user = createUser({ id_token: 'stale' });
                await this.storeUser(user);
                await this.events.load(user);
                return user;
            });
            const onUser = vi.fn();
            const onSignedIn = vi.fn();
            const adapter = createKeycloakSignInAdapter({
                provider,
                requestEmailOtpTicket: async () => 'unused',
                openAuthorization: async () => {
                    await provider.handleRedirectCallback();
                },
                onSignedIn,
            });
            adapter.subscribe(onUser);
            await vi.waitFor(() => expect(adapter.getCurrentUser()).toHaveProperty('id', 'user-1'));
            const old =
                kind === 'callback' ? adapter.signInWithGoogle() : provider.getIdToken(true);
            const oldOutcome = old.catch(error => error);
            await oldStarted;
            onUser.mockClear();
            sdkLoad.mockClear();

            const signingOut = adapter.signOut();
            await revocationStarted;
            if (kind === 'callback') expect(await oldOutcome).toBeInstanceOf(AuthSessionError);
            const freshAdmission = provider.beginSignIn();
            releaseOld();
            expect(await oldOutcome).toBeInstanceOf(AuthSessionError);
            // Even an unrelated token-stripped object is not logout's own SDK user.
            await expect(
                provider.userManager.storeUser(createUser({ refresh_token: undefined }))
            ).rejects.toBeInstanceOf(AuthSessionError);
            expect(navigation.navigate).not.toHaveBeenCalled();
            releaseRevocation();
            await signingOut;

            expect(navigation.navigate).toHaveBeenCalledOnce();
            const endSession = new URL(navigation.navigate.mock.calls[0]![0].url);
            expect(`${endSession.origin}${endSession.pathname}`).toBe(endSessionEndpoint);
            expect(endSession.searchParams.get('id_token_hint')).toBe('id');
            expect(endSession.searchParams.get('post_logout_redirect_uri')).toBe(
                config.postLogoutRedirectUri
            );
            expect(loaded).not.toHaveBeenCalled();
            expect(
                sdkLoad.mock.calls.filter(([, raiseEvent]) => raiseEvent !== false)
            ).toHaveLength(0);
            expect(stored).not.toHaveBeenCalled();
            expect(onUser.mock.calls.every(([user]) => user === null)).toBe(true);
            expect(onSignedIn).not.toHaveBeenCalled();
            expect(await provider.userManager.getUser()).toBeNull();
            const reconstructed = createKeycloakAuthProvider(config);
            expect(await reconstructed.userManager.getUser()).toBeNull();
            expect(await reconstructed.getCurrentUser()).toBeNull();

            await freshAdmission;
            vi.spyOn(sdk.UserManager.prototype, 'signinCallback').mockImplementation(
                async function () {
                    const user = createUser({
                        profile: { ...createUser().profile, sub: 'fresh-user' },
                    });
                    await this.storeUser(user);
                    await this.events.load(user);
                    return user;
                }
            );
            expect(await adapter.signInWithGoogle()).toHaveProperty('id', 'fresh-user');
            expect(adapter.getCurrentUser()).toHaveProperty('id', 'fresh-user');
            expect(await reconstructed.getCurrentUser()).toHaveProperty('id', 'fresh-user');
            expect(onSignedIn).toHaveBeenCalledOnce();
            adapter.cleanup?.();
        }
    );

    it('removes persisted auth even when remote revocation fails before SDK removal', async () => {
        const storage = new InMemoryWebStorage();
        const config = {
            ...keycloakConfig,
            postLogoutRedirectUri: 'https://app.example.org/logout',
            stateStore: storage,
            userStore: storage,
        };
        vi.stubGlobal(
            'fetch',
            vi.fn(async (input: RequestInfo | URL) => {
                if (String(input).endsWith('/.well-known/openid-configuration')) {
                    return json({
                        issuer: authority,
                        revocation_endpoint: revocationEndpoint,
                        end_session_endpoint: endSessionEndpoint,
                    });
                }
                expect(String(input)).toBe(revocationEndpoint);
                throw new Error('revocation unavailable');
            })
        );
        const provider = createKeycloakAuthProvider(config);
        await provider.userManager.storeUser(createUser());
        const loaded = vi.fn();
        provider.userManager.events.addUserLoaded(loaded);
        const sdkLoad = sdkEvents.load;
        // Hosts can surface remote failure or fall back to local logout; neither
        // policy may leave an identity that a new provider could restore.
        const outcome = await provider.signOut().catch(error => error);
        if (outcome) expect(outcome).toMatchObject({ message: 'revocation unavailable' });
        expect(navigation.navigate).not.toHaveBeenCalled();
        expect(navigation.close).toHaveBeenCalledOnce();
        expect(loaded).not.toHaveBeenCalled();
        expect(sdkLoad.mock.calls.filter(([, raiseEvent]) => raiseEvent !== false)).toHaveLength(0);
        const reconstructed = createKeycloakAuthProvider(config);
        expect(await reconstructed.userManager.getUser()).toBeNull();
        expect(await reconstructed.getCurrentUser()).toBeNull();
    });
});
