import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import {
    keyOutline,
    clipboardOutline,
    eyeOutline,
    eyeOffOutline,
    alertCircleOutline,
    personCircleOutline,
} from 'ionicons/icons';
import { useIsLoggedIn, useCurrentUser, useGetCurrentLCNUser } from 'learn-card-base';
import useTheme from '../../theme/hooks/useTheme';
import useLogout from '../../hooks/useLogout';
import { useSeedLogin } from '../login/useSeedLogin';
import { sanitizeNextPath } from './sanitizeNextPath';
import * as m from '../../paraglide/messages.js';

const SEED_HASH_PREFIX = '#seed=';

const readSeedFromHash = (): string | null => {
    const { hash } = window.location;
    return hash.startsWith(SEED_HASH_PREFIX) ? hash.slice(SEED_HASH_PREFIX.length) : null;
};

const DeveloperSignInPage: React.FC = () => {
    const { colors } = useTheme();
    const loginBgColor =
        colors?.defaults?.loginBgColor ?? colors?.defaults?.loaders?.[0] ?? '#058760';

    const history = useHistory();
    const location = useLocation();
    const isLoggedIn = useIsLoggedIn();
    const currentUser = useCurrentUser();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { signInWithSeed, validate } = useSeedLogin();
    const { handleLogout, isLoggingOut } = useLogout();

    const [seed, setSeed] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [hint, setHint] = useState<string | null>(null);
    const [hashSeed] = useState<string | null>(readSeedFromHash);
    const [hasPendingSwitch, setHasPendingSwitch] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    const nextPath = sanitizeNextPath(new URLSearchParams(location.search).get('next'));
    const isBusy = isSigningIn || isLoggingOut;

    const currentAccountName =
        currentLCNUser?.displayName?.trim() ||
        currentUser?.name?.trim() ||
        currentUser?.email?.trim() ||
        null;

    useEffect(() => {
        if (hashSeed === null) return;

        window.history.replaceState(null, '', location.pathname + location.search);
        setSeed(hashSeed);

        const validationError = validate(hashSeed);
        if (validationError) {
            setError(validationError);
            return;
        }

        if (!isLoggedIn) {
            handleSignIn(hashSeed);
            return;
        }

        if (currentUser?.privateKey === hashSeed) {
            history.replace(nextPath);
            return;
        }

        setHasPendingSwitch(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSignIn = async (seedToUse: string) => {
        const validationError = validate(seedToUse);
        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);
        setHint(null);
        setIsSigningIn(true);

        try {
            await signInWithSeed(seedToUse);
            history.replace(nextPath);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : m['login.seedPhrase.error.generic']());
            setIsSigningIn(false);
        }
    };

    const handleSwitchAccount = async (seedToUse: string) => {
        const validationError = validate(seedToUse);
        if (validationError) {
            setError(validationError);
            return;
        }

        if (currentUser?.privateKey === seedToUse) {
            history.replace(nextPath);
            return;
        }

        setError(null);
        setHint(null);

        const returnUrl = `${window.location.origin}${location.pathname}${location.search}${SEED_HASH_PREFIX}${seedToUse}`;
        await handleLogout({ overrideRedirectUrl: returnUrl });
    };

    const handleSubmit = (seedToUse: string) => {
        if (isLoggedIn) {
            handleSwitchAccount(seedToUse);
        } else {
            handleSignIn(seedToUse);
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const trimmed = text.trim();
            setSeed(trimmed);

            const validationError = validate(trimmed);
            if (validationError) {
                setError(validationError);
                setHint(null);
                return;
            }

            if (isLoggedIn) {
                setError(null);
                setHint(null);
                return;
            }

            handleSignIn(trimmed);
        } catch (err) {
            setHint(m['login.developerSignIn.pasteHint']());
            inputRef.current?.focus();
        }
    };

    const submitLabel = isLoggedIn
        ? m['login.developerSignIn.signOutAndSwitch']()
        : m['login.developerSignIn.signInAction']();

    const busyLabel = isLoggingOut
        ? m['login.developerSignIn.switching']()
        : m['login.developerSignIn.signingIn']();

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center p-4"
            style={{ backgroundColor: loginBgColor }}
        >
            <div className="w-full max-w-[480px] bg-white rounded-[20px] shadow-2xl font-poppins p-8 animate-fade-in-up">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-12 h-12 bg-grayscale-100 rounded-full flex items-center justify-center mb-4">
                        <IonIcon icon={keyOutline} className="text-grayscale-900 text-2xl" />
                    </div>
                    <h1 className="text-xl font-semibold text-grayscale-900 mb-2">
                        {m['login.developerSignIn.title']()}
                    </h1>
                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        {m['login.developerSignIn.description']()}
                    </p>
                </div>

                {isLoggedIn && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                        <div className="flex items-start gap-2.5">
                            <IonIcon
                                icon={personCircleOutline}
                                className="text-amber-500 text-lg mt-0.5 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-amber-900 truncate">
                                    {currentAccountName
                                        ? m['login.developerSignIn.alreadySignedInAs']({
                                              name: currentAccountName,
                                          })
                                        : m['login.developerSignIn.alreadySignedIn']()}
                                </p>
                                <p className="text-sm text-amber-700 leading-relaxed mt-1">
                                    {hasPendingSwitch
                                        ? m['login.developerSignIn.linkSwitchBody']()
                                        : m['login.developerSignIn.alreadySignedInBody']()}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-4">
                            {hasPendingSwitch && (
                                <button
                                    onClick={() => handleSwitchAccount(seed)}
                                    disabled={isBusy}
                                    className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoggingOut ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {m['login.developerSignIn.switching']()}
                                        </>
                                    ) : (
                                        m['login.developerSignIn.switchAction']()
                                    )}
                                </button>
                            )}
                            <button
                                onClick={() => history.replace(nextPath)}
                                disabled={isBusy}
                                className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {currentAccountName
                                    ? m['login.developerSignIn.continueAs']({
                                          name: currentAccountName,
                                      })
                                    : m['login.developerSignIn.stayAction']()}
                            </button>
                        </div>
                    </div>
                )}

                <button
                    onClick={handlePaste}
                    disabled={isBusy}
                    className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6"
                >
                    {isSigningIn ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {m['login.developerSignIn.signingIn']()}
                        </>
                    ) : (
                        <>
                            <IonIcon icon={clipboardOutline} className="text-lg" />
                            {m['login.developerSignIn.pasteAction']()}
                        </>
                    )}
                </button>

                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-grayscale-200" />
                    <span className="text-xs text-grayscale-400 uppercase tracking-wider">
                        {m['login.developerSignIn.or']()}
                    </span>
                    <div className="flex-1 h-px bg-grayscale-200" />
                </div>

                <div className="mb-6">
                    <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                        {m['login.developerSignIn.seedLabel']()}
                    </label>
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="off"
                            spellCheck={false}
                            inputMode="text"
                            value={seed}
                            onChange={e => setSeed(e.target.value)}
                            placeholder="64 characters, 0–9 and a–f"
                            className="w-full py-3 pl-4 pr-12 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white font-mono tracking-wide"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-grayscale-400 hover:text-grayscale-600 p-1"
                        >
                            <IonIcon
                                icon={showPassword ? eyeOffOutline : eyeOutline}
                                className="text-xl"
                            />
                        </button>
                    </div>
                    <div className="flex justify-between items-start mt-1.5">
                        <div className="text-xs text-grayscale-400">
                            {hint && <span className="text-grayscale-600">{hint}</span>}
                        </div>
                        <div className="text-xs text-grayscale-400 font-mono">
                            {seed.length} / 64
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                        <IonIcon
                            icon={alertCircleOutline}
                            className="text-red-400 text-lg mt-0.5 shrink-0"
                        />
                        <span className="text-sm text-red-700 leading-relaxed">{error}</span>
                    </div>
                )}

                <button
                    onClick={() => handleSubmit(seed)}
                    disabled={isBusy || !!validate(seed)}
                    className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent mb-6 flex items-center justify-center gap-2"
                >
                    {isBusy ? (
                        <>
                            <span className="w-4 h-4 border-2 border-grayscale-300 border-t-grayscale-700 rounded-full animate-spin" />
                            {busyLabel}
                        </>
                    ) : (
                        submitLabel
                    )}
                </button>

                <div className="text-center space-y-2">
                    <p className="text-xs text-grayscale-500">
                        {m['login.developerSignIn.notDeveloper']()}
                        <button
                            onClick={() => history.push('/login')}
                            className="text-grayscale-900 font-medium hover:underline"
                        >
                            {m['login.developerSignIn.signInNormally']()}
                        </button>
                    </p>
                    <p className="text-xs text-grayscale-500">
                        {m['login.developerSignIn.securityWarning']()}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DeveloperSignInPage;
