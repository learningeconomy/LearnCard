import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { keyOutline, fingerPrint, documentTextOutline, alertCircleOutline, cloudUploadOutline, phonePortraitOutline, chevronBackOutline, mailOutline } from 'ionicons/icons';
import { QRCodeSVG } from 'qrcode.react';

import { Capacitor } from '@capacitor/core';
import { isWebAuthnSupported } from '@learncard/sss-key-manager';
import { QrLoginRequester, getAuthConfig } from 'learn-card-base';
import type { RecoveryReason } from 'learn-card-base';

export type RecoveryFlowType = 'password' | 'passkey' | 'phrase' | 'backup' | 'device' | 'email';

interface RecoveryFlowModalProps {
    availableMethods: { type: string; credentialId?: string; createdAt: string }[];
    recoveryReason?: RecoveryReason;
    onRecoverWithPassword: (password: string) => Promise<void>;
    onRecoverWithPasskey: (credentialId: string) => Promise<void>;
    onRecoverWithPhrase: (phrase: string) => Promise<void>;
    onRecoverWithBackup: (fileContents: string, password: string) => Promise<void>;
    onRecoverWithDevice?: (deviceShare: string) => Promise<void>;
    onRecoverWithEmail?: (emailShare: string) => Promise<void>;
    onCancel: () => void;
}

const friendlyError = (e: unknown): string => {
    if (e instanceof Error) {
        if (e.message.includes('decrypt')) return 'Incorrect password or corrupted data. Please try again.';
        if (e.message.includes('network') || e.message.includes('fetch')) return 'Connection issue. Please check your internet and try again.';
        if (e.message.includes('phrase') || e.message.includes('mnemonic')) return 'The recovery phrase doesn\'t look right. Please check for typos.';
        return e.message;
    }

    return 'Something went wrong. Please try again.';
};

const RECOVERY_COPY: Record<RecoveryReason, { title: string; description: string }> = {
    new_device: {
        title: 'Verify Your Identity',
        description: 'This device hasn\u2019t been set up for your account yet. Choose a method to sign in.',
    },
    stale_local_key: {
        title: 'Verify Your Identity',
        description: 'Your account security was recently updated on another device. Please verify to continue.',
    },
    missing_server_data: {
        title: 'Restore Access',
        description: 'Choose how you\u2019d like to restore access to your account.',
    },
};

const DEFAULT_COPY = {
    title: 'Restore Access',
    description: 'Choose how you\u2019d like to restore access.',
};

export const RecoveryFlowModal: React.FC<RecoveryFlowModalProps> = ({
    availableMethods,
    recoveryReason,
    onRecoverWithPassword,
    onRecoverWithPasskey,
    onRecoverWithPhrase,
    onRecoverWithBackup,
    onRecoverWithDevice,
    onRecoverWithEmail,
    onCancel,
}) => {
    const [activeMethod, setActiveMethod] = useState<RecoveryFlowType | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [password, setPassword] = useState('');
    const [phrase, setPhrase] = useState('');
    const [backupFile, setBackupFile] = useState<string | null>(null);
    const [backupPassword, setBackupPassword] = useState('');
    const [emailShare, setEmailShare] = useState('');

    const hasMethod = (type: string) => availableMethods.some(m => m.type === type);
    const webAuthnSupported = isWebAuthnSupported();

    const handlePasswordRecovery = async () => {
        if (!password) {
            setError('Please enter your recovery password.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await onRecoverWithPassword(password);
        } catch (e) {
            setError(friendlyError(e));
            setLoading(false);
        }
    };

    const handlePasskeyRecovery = async () => {
        const passkeyMethod = availableMethods.find(m => m.type === 'passkey');

        if (!passkeyMethod?.credentialId) {
            setError('No passkey found on this device.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await onRecoverWithPasskey(passkeyMethod.credentialId);
        } catch (e) {
            setError(friendlyError(e));
            setLoading(false);
        }
    };

    const handlePhraseRecovery = async () => {
        const words = phrase.trim().split(/\s+/);

        if (words.length < 25) {
            setError('Please enter all 25 words of your recovery phrase.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await onRecoverWithPhrase(phrase.trim());
        } catch (e) {
            setError(friendlyError(e));
            setLoading(false);
        }
    };

    const handleBackupRecovery = async () => {
        if (!backupFile) {
            setError('Please select your backup file.');
            return;
        }

        if (!backupPassword) {
            setError('Please enter the password for your backup file.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await onRecoverWithBackup(backupFile, backupPassword);
        } catch (e) {
            setError(friendlyError(e));
            setLoading(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = (e) => {
                setBackupFile(e.target?.result as string);
            };

            reader.readAsText(file);
        }
    };

    const handleEmailRecovery = async () => {
        if (!emailShare.trim()) {
            setError('Please paste the recovery key from your email.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await onRecoverWithEmail!(emailShare.trim());
        } catch (e) {
            setError(friendlyError(e));
            setLoading(false);
        }
    };

    const allMethods = [
        { id: 'password' as const, label: 'Password', desc: 'Use your recovery password', icon: keyOutline, available: hasMethod('password') },
        { id: 'passkey' as const, label: 'Passkey', desc: 'Use Face ID, Touch ID, or similar', icon: fingerPrint, available: hasMethod('passkey') && webAuthnSupported },
        { id: 'phrase' as const, label: 'Recovery Phrase', desc: 'Enter your 25-word phrase', icon: documentTextOutline, available: hasMethod('phrase') },
        { id: 'backup' as const, label: 'Backup File', desc: 'Upload your backup file', icon: cloudUploadOutline, available: hasMethod('backup') },
        { id: 'email' as const, label: 'Email Recovery Key', desc: 'Paste the key sent to your email', icon: mailOutline, available: hasMethod('email') && !!onRecoverWithEmail },
        { id: 'device' as const, label: 'Another Device', desc: 'Scan a code from a signed-in device', icon: phonePortraitOutline, available: !!onRecoverWithDevice },
    ];

    // Hide passkey entirely on native platforms (WebAuthn unavailable in WKWebView / Android WebView)
    const methods = Capacitor.isNativePlatform()
        ? allMethods.filter(m => m.id !== 'passkey')
        : allMethods;

    const phraseWordCount = phrase.trim() ? phrase.trim().split(/\s+/).length : 0;

    // ── Method picker ────────────────────────────────────────────

    if (!activeMethod) {
        return (
            <div className="p-6 max-w-md mx-auto">
                <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                        {recoveryReason ? RECOVERY_COPY[recoveryReason].title : DEFAULT_COPY.title}
                    </h2>

                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        {recoveryReason ? RECOVERY_COPY[recoveryReason].description : DEFAULT_COPY.description}
                    </p>
                </div>

                <div className="space-y-2">
                    {methods.map(method => (
                        <button
                            key={method.id}
                            onClick={() => method.available && setActiveMethod(method.id)}
                            disabled={!method.available}
                            className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
                                method.available
                                    ? 'bg-grayscale-10 hover:bg-grayscale-100 text-grayscale-900'
                                    : 'bg-grayscale-10 text-grayscale-400 cursor-not-allowed opacity-60'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                method.available ? 'bg-emerald-50 text-emerald-700' : 'bg-grayscale-200 text-grayscale-400'
                            }`}>
                                <IonIcon icon={method.icon} className="text-lg" />
                            </div>

                            <div className="flex-1 text-left">
                                <p className="font-medium text-sm">{method.label}</p>

                                <p className="text-xs text-grayscale-500 mt-0.5">
                                    {method.available ? method.desc : 'Not set up'}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>

                <button
                    onClick={onCancel}
                    className="w-full mt-6 py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                >
                    Cancel
                </button>
            </div>
        );
    }

    // ── Active method detail ─────────────────────────────────────

    return (
        <div className="p-6 max-w-md mx-auto">
            <button
                onClick={() => {
                    setActiveMethod(null);
                    setError(null);
                }}
                className="flex items-center gap-1 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors mb-5"
            >
                <IonIcon icon={chevronBackOutline} className="text-xs" />
                Back
            </button>

            {error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                    <IonIcon icon={alertCircleOutline} className="text-red-400 text-lg mt-0.5 shrink-0" />

                    <span className="text-sm text-red-700 leading-relaxed">{error}</span>
                </div>
            )}

            {activeMethod === 'password' && (
                <div className="space-y-5">
                    <div>
                        <h3 className="text-lg font-semibold text-grayscale-900 mb-1">Recovery Password</h3>

                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            Enter the password you created when setting up recovery.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-grayscale-700 mb-1.5">Password</label>

                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter your recovery password"
                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                        />
                    </div>

                    <button
                        onClick={handlePasswordRecovery}
                        disabled={loading || !password}
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Recovering...
                            </span>
                        ) : 'Recover Account'}
                    </button>
                </div>
            )}

            {activeMethod === 'passkey' && (
                <div className="space-y-5">
                    <div>
                        <h3 className="text-lg font-semibold text-grayscale-900 mb-1">Passkey</h3>

                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            Use your device's biometric authentication to recover.
                        </p>
                    </div>

                    <div className="p-6 bg-emerald-50 rounded-2xl text-center">
                        <IonIcon icon={fingerPrint} className="text-5xl text-emerald-600 mb-3" />

                        <p className="text-sm text-emerald-800">
                            Tap below to verify with Face ID, Touch ID, or your device passkey.
                        </p>
                    </div>

                    <button
                        onClick={handlePasskeyRecovery}
                        disabled={loading}
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Verifying...
                            </span>
                        ) : 'Verify with Passkey'}
                    </button>
                </div>
            )}

            {activeMethod === 'phrase' && (
                <div className="space-y-5">
                    <div>
                        <h3 className="text-lg font-semibold text-grayscale-900 mb-1">Recovery Phrase</h3>

                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            Enter your 25-word recovery phrase, separated by spaces.
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-medium text-grayscale-700">Your phrase</label>

                            <span className={`text-xs font-medium ${phraseWordCount >= 25 ? 'text-emerald-600' : 'text-grayscale-400'}`}>
                                {phraseWordCount} / 25 words
                            </span>
                        </div>

                        <textarea
                            value={phrase}
                            onChange={e => setPhrase(e.target.value)}
                            placeholder="word1 word2 word3 ..."
                            rows={4}
                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white font-mono resize-none"
                        />
                    </div>

                    <button
                        onClick={handlePhraseRecovery}
                        disabled={loading || phraseWordCount < 25}
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Recovering...
                            </span>
                        ) : 'Recover Account'}
                    </button>
                </div>
            )}

            {activeMethod === 'device' && onRecoverWithDevice && (
                <div className="space-y-5">
                    <div>
                        <h3 className="text-lg font-semibold text-grayscale-900 mb-1">Sign In from Another Device</h3>

                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            Scan the QR code below with a device that's already signed in to your account.
                        </p>
                    </div>

                    <QrLoginRequester
                        serverUrl={getAuthConfig().serverUrl}
                        hideHeader
                        onApproved={async (deviceShare) => {
                            setLoading(true);
                            setError(null);

                            try {
                                await onRecoverWithDevice(deviceShare);
                            } catch (e) {
                                setError(friendlyError(e));
                                setLoading(false);
                            }
                        }}
                        onCancel={() => {
                            setActiveMethod(null);
                            setError(null);
                        }}
                        renderQrCode={(data) => (
                            <QRCodeSVG value={data} size={192} level="M" />
                        )}
                    />
                </div>
            )}

            {activeMethod === 'email' && onRecoverWithEmail && (
                <div className="space-y-5">
                    <div>
                        <h3 className="text-lg font-semibold text-grayscale-900 mb-1">Email Recovery Key</h3>

                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            Paste the recovery key from the email we sent when your account was created.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-grayscale-700 mb-1.5">Recovery Key</label>

                        <textarea
                            value={emailShare}
                            onChange={e => setEmailShare(e.target.value)}
                            placeholder="Paste your recovery key here"
                            rows={3}
                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white font-mono resize-none"
                        />
                    </div>

                    <button
                        onClick={handleEmailRecovery}
                        disabled={loading || !emailShare.trim()}
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Recovering...
                            </span>
                        ) : 'Recover Account'}
                    </button>
                </div>
            )}

            {activeMethod === 'backup' && (
                <div className="space-y-5">
                    <div>
                        <h3 className="text-lg font-semibold text-grayscale-900 mb-1">Backup File</h3>

                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            Upload your backup file and enter the password you used when creating it.
                        </p>
                    </div>

                    <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${
                        backupFile ? 'border-emerald-300 bg-emerald-50' : 'border-grayscale-300 hover:border-grayscale-400'
                    }`}>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="backup-file-input"
                        />

                        <label htmlFor="backup-file-input" className="cursor-pointer block">
                            <IonIcon
                                icon={cloudUploadOutline}
                                className={`text-4xl mb-2 ${backupFile ? 'text-emerald-600' : 'text-grayscale-400'}`}
                            />

                            <p className={`text-sm ${backupFile ? 'text-emerald-700 font-medium' : 'text-grayscale-600'}`}>
                                {backupFile ? 'File selected' : 'Tap to choose backup file'}
                            </p>
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-grayscale-700 mb-1.5">Backup Password</label>

                        <input
                            type="password"
                            value={backupPassword}
                            onChange={e => setBackupPassword(e.target.value)}
                            placeholder="Password used when creating backup"
                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                        />
                    </div>

                    <button
                        onClick={handleBackupRecovery}
                        disabled={loading || !backupFile || !backupPassword}
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Recovering...
                            </span>
                        ) : 'Recover Account'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default RecoveryFlowModal;
