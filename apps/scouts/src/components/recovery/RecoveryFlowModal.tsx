import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { fingerPrint, documentTextOutline, alertCircleOutline, cloudUploadOutline, phonePortraitOutline, chevronBackOutline, mailOutline } from 'ionicons/icons';
import { QRCodeSVG } from 'qrcode.react';

import { Capacitor } from '@capacitor/core';
import { isWebAuthnSupported } from '@learncard/sss-key-manager';
import { QrLoginRequester, getSSSConfig } from 'learn-card-base';
import type { RecoveryReason } from 'learn-card-base';
import * as m from '../../paraglide/messages.js';
import { TransP } from '../../i18n/TransP';

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
    onCancel: () => void;
}

const friendlyError = (e: unknown): string => {
    if (e instanceof Error) {
        if (e.message.includes('decrypt')) return m['recovery.errors.decryptFailed']();
        if (e.message.includes('network') || e.message.includes('fetch')) return m['error.network']();
        if (e.message.includes('phrase') || e.message.includes('mnemonic')) return m['recovery.errors.phraseInvalid']();
        return e.message;
    }

    return m['error.generic']();
};

const RECOVERY_COPY: Record<RecoveryReason, { title: string; description: string }> = {
    new_device: {
        title: m['recovery.methodPicker.title'](),
        description: m['recovery.methodPicker.descNewDevice'](),
    },
    stale_local_key: {
        title: m['recovery.methodPicker.title'](),
        description: m['recovery.methodPicker.descStaleKey'](),
    },
    missing_server_data: {
        title: m['recovery.methodPicker.restoreTitle'](),
        description: m['recovery.methodPicker.restoreDescMissing'](),
    },
};

const DEFAULT_COPY = {
    title: m['recovery.methodPicker.restoreTitle'](),
    description: m['recovery.methodPicker.restoreDescDefault'](),
};

export const RecoveryFlowModal: React.FC<RecoveryFlowModalProps> = ({
    availableMethods,
    recoveryReason,
    maskedRecoveryEmail,
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

    const [phrase, setPhrase] = useState('');
    const [backupFile, setBackupFile] = useState<string | null>(null);
    const [backupPassword, setBackupPassword] = useState('');
    const [emailShare, setEmailShare] = useState('');

    const hasMethod = (type: string) => availableMethods.some(m => m.type === type);
    const webAuthnSupported = isWebAuthnSupported();

    const handlePasskeyRecovery = async () => {
        const passkeyMethod = availableMethods.find(m => m.type === 'passkey');

        if (!passkeyMethod?.credentialId) {
            setError(m['recovery.errors.noPasskey']());
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
            setError(m['recovery.errors.phraseIncomplete']());
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
            setError(m['recovery.errors.noBackupFile']());
            return;
        }

        if (!backupPassword) {
            setError(m['recovery.errors.noBackupPass']());
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
            setError(m['recovery.errors.noEmailKey']());
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
        { id: 'email' as const, label: m['recovery.method.emailLabel'](), desc: m['recovery.method.emailDesc'](), icon: mailOutline, available: hasMethod('email') && !!onRecoverWithEmail },
        { id: 'phrase' as const, label: m['recovery.method.phraseLabel'](), desc: m['recovery.method.phraseDesc'](), icon: documentTextOutline, available: hasMethod('phrase') },
        { id: 'backup' as const, label: m['recovery.method.backupLabel'](), desc: m['recovery.method.backupDesc'](), icon: cloudUploadOutline, available: hasMethod('backup') },
        { id: 'passkey' as const, label: m['recovery.method.passkeyLabel'](), desc: m['recovery.method.passkeyDesc'](), icon: fingerPrint, available: hasMethod('passkey') && webAuthnSupported },
        { id: 'device' as const, label: m['recovery.method.deviceLabel'](), desc: m['recovery.method.deviceDesc'](), icon: phonePortraitOutline, available: !!onRecoverWithDevice },
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
                                    {method.available ? method.desc : m['recovery.method.notSetUp']()}
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
                    <IonIcon icon={alertCircleOutline} className="text-red-400 text-lg mt-0.5 shrink-0" />

                    <span className="text-sm text-red-700 leading-relaxed">{error}</span>
                </div>
            )}

            {activeMethod === 'passkey' && (
                <div className="space-y-5">
                    <div>
                        <h3 className="text-lg font-semibold text-grayscale-900 mb-1">{m['recovery.passkey.title']()}</h3>

                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            {m['recovery.passkey.desc']()}
                        </p>
                    </div>

                    <div className="p-6 bg-emerald-50 rounded-2xl text-center">
                        <IonIcon icon={fingerPrint} className="text-5xl text-emerald-600 mb-3" />

                        <p className="text-sm text-emerald-800">
                            {m['recovery.passkey.tapDesc']()}
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
                        ) : m['recovery.passkey.verifyBtn']()}
                    </button>
                </div>
            )}

            {activeMethod === 'phrase' && (
                <div className="space-y-5">
                    <div>
                        <h3 className="text-lg font-semibold text-grayscale-900 mb-1">{m['recovery.phrase.title']()}</h3>

                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            {m['recovery.phrase.desc']()}
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-medium text-grayscale-700">{m['recovery.phrase.label']()}</label>

                            <span className={`text-xs font-medium ${phraseWordCount >= 25 ? 'text-emerald-600' : 'text-grayscale-400'}`}>
                                {m['recovery.phrase.wordCount']({ count: phraseWordCount })}
                            </span>
                        </div>

                        <textarea
                            value={phrase}
                            onChange={e => setPhrase(e.target.value)}
                            placeholder={m['recovery.phrase.placeholder']()}
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
                                {m['recovery.phrase.loading']()}
                            </span>
                        ) : m['recovery.phrase.recoverBtn']()}
                    </button>
                </div>
            )}

            {activeMethod === 'device' && onRecoverWithDevice && (
                <div className="space-y-5">
                    <div>
                        <h3 className="text-lg font-semibold text-grayscale-900 mb-1">{m['recovery.device.title']()}</h3>

                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            {m['recovery.device.desc']()}
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
                        renderQrCode={(data) => (
                            <QRCodeSVG value={data} size={192} level="M" />
                        )}
                    />
                </div>
            )}

            {activeMethod === 'email' && onRecoverWithEmail && (
                <div className="space-y-5">
                    <div>
                        <h3 className="text-lg font-semibold text-grayscale-900 mb-1">{m['recovery.email.title']()}</h3>

                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            {maskedRecoveryEmail
                                ? <TransP m={m['recovery.email.descWithEmail']} values={{ email: maskedRecoveryEmail }} components={[<strong key="b" />]} />
                                : m['recovery.email.descWithoutEmail']()
                            }
                        </p>
                    </div>

                    <div className="p-4 bg-grayscale-100/60 rounded-2xl space-y-3">
                        <p className="text-xs font-medium text-grayscale-700">{m['recovery.email.findKey']()}</p>

                        <ol className="text-sm text-grayscale-600 leading-relaxed space-y-2 list-none">
                            <li className="flex items-start gap-2.5">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-grayscale-900 text-white text-xs font-medium flex items-center justify-center mt-0.5">1</span>
                                <TransP m={m['recovery.email.step1']} components={[<strong key="b" />]} />
                            </li>

                            <li className="flex items-start gap-2.5">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-grayscale-900 text-white text-xs font-medium flex items-center justify-center mt-0.5">2</span>
                                <TransP m={m['recovery.email.step2']} components={[<strong key="b0" />, <strong key="b1" />]} />
                            </li>

                            <li className="flex items-start gap-2.5">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-grayscale-900 text-white text-xs font-medium flex items-center justify-center mt-0.5">3</span>
                                <span>{m['recovery.email.step3']()}</span>
                            </li>
                        </ol>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-grayscale-700 mb-1.5">{m['recovery.email.keyLabel']()}</label>

                        <textarea
                            value={emailShare}
                            onChange={e => setEmailShare(e.target.value)}
                            placeholder={m['recovery.email.keyPlaceholder']()}
                            rows={3}
                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white font-mono resize-none"
                        />

                        <p className="mt-1.5 text-xs text-grayscale-400">
                            {m['recovery.email.keyHint']()}
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
                                {m['recovery.phrase.loading']()}
                            </span>
                        ) : m['recovery.phrase.recoverBtn']()}
                    </button>
                </div>
            )}

            {activeMethod === 'backup' && (
                <div className="space-y-5">
                    <div>
                        <h3 className="text-lg font-semibold text-grayscale-900 mb-1">{m['recovery.backup.title']()}</h3>

                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            {m['recovery.backup.desc']()}
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
                                {backupFile ? m['recovery.backup.fileSelected']() : m['recovery.backup.tapToChoose']()}
                            </p>
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-grayscale-700 mb-1.5">{m['recovery.backup.passLabel']()}</label>

                        <input
                            type="password"
                            value={backupPassword}
                            onChange={e => setBackupPassword(e.target.value)}
                            placeholder={m['recovery.backup.passPlaceholder']()}
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
                                {m['recovery.phrase.loading']()}
                            </span>
                        ) : m['recovery.phrase.recoverBtn']()}
                    </button>
                </div>
            )}
        </div>
    );
};

export default RecoveryFlowModal;
