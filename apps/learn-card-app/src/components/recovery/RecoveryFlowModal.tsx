import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    fingerPrint,
    documentTextOutline,
    alertCircleOutline,
    cloudUploadOutline,
    phonePortraitOutline,
    chevronBackOutline,
    mailOutline,
    checkmarkCircleOutline,
} from 'ionicons/icons';
import { QRCodeSVG } from 'qrcode.react';

import { Capacitor } from '@capacitor/core';
import { isWebAuthnSupported } from '@learncard/sss-key-manager';
import { QrLoginRequester, getSSSConfig } from 'learn-card-base';
import type { RecoveryReason } from 'learn-card-base';
import * as m from '../../paraglide/messages.js';

export type RecoveryFlowType = 'passkey' | 'phrase' | 'backup' | 'device' | 'email';

interface RecoveryFlowModalProps {
    availableMethods: { type: string; credentialId?: string; createdAt: string }[];
    recoveryReason?: RecoveryReason;
    maskedRecoveryEmail?: string | null;
    onRecoverWithPasskey: (credentialId: string) => Promise<void>;
    onRecoverWithPhrase: (phrase: string) => Promise<void>;
    onRecoverWithBackup: (fileContents: string, password: string) => Promise<void>;
    onRecoverWithDevice?: (deviceShare: string, shareVersion?: number) => Promise<void>;
    onRecoverWithEmail?: (emailShare: string) => Promise<void>;
    identityPhase?: 'enter_email' | 'verify_email' | 'choose_method' | 'new_login' | 'success';
    identityEmail?: string;
    onSendIdentityCode?: (email: string) => Promise<void>;
    onVerifyIdentityCode?: (code: string) => Promise<void>;
    onContinueWithNewLogin?: () => void;
    onFinishIdentityRecovery?: () => void;
    onCancel: () => void;
}

const friendlyError = (e: unknown): string => {
    if (e instanceof Error) {
        if (e.message.includes('decrypt')) return m['recovery.incorrectPassword']();
        if (e.message.includes('network') || e.message.includes('fetch'))
            return m['recovery.connectionIssue']();
        if (e.message.includes('phrase') || e.message.includes('mnemonic'))
            return m['recovery.phraseInvalid']();
        if (e.message.toLowerCase().includes('too many')) {
            return m['recovery.identity.tooManyAttempts']();
        }
        if (e.message.toLowerCase().includes('code')) {
            return m['recovery.identity.invalidCode']();
        }
        if (e.message.toLowerCase().includes('incorrect key')) {
            return m['recovery.identity.invalidRecoveryMethod']();
        }
    }

    return m['recovery.somethingWrong']();
};

const getRecoveryCopy = (): Record<RecoveryReason, { title: string; description: string }> => ({
    new_device: {
        title: m['recovery.verifyIdentity'](),
        description: m['recovery.newDeviceDesc'](),
    },
    stale_local_key: {
        title: m['recovery.verifyIdentity'](),
        description: m['recovery.securityUpdated'](),
    },
    missing_server_data: {
        title: m['recovery.restoreAccess'](),
        description: m['recovery.restoreAccessDesc'](),
    },
});

const getDefaultCopy = () => ({
    title: m['recovery.restoreAccess'](),
    description: m['recovery.restoreAccessShort'](),
});

export const RecoveryFlowModal: React.FC<RecoveryFlowModalProps> = ({
    availableMethods,
    recoveryReason,
    maskedRecoveryEmail,
    onRecoverWithPasskey,
    onRecoverWithPhrase,
    onRecoverWithBackup,
    onRecoverWithDevice,
    onRecoverWithEmail,
    identityPhase,
    identityEmail,
    onSendIdentityCode,
    onVerifyIdentityCode,
    onContinueWithNewLogin,
    onFinishIdentityRecovery,
    onCancel,
}) => {
    const [activeMethod, setActiveMethod] = useState<RecoveryFlowType | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [phrase, setPhrase] = useState('');
    const [backupFile, setBackupFile] = useState<string | null>(null);
    const [backupPassword, setBackupPassword] = useState('');
    const [emailShare, setEmailShare] = useState('');
    const [recoveryEmail, setRecoveryEmail] = useState(identityEmail ?? '');
    const [verificationCode, setVerificationCode] = useState('');

    const hasMethod = (type: string) => availableMethods.some(m => m.type === type);
    const webAuthnSupported = isWebAuthnSupported();

    const handlePasskeyRecovery = async () => {
        const passkeyMethod = availableMethods.find(m => m.type === 'passkey');

        if (!passkeyMethod?.credentialId) {
            setError(m['recovery.noPasskey']());
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
            setError(m['recovery.phraseTooShort']());
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
            setError(m['recovery.selectBackupFile']());
            return;
        }

        if (!backupPassword) {
            setError(m['recovery.enterBackupPassword']());
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

            reader.onload = e => {
                setBackupFile(e.target?.result as string);
            };

            reader.readAsText(file);
        }
    };

    const handleEmailRecovery = async () => {
        if (!emailShare.trim()) {
            setError(m['recovery.pasteRecoveryKey']());
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
        {
            id: 'email' as const,
            label: m['recovery.emailRecoveryLabel'](),
            desc: m['recovery.method.emailDesc'](),
            icon: mailOutline,
            available: hasMethod('email') && !!onRecoverWithEmail,
        },
        {
            id: 'phrase' as const,
            label: m['recovery.method.phrase'](),
            desc: m['recovery.phraseEnter25'](),
            icon: documentTextOutline,
            available: hasMethod('phrase'),
        },
        {
            id: 'backup' as const,
            label: m['recovery.method.backup'](),
            desc: m['recovery.method.backupDesc'](),
            icon: cloudUploadOutline,
            available: hasMethod('backup'),
        },
        {
            id: 'passkey' as const,
            label: m['recovery.method.passkey'](),
            desc: m['recovery.method.passkeyDesc'](),
            icon: fingerPrint,
            available: hasMethod('passkey') && webAuthnSupported,
        },
        {
            id: 'device' as const,
            label: m['recovery.signInFromDevice'](),
            desc: m['recovery.anotherDeviceDesc'](),
            icon: phonePortraitOutline,
            available: !!onRecoverWithDevice,
        },
    ];

    // Hide passkey entirely on native platforms (WebAuthn unavailable in WKWebView / Android WebView)
    const methods = Capacitor.isNativePlatform()
        ? allMethods.filter(m => m.id !== 'passkey')
        : allMethods;

    const phraseWordCount = phrase.trim() ? phrase.trim().split(/\s+/).length : 0;

    const identityError = error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
            <IonIcon icon={alertCircleOutline} className="text-red-400 text-lg mt-0.5 shrink-0" />
            <span className="text-sm text-red-700 leading-relaxed">{error}</span>
        </div>
    );

    if (identityPhase === 'enter_email') {
        return (
            <div className="p-6 max-w-md mx-auto font-poppins">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <IonIcon icon={mailOutline} className="text-2xl" />
                    </div>
                    <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                        {m['recovery.identity.title']()}
                    </h2>
                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        {m['recovery.identity.emailDescription']()}
                    </p>
                </div>

                {identityError}

                <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                    {m['recovery.identity.recoveryEmailLabel']()}
                </label>
                <input
                    type="email"
                    value={recoveryEmail}
                    onChange={event => setRecoveryEmail(event.target.value)}
                    placeholder={m['recovery.identity.recoveryEmailPlaceholder']()}
                    autoComplete="email"
                    className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                />

                <button
                    onClick={async () => {
                        if (!recoveryEmail.trim() || !onSendIdentityCode) return;
                        setLoading(true);
                        setError(null);
                        try {
                            await onSendIdentityCode(recoveryEmail.trim());
                        } catch (e) {
                            setError(friendlyError(e));
                        } finally {
                            setLoading(false);
                        }
                    }}
                    disabled={loading || !recoveryEmail.trim()}
                    className="w-full mt-5 py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {m['recovery.identity.sendingCode']()}
                        </span>
                    ) : (
                        m['recovery.identity.sendCode']()
                    )}
                </button>
                <button
                    onClick={onCancel}
                    className="w-full mt-3 py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                >
                    {m['common.cancel']()}
                </button>
            </div>
        );
    }

    if (identityPhase === 'verify_email') {
        return (
            <div className="p-6 max-w-md mx-auto font-poppins">
                <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                    {m['recovery.identity.checkEmail']()}
                </h2>
                <p className="text-sm text-grayscale-600 leading-relaxed mb-5">
                    {m['recovery.identity.codeDescription']()}
                </p>
                {identityError}
                <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                    {m['recovery.identity.codeLabel']()}
                </label>
                <input
                    type="text"
                    inputMode="numeric"
                    value={verificationCode}
                    onChange={event =>
                        setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    placeholder="000000"
                    autoComplete="one-time-code"
                    className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-center tracking-[0.3em] text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                />
                <button
                    onClick={async () => {
                        if (verificationCode.length !== 6 || !onVerifyIdentityCode) return;
                        setLoading(true);
                        setError(null);
                        try {
                            await onVerifyIdentityCode(verificationCode);
                        } catch (e) {
                            setError(friendlyError(e));
                        } finally {
                            setLoading(false);
                        }
                    }}
                    disabled={loading || verificationCode.length !== 6}
                    className="w-full mt-5 py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {m['common.verifying']()}
                        </span>
                    ) : (
                        m['recovery.identity.verifyCode']()
                    )}
                </button>
                <button
                    onClick={onCancel}
                    className="w-full mt-3 py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                >
                    {m['common.cancel']()}
                </button>
            </div>
        );
    }

    if (identityPhase === 'new_login') {
        return (
            <div className="p-8 max-w-md mx-auto text-center font-poppins">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <IonIcon icon={checkmarkCircleOutline} className="text-2xl" />
                </div>
                <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                    {m['recovery.identity.keyVerified']()}
                </h2>
                <p className="text-sm text-grayscale-600 leading-relaxed mb-6">
                    {m['recovery.identity.newLoginDescription']()}
                </p>
                <button
                    onClick={onContinueWithNewLogin}
                    className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                >
                    {m['recovery.identity.continueToLogin']()}
                </button>
            </div>
        );
    }

    if (identityPhase === 'success') {
        return (
            <div className="p-8 max-w-md mx-auto text-center font-poppins">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <IonIcon icon={checkmarkCircleOutline} className="text-3xl" />
                </div>
                <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                    {m['recovery.identity.successTitle']()}
                </h2>
                <p className="text-sm text-grayscale-600 leading-relaxed mb-6">
                    {m['recovery.identity.successDescription']()}
                </p>
                <button
                    onClick={onFinishIdentityRecovery}
                    className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                >
                    {m['common.done']()}
                </button>
            </div>
        );
    }

    // ── Method picker ────────────────────────────────────────────

    if (!activeMethod) {
        return (
            <div className="p-6 max-w-md mx-auto">
                <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                        {recoveryReason
                            ? getRecoveryCopy()[recoveryReason].title
                            : identityPhase === 'choose_method'
                              ? m['recovery.identity.chooseMethod']()
                              : getDefaultCopy().title}
                    </h2>

                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        {recoveryReason
                            ? getRecoveryCopy()[recoveryReason].description
                            : identityPhase === 'choose_method'
                              ? m['recovery.identity.chooseMethodDescription']()
                              : getDefaultCopy().description}
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
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                    method.available
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-grayscale-200 text-grayscale-400'
                                }`}
                            >
                                <IonIcon icon={method.icon} className="text-lg" />
                            </div>

                            <div className="flex-1 text-left">
                                <p className="font-medium text-sm">{method.label}</p>

                                <p className="text-xs text-grayscale-500 mt-0.5">
                                    {method.available
                                        ? method.desc
                                        : m['recovery.method.passkeyNotSetup']()}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>

                <button
                    onClick={onCancel}
                    className="w-full mt-6 py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                >
                    {m['common.cancel']()}
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
                {m['common.back']()}
            </button>

            {error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                    <IonIcon
                        icon={alertCircleOutline}
                        className="text-red-400 text-lg mt-0.5 shrink-0"
                    />

                    <span className="text-sm text-red-700 leading-relaxed">{error}</span>
                </div>
            )}

            {activeMethod === 'passkey' && (
                <div className="space-y-5">
                    <div>
                        <h3 className="text-lg font-semibold text-grayscale-900 mb-1">
                            {m['recovery.method.passkey']()}
                        </h3>

                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            {m['recovery.passkeyRecoverDesc']()}
                        </p>
                    </div>

                    <div className="p-6 bg-emerald-50 rounded-2xl text-center">
                        <IonIcon icon={fingerPrint} className="text-5xl text-emerald-600 mb-3" />

                        <p className="text-sm text-emerald-800">
                            {m['recovery.passkeyVerifyDesc']()}
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
                                {m['common.verifying']()}
                            </span>
                        ) : (
                            m['recovery.verifyPasskey']()
                        )}
                    </button>
                </div>
            )}

            {activeMethod === 'phrase' && (
                <div className="space-y-5">
                    <div>
                        <h3 className="text-lg font-semibold text-grayscale-900 mb-1">
                            {m['recovery.method.phrase']()}
                        </h3>

                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            {m['recovery.phraseEnterDesc']()}
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-medium text-grayscale-700">
                                {m['recovery.yourPhrase']()}
                            </label>

                            <span
                                className={`text-xs font-medium ${
                                    phraseWordCount >= 25
                                        ? 'text-emerald-600'
                                        : 'text-grayscale-400'
                                }`}
                            >
                                {m['recovery.wordsCount']({ count: String(phraseWordCount) })}
                            </span>
                        </div>

                        <textarea
                            value={phrase}
                            onChange={e => setPhrase(e.target.value)}
                            placeholder={m['recovery.placeholder.words']()}
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
                                {m['recovery.recovering']()}
                            </span>
                        ) : (
                            m['recovery.recoverAccount']()
                        )}
                    </button>
                </div>
            )}

            {activeMethod === 'device' && onRecoverWithDevice && (
                <div className="space-y-5">
                    <div>
                        <h3 className="text-lg font-semibold text-grayscale-900 mb-1">
                            {m['recovery.signInFromDevice']()}
                        </h3>

                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            {m['recovery.scanQrDescription']()}
                        </p>
                    </div>

                    <QrLoginRequester
                        serverUrl={getSSSConfig().serverUrl}
                        hideHeader
                        onApproved={async (deviceShare, _approverDid, _hint, version) => {
                            setLoading(true);
                            setError(null);

                            try {
                                await onRecoverWithDevice(deviceShare, version);
                            } catch (e) {
                                setError(friendlyError(e));
                                setLoading(false);
                            }
                        }}
                        onCancel={() => {
                            setActiveMethod(null);
                            setError(null);
                        }}
                        renderQrCode={data => <QRCodeSVG value={data} size={192} level="M" />}
                    />
                </div>
            )}

            {activeMethod === 'email' && onRecoverWithEmail && (
                <div className="space-y-5">
                    <div>
                        <h3 className="text-lg font-semibold text-grayscale-900 mb-1">
                            {m['recovery.method.setEmail']()}
                        </h3>

                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            {maskedRecoveryEmail ? (
                                <>{m['recovery.recoveryEmailSent']()}</>
                            ) : (
                                m['recovery.recoveryEmailSent']()
                            )}
                        </p>
                    </div>

                    <div className="p-4 bg-grayscale-100/60 rounded-2xl space-y-3">
                        <p className="text-xs font-medium text-grayscale-700">
                            {m['recovery.howToFindKey']()}
                        </p>

                        <ol className="text-sm text-grayscale-600 leading-relaxed space-y-2 list-none">
                            <li className="flex items-start gap-2.5">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-grayscale-900 text-white text-xs font-medium flex items-center justify-center mt-0.5">
                                    1
                                </span>
                                <span>{m['recovery.step.searchInbox']()}</span>
                            </li>

                            <li className="flex items-start gap-2.5">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-grayscale-900 text-white text-xs font-medium flex items-center justify-center mt-0.5">
                                    2
                                </span>
                                <span>{m['recovery.step.findKey']()}</span>
                            </li>

                            <li className="flex items-start gap-2.5">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-grayscale-900 text-white text-xs font-medium flex items-center justify-center mt-0.5">
                                    3
                                </span>
                                <span>{m['recovery.step.copyKey']()}</span>
                            </li>
                        </ol>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                            {m['recovery.recoveryKeyLabel']()}
                        </label>

                        <textarea
                            value={emailShare}
                            onChange={e => setEmailShare(e.target.value)}
                            placeholder={m['recovery.placeholder.recoveryKey']()}
                            rows={3}
                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white font-mono resize-none"
                        />

                        <p className="mt-1.5 text-xs text-grayscale-400">
                            {m['recovery.recoveryKeyHint']()}
                        </p>
                    </div>

                    <button
                        onClick={handleEmailRecovery}
                        disabled={loading || !emailShare.trim()}
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {m['recovery.recovering']()}
                            </span>
                        ) : (
                            m['recovery.recoverAccount']()
                        )}
                    </button>
                </div>
            )}

            {activeMethod === 'backup' && (
                <div className="space-y-5">
                    <div>
                        <h3 className="text-lg font-semibold text-grayscale-900 mb-1">
                            {m['recovery.method.backup']()}
                        </h3>

                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            {m['recovery.backupUploadDesc']()}
                        </p>
                    </div>

                    <div
                        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${
                            backupFile
                                ? 'border-emerald-300 bg-emerald-50'
                                : 'border-grayscale-300 hover:border-grayscale-400'
                        }`}
                    >
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
                                className={`text-4xl mb-2 ${
                                    backupFile ? 'text-emerald-600' : 'text-grayscale-400'
                                }`}
                            />

                            <p
                                className={`text-sm ${
                                    backupFile
                                        ? 'text-emerald-700 font-medium'
                                        : 'text-grayscale-600'
                                }`}
                            >
                                {backupFile
                                    ? m['recovery.action.fileSelected']()
                                    : m['recovery.action.tapToChoose']()}
                            </p>
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                            {m['recovery.backupPassword']()}
                        </label>

                        <input
                            type="password"
                            value={backupPassword}
                            onChange={e => setBackupPassword(e.target.value)}
                            placeholder={m['recovery.enterPassword']()}
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
                                {m['recovery.recovering']()}
                            </span>
                        ) : (
                            m['recovery.recoverAccount']()
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default RecoveryFlowModal;
