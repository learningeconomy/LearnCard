import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { keyOutline, fingerPrint, documentTextOutline, checkmarkCircleOutline, alertCircleOutline, copyOutline, checkmarkOutline } from 'ionicons/icons';

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
    const [activeTab, setActiveTab] = useState<RecoverySetupType>('password');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [recoveryPhrase, setRecoveryPhrase] = useState<string | null>(null);
    const [phraseCopied, setPhraseCopied] = useState(false);
    const [phraseConfirmed, setPhraseConfirmed] = useState(false);

    const hasMethod = (type: string) => existingMethods.some(m => m.type === type);
    const webAuthnSupported = isWebAuthnSupported();

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
            setSuccess('Password recovery is set up!');
            setPassword('');
            setConfirmPassword('');
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
            setSuccess('Passkey recovery is set up!');
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
        setSuccess('Recovery phrase saved! Keep it somewhere safe.');
    };

    const allTabs = [
        { id: 'password' as const, label: 'Password', icon: keyOutline },
        { id: 'passkey' as const, label: 'Passkey', icon: fingerPrint },
        { id: 'phrase' as const, label: 'Phrase', icon: documentTextOutline },
    ];

    // Hide passkey tab entirely on native platforms (WebAuthn unavailable in WKWebView / Android WebView)
    const tabs = Capacitor.isNativePlatform()
        ? allTabs.filter(t => t.id !== 'passkey')
        : allTabs;

    return (
        <div className="p-6 max-w-md mx-auto">
            <div className="text-center mb-5">
                <h2 className="text-xl font-semibold text-grayscale-900 mb-1">Protect Your Account</h2>

                <p className="text-sm text-grayscale-600 leading-relaxed">
                    Set up a recovery method so you can get back in if you lose access to this device.
                </p>
            </div>

            <div className="flex gap-2 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setError(null);
                            setSuccess(null);
                        }}
                        className={`flex-1 py-2.5 px-3 rounded-full flex items-center justify-center gap-1.5 text-sm font-medium transition-all ${
                            activeTab === tab.id
                                ? 'bg-grayscale-900 text-white'
                                : 'bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200'
                        }`}
                    >
                        <IonIcon icon={tab.icon} className="text-sm" />
                        {tab.label}

                        {hasMethod(tab.id) && (
                            <IonIcon icon={checkmarkCircleOutline} className="text-emerald-400 text-sm" />
                        )}
                    </button>
                ))}
            </div>

            {error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                    <IonIcon icon={alertCircleOutline} className="text-red-400 text-lg mt-0.5 shrink-0" />

                    <span className="text-sm text-red-700 leading-relaxed">{error}</span>
                </div>
            )}

            {success && (
                <div className="mb-5 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-2.5">
                    <IonIcon icon={checkmarkCircleOutline} className="text-emerald-500 text-lg mt-0.5 shrink-0" />

                    <span className="text-sm text-emerald-700 leading-relaxed">{success}</span>
                </div>
            )}

            {activeTab === 'password' && (
                <div className="space-y-4">
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

                    <button
                        onClick={handlePasswordSetup}
                        disabled={loading || !password || !confirmPassword}
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Setting up...
                            </span>
                        ) : 'Set Up Password'}
                    </button>
                </div>
            )}

            {activeTab === 'passkey' && (
                <div className="space-y-4">
                    {!webAuthnSupported ? (
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                            <p className="text-sm text-amber-800 leading-relaxed">
                                Passkeys aren't supported on this device or browser. Try using a password or recovery phrase instead.
                            </p>
                        </div>
                    ) : (
                        <>
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

                            <button
                                onClick={handlePasskeySetup}
                                disabled={loading}
                                className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Setting up...
                                    </span>
                                ) : 'Set Up Passkey'}
                            </button>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'phrase' && (
                <div className="space-y-4">
                    {!recoveryPhrase ? (
                        <>
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

                            <button
                                onClick={handleGeneratePhrase}
                                disabled={loading}
                                className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Generating...
                                    </span>
                                ) : 'Generate Recovery Phrase'}
                            </button>
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

            <div className="mt-6 pt-4 border-t border-grayscale-200">
                <button
                    onClick={onClose}
                    className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                >
                    {success ? 'Done' : 'Skip for Now'}
                </button>
            </div>
        </div>
    );
};

export default RecoverySetupModal;
