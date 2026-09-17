import { Capacitor } from '@capacitor/core';
import type { Auth, ConfirmationResult, UserCredential } from 'firebase/auth';
import type { AuthUser, PhoneVerificationHandle } from '@learncard/types';
import { ensureRecaptcha, destroyRecaptcha } from '../helpers/recaptcha.helpers';
import { getLogger } from '../logging/logger';
import { loadFirebaseAuth } from './firebaseAuthModule';
import type { FirebasePhoneAuth, FirebaseSignInAdapterConfig, NativeListenerHandle } from './types';

const log = getLogger('firebase-phone-auth');

/** Owns the verification session; no confirmation object or ID is stored on window. */
export const createFirebasePhoneAuth = (
    config: FirebaseSignInAdapterConfig,
    onSignedIn: (user: AuthUser) => AuthUser
): FirebasePhoneAuth => {
    let pending: PhoneVerificationHandle | undefined;
    let generation = 0;
    let sending = false;
    let rejectSend: ((error: Error) => void) | undefined;
    let listeners: NativeListenerHandle[] = [];
    const sent = new Set<() => void>();
    const completed = new Set<(code: string | undefined) => void>();
    const failed = new Set<(error: unknown) => void>();
    const emit = <T>(callbacks: Set<(value: T) => void>, value: T): void => {
        callbacks.forEach(callback => {
            try {
                callback(value);
            } catch {
                log.warn('Phone verification callback failed');
            }
        });
    };
    const remove = (handle: NativeListenerHandle): void => {
        void handle.remove().catch(() => log.warn('Unable to remove phone verification listener'));
    };
    const reset = (): void => {
        generation += 1;
        pending = undefined;
        sending = false;
        rejectSend?.(new Error('Phone verification cancelled'));
        rejectSend = undefined;
        listeners.forEach(remove);
        listeners = [];
        if (typeof window !== 'undefined') destroyRecaptcha();
    };
    const subscribe = <T>(
        callbacks: Set<(value: T) => void>,
        callback: (value: T) => void
    ): (() => void) => {
        callbacks.add(callback);
        return (): void => {
            callbacks.delete(callback);
        };
    };
    const confirmPhoneOtp = async (
        handleOrCode: PhoneVerificationHandle | string | number,
        legacyCode?: string | number
    ): Promise<AuthUser> => {
        const handle = typeof handleOrCode === 'object' ? handleOrCode : pending;
        const code = typeof handleOrCode === 'object' ? legacyCode : handleOrCode;
        if (!handle || code === undefined)
            throw new Error('Request a phone code before confirming');
        const currentGeneration = generation;
        const confirmation = handle._internal as ConfirmationResult | undefined;
        let result: UserCredential;
        if (confirmation?.confirm) {
            result = await confirmation.confirm(String(code));
            await result.user.getIdToken(true);
        } else {
            const { PhoneAuthProvider, signInWithCredential } = await loadFirebaseAuth();
            result = await signInWithCredential(
                config.getAuth() as Auth,
                PhoneAuthProvider.credential(handle.verificationId, String(code))
            );
            await result.user.getIdToken();
        }
        const user = result.user;
        // A bad code leaves the session available for retry; only success consumes it.
        if (currentGeneration === generation) reset();
        return onSignedIn({
            id: user.uid,
            email: user.email || undefined,
            phone: user.phoneNumber || undefined,
            displayName: user.displayName || undefined,
            photoUrl: user.photoURL || undefined,
            providerType: 'firebase',
            createdAt: user.metadata.creationTime
                ? new Date(user.metadata.creationTime)
                : undefined,
        });
    };

    return {
        sendPhoneOtp: async (phoneNumber): Promise<PhoneVerificationHandle> => {
            if (sending) throw new Error('A phone code request is already in progress');
            reset();
            sending = true;
            const currentGeneration = generation;
            try {
                if (!config.isNativePlatform?.()) {
                    const verifier = await ensureRecaptcha(config.getAuth());
                    const { signInWithPhoneNumber } = await loadFirebaseAuth();
                    if (generation !== currentGeneration)
                        throw new Error('Phone verification cancelled');
                    const confirmation = await signInWithPhoneNumber(
                        config.getAuth() as Auth,
                        phoneNumber,
                        verifier
                    );
                    if (generation !== currentGeneration)
                        throw new Error('Phone verification cancelled');
                    pending = {
                        verificationId: confirmation.verificationId,
                        _internal: confirmation,
                    };
                    sending = false;
                    emit(sent, undefined);
                    return pending;
                }
                const native = config.getNativeAuth?.();
                if (!native?.addListener || !native.signInWithPhoneNumber) {
                    throw new Error('Native phone sign-in requires the Firebase phone plugin');
                }
                // Attach every listener before starting the SDK request; it may emit immediately.
                return await new Promise<PhoneVerificationHandle>((resolve, reject) => {
                    rejectSend = reject;
                    const register = async (
                        handle: Promise<NativeListenerHandle>
                    ): Promise<void> => {
                        const listener = await handle;
                        if (generation !== currentGeneration) remove(listener);
                        else listeners.push(listener);
                    };
                    const start = async (): Promise<void> => {
                        await Promise.all([
                            register(
                                native.addListener!('phoneCodeSent', event => {
                                    if (generation !== currentGeneration) return;
                                    pending = { verificationId: event.verificationId };
                                    sending = false;
                                    rejectSend = undefined;
                                    resolve(pending);
                                    emit(sent, undefined);
                                })
                            ),
                            register(
                                native.addListener!('phoneVerificationCompleted', event => {
                                    if (generation !== currentGeneration) return;
                                    if (pending) {
                                        emit(completed, event.verificationCode);
                                        return;
                                    }
                                    // Android instant verification fires this without
                                    // `phoneCodeSent`; settle the send so a retry isn't blocked.
                                    const error = new Error(
                                        'Phone verification completed before a code was sent. Please try again.'
                                    );
                                    reject(error);
                                    reset();
                                    emit(failed, error);
                                })
                            ),
                            register(
                                native.addListener!('phoneVerificationFailed', event => {
                                    if (generation !== currentGeneration) return;
                                    const error = new Error(event.message);
                                    reject(error);
                                    reset();
                                    emit(failed, error);
                                })
                            ),
                        ]);
                        if (generation !== currentGeneration) return;
                        await native.signInWithPhoneNumber!({
                            phoneNumber,
                            skipNativeAuth: Capacitor.getPlatform() === 'android',
                        });
                    };
                    void start().catch(reject);
                });
            } catch (error) {
                if (generation === currentGeneration) reset();
                throw error;
            } finally {
                if (generation === currentGeneration) sending = false;
            }
        },
        confirmPhoneOtp,
        onPhoneCodeSent: (callback): (() => void) => subscribe(sent, callback),
        onPhoneVerificationCompleted: (callback): (() => void) => subscribe(completed, callback),
        onPhoneVerificationFailed: (callback): (() => void) => subscribe(failed, callback),
        // Subscribers own their unsubscribe functions; cleanup only tears down the session.
        cleanup: reset,
    };
};
