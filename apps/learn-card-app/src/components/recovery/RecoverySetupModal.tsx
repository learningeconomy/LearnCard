import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    keyOutline,
    fingerPrint,
    documentTextOutline,
    checkmarkCircleOutline,
    alertCircleOutline,
    copyOutline,
    checkmarkOutline,
} from 'ionicons/icons';

import { Capacitor } from '@capacitor/core';
import { isWebAuthnSupported } from '@learncard/sss-key-manager';

export type RecoverySetupType = 'password' | 'passkey' | 'phrase';

interface RecoverySetupModalProps {
    onSetupPassword: (password: string) => Promise<void>;
    onSetupPasskey: () => Promise<string>;
    onGeneratePhrase: () => Promise<string>;
    existingMethods: { type: string; createdAt: string }[];
    onClose: () => void;
}

export const RecoverySetupModal: React.FC<RecoverySetupModalProps> = ({
    onSetupPassword,
    onSetupPasskey,
    onGeneratePhrase,
    existingMethods,
    onClose,
}) => {
    const webAuthnSupported = isWebAuthnSupported();
    const isNative = Capacitor.isNativePlatform();

    const hasExistingMethod = (type: string) => existingMethods.some(m => m.type === type);

    // Track methods configured during this modal session (persists across tab switches)
    const [sessionConfigured, setSessionConfigured] = useState<Set<RecoverySetupType>>(new Set());

    const isConfigured = (type: RecoverySetupType): boolean =>
        hasExistingMethod(type) || sessionConfigured.has(type);

    const anyConfigured = existingMethods.some(m => m.type !== 'email') || sessionConfigured.size > 0;

    // Default to passkey when supported, no existing methods, and not native
    const [activeTab, setActiveTab] = useState<RecoverySetupType>(() => {
        if (!anyConfigured && !isNative && webAuthnSupported) return 'passkey';

        return 'password';
    });

    // Whether the user clicked "Change" on an already-configured method
    const [showUpdateForm, setShowUpdateForm] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [recoveryPhrase, setRecoveryPhrase] = useState<string | null>(null);
    const [phraseCopied, setPhraseCopied] = useState(false);
    const [phraseConfirmed, setPhraseConfirmed] = useState(false);

    const handleTabSwitch = (tab: RecoverySetupType) => {
        setActiveTab(tab);
        setError(null);
        setSuccess(null);
        setShowUpdateForm(false);
    };

    const markConfigured = (type: RecoverySetupType) => {
        setSessionConfigured(prev => new Set(prev).add(type));
    };

    // Whether the active tab's form is for an update (vs first-time setup)
    const isUpdate = isConfigured(activeTab) && showUpdateForm;

    const handlePasswordSetup = async () => {
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords don\'t match.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await onSetupPassword(password);
            markConfigured('password');
            setSuccess('Password recovery is set up!');
            setPassword('');
            setConfirmPassword('');
            setShowUpdateForm(false);
        } catch (e) {
            console.error('[RecoverySetupModal] handlePasswordSetup error:', e, typeof e);
            setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePasskeySetup = async () => {
        setLoading(true);
        setError(null);

        try {
            await onSetupPasskey();
            markConfigured('passkey');
            setSuccess('Passkey recovery is set up!');
            setShowUpdateForm(false);
        } catch (e) {
            console.error('[RecoverySetupModal] handlePasskeySetup error:', e, typeof e);
            setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePhrase = async () => {
        setLoading(true);
        setError(null);

        try {
            const phrase = await onGeneratePhrase();
            setRecoveryPhrase(phrase);
        } catch (e) {
            console.error('[RecoverySetupModal] handleGeneratePhrase error:', e, typeof e);
            setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyPhrase = async () => {
        if (recoveryPhrase) {
            await navigator.clipboard.writeText(recoveryPhrase);
            setPhraseCopied(true);
            setTimeout(() => setPhraseCopied(false), 2000);
        }
    };

    const handleConfirmPhrase = () => {
        setPhraseConfirmed(true);
        markConfigured('phrase');
        setSuccess('Recovery phrase saved! Keep it somewhere safe.');
    };

    const allTabs = [
        { id: 'password' as const, label: 'Password', icon: keyOutline },
        { id: 'passkey' as const, label: 'Passkey', icon: fingerPrint },
        { id: 'phrase' as const, label: 'Phrase', icon: documentTextOutline },
    ];

    // Hide passkey tab entirely on native platforms (WebAuthn unavailable in WKWebView / Android WebView)
    const tabs = isNative ? allTabs.filter(t => t.id !== 'passkey') : allTabs;

    const configuredCount = tabs.filter(t => isConfigured(t.id)).length;

    // ── Shared helpers ──────────────────────────────────────────────

    const updateWarning = (text: string) => (
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-2.5">
            <IonIcon icon={alertCircleOutline} className="text-amber-500 text-base mt-0.5 shrink-0" />

            <span className="text-xs text-amber-700 leading-relaxed">{text}</span>
        </div>
    );

    const cancelUpdateButton = (onCancel?: () => void) => (
        <button
            onClick={() => {
                setShowUpdateForm(false);
                setError(null);
                onCancel?.();
            }}
            className="w-full py-2.5 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
        >
            Cancel
        </button>
    );

    const primaryButton = (
        label: string,
        onClick: () => void,
        disabled: boolean,
        loadingText: string,
    ) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
            {loading ? (
                <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {loadingText}
                </span>
            ) : label}
        </button>
    );

    // Compact status row for a configured method — replaces the old large green card + button
    const configuredRow = (statusText: string, onChangeClick: () => void) => (
        <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-grayscale-100/60">
            <div className="flex items-center gap-2.5">
                <IonIcon icon={checkmarkCircleOutline} className="text-emerald-500 text-base shrink-0" />

                <span className="text-sm text-grayscale-900">{statusText}</span>
            </div>

            <button
                onClick={onChangeClick}
                className="text-xs font-medium text-grayscale-500 hover:text-grayscale-900 transition-colors"
            >
                Change
            </button>
        </div>
    );

    // ── Render ─────────────────────────────────────────────────────────

    return (
        <div className="p-6 max-w-md mx-auto">
            {/* Dynamic Header */}
            <div className="text-center mb-5">
                <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                    {anyConfigured ? 'Account Recovery' : 'Protect Your Account'}
                </h2>

                <p className="text-sm text-grayscale-600 leading-relaxed">
                    {anyConfigured
                        ? `${configuredCount} recovery ${configuredCount === 1 ? 'method' : 'methods'} active`
                        : 'Set up a recovery method so you can get back in if you lose access to this device.'
                    }
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabSwitch(tab.id)}
                        className={`flex-1 py-2.5 px-3 rounded-full flex items-center justify-center gap-1.5 text-sm font-medium transition-all ${
                            activeTab === tab.id
                                ? 'bg-grayscale-900 text-white'
                                : 'bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200'
                        }`}
                    >
                        <IonIcon icon={tab.icon} className="text-sm" />
                        {tab.label}

                        {isConfigured(tab.id) && (
                            <IonIcon icon={checkmarkCircleOutline} className="text-emerald-400 text-sm" />
                        )}
                    </button>
                ))}
            </div>

            {/* Error */}
            {error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                    <IonIcon icon={alertCircleOutline} className="text-red-400 text-lg mt-0.5 shrink-0" />

                    <span className="text-sm text-red-700 leading-relaxed">{error}</span>
                </div>
            )}

            {/* Success */}
            {success && (
                <div className="mb-5 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-2.5">
                    <IonIcon icon={checkmarkCircleOutline} className="text-emerald-500 text-lg mt-0.5 shrink-0" />

                    <span className="text-sm text-emerald-700 leading-relaxed">{success}</span>
                </div>
            )}

            {/* ── Password Tab ──────────────────────────────────── */}
            {activeTab === 'password' && (
                <div className="space-y-4">
                    {isConfigured('password') && !showUpdateForm ? (
                        configuredRow('Password is set up', () => setShowUpdateForm(true))
                    ) : (
                        <>
                            {isUpdate && updateWarning('This will replace your current recovery password.')}

                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                Choose a password you'll remember. You'll need it to recover your account on a new device.
                            </p>

                            <div>
                                <label className="block text-xs font-medium text-grayscale-700 mb-1.5">Password</label>

                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="At least 8 characters"
                                    className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-grayscale-700 mb-1.5">Confirm Password</label>

                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Type it again"
                                    className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                                />
                            </div>

                            {primaryButton(
                                isUpdate ? 'Update Password' : 'Set Up Password',
                                handlePasswordSetup,
                                loading || !password || !confirmPassword,
                                isUpdate ? 'Updating...' : 'Setting up...',
                            )}

                            {isUpdate && cancelUpdateButton(() => {
                                setPassword('');
                                setConfirmPassword('');
                            })}
                        </>
                    )}
                </div>
            )}

            {/* ── Passkey Tab ───────────────────────────────────── */}
            {activeTab === 'passkey' && (
                <div className="space-y-4">
                    {!webAuthnSupported ? (
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                            <p className="text-sm text-amber-800 leading-relaxed">
                                Passkeys aren't supported on this device or browser. Try using a password or recovery phrase instead.
                            </p>
                        </div>
                    ) : isConfigured('passkey') && !showUpdateForm ? (
                        configuredRow('Passkey is set up', () => setShowUpdateForm(true))
                    ) : (
                        <>
                            {!anyConfigured && (
                                <span className="inline-block text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                                    Recommended
                                </span>
                            )}

                            {isUpdate && updateWarning('This will replace your current passkey.')}

                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                Use Face ID, Touch ID, or Windows Hello as your recovery method. Nothing to remember.
                            </p>

                            <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                <div className="space-y-2.5 text-sm text-emerald-800">
                                    <div className="flex items-start gap-2.5">
                                        <IonIcon icon={fingerPrint} className="text-emerald-600 text-lg mt-0.5 shrink-0" />
                                        <span>Uses your device's secure biometric authentication</span>
                                    </div>

                                    <div className="flex items-start gap-2.5">
                                        <IonIcon icon={checkmarkCircleOutline} className="text-emerald-600 text-lg mt-0.5 shrink-0" />
                                        <span>No password to remember</span>
                                    </div>
                                </div>
                            </div>

                            {primaryButton(
                                isUpdate ? 'Replace Passkey' : 'Set Up Passkey',
                                handlePasskeySetup,
                                loading,
                                isUpdate ? 'Replacing...' : 'Setting up...',
                            )}

                            {isUpdate && cancelUpdateButton()}
                        </>
                    )}
                </div>
            )}

            {/* ── Phrase Tab ────────────────────────────────────── */}
            {activeTab === 'phrase' && (
                <div className="space-y-4">
                    {isConfigured('phrase') && !showUpdateForm && !recoveryPhrase ? (
                        configuredRow('Phrase is saved', () => setShowUpdateForm(true))
                    ) : !recoveryPhrase ? (
                        <>
                            {isUpdate && updateWarning('This will generate a new phrase. Your previous phrase will no longer work.')}

                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                Generate a 25-word phrase that can restore your account from anywhere. Write it down and keep it safe.
                            </p>

                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                                <p className="text-sm font-medium text-amber-800 mb-2">Keep it safe</p>

                                <ul className="text-sm text-amber-700 space-y-1.5">
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-500 mt-0.5">•</span>
                                        <span>Write it on paper and store it securely</span>
                                    </li>

                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-500 mt-0.5">•</span>
                                        <span>Never share it — anyone with this phrase has full access</span>
                                    </li>
                                </ul>
                            </div>

                            {primaryButton(
                                isUpdate ? 'Generate New Phrase' : 'Generate Recovery Phrase',
                                handleGeneratePhrase,
                                loading,
                                'Generating...',
                            )}

                            {isUpdate && cancelUpdateButton()}
                        </>
                    ) : (
                        <>
                            <div className="p-4 bg-grayscale-900 rounded-2xl">
                                <p className="text-xs text-grayscale-400 mb-2 font-medium">Your Recovery Phrase</p>

                                <p className="font-mono text-sm text-white leading-relaxed break-words">
                                    {recoveryPhrase}
                                </p>
                            </div>

                            <button
                                onClick={handleCopyPhrase}
                                className="w-full py-2.5 px-4 bg-grayscale-100 hover:bg-grayscale-200 rounded-[20px] flex items-center justify-center gap-2 text-sm text-grayscale-700 font-medium transition-colors"
                            >
                                <IonIcon icon={phraseCopied ? checkmarkOutline : copyOutline} className="text-base" />
                                {phraseCopied ? 'Copied!' : 'Copy to Clipboard'}
                            </button>

                            {!phraseConfirmed && (
                                <button
                                    onClick={handleConfirmPhrase}
                                    className="w-full py-3 px-4 rounded-[20px] bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors"
                                >
                                    I've Saved It Somewhere Safe
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Progress hint — only when some (but not all) methods are configured */}
            {anyConfigured && configuredCount < tabs.length && (
                <p className="mt-4 text-center text-xs text-grayscale-500 leading-relaxed">
                    Adding another method improves your security.
                </p>
            )}

            {/* Bottom action */}
            <div className="mt-6 pt-4 border-t border-grayscale-200">
                <button
                    onClick={onClose}
                    className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                >
                    {anyConfigured ? 'Done' : 'Skip for Now'}
                </button>
            </div>
        </div>
    );
};

export default RecoverySetupModal;
